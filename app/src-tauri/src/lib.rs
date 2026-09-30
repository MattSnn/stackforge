//! Backend fino: o trabalho de verdade é feito pelo engine Node (resources/engine.mjs).
//! Aqui só iniciamos o processo, repassamos os eventos para a UI e cuidamos do cancelamento.

use std::io::{BufRead, BufReader, Write};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::Mutex;

use serde_json::{json, Value};
use tauri::path::BaseDirectory;
use tauri::{AppHandle, Emitter, Manager, State};

#[cfg(windows)]
use std::os::windows::process::CommandExt;

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

#[derive(Default)]
struct Engine {
    pid: Mutex<Option<u32>>,
}

fn engine_path(app: &AppHandle) -> Result<PathBuf, String> {
    let path = app
        .path()
        .resolve("resources/engine.mjs", BaseDirectory::Resource)
        .map_err(|e| e.to_string())?;
    // O Tauri devolve caminhos no formato estendido (\\?\C:\...), que o Node não consegue abrir.
    let text = path.to_string_lossy();
    Ok(match text.strip_prefix(r"\\?\") {
        Some(plain) => PathBuf::from(plain),
        None => path,
    })
}

/// Comando sem janela de console piscando.
fn silent(program: &str) -> Command {
    #[allow(unused_mut)]
    let mut cmd = Command::new(program);
    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);
    cmd
}

#[tauri::command]
async fn detect_tools(app: AppHandle) -> Result<Value, String> {
    let engine = engine_path(&app)?;
    let output = tauri::async_runtime::spawn_blocking(move || {
        silent("node").arg(engine).arg("detect").output()
    })
    .await
    .map_err(|e| e.to_string())?;

    match output {
        Ok(out) if out.status.success() => {
            serde_json::from_slice(&out.stdout).map_err(|e| e.to_string())
        }
        // Node existe, mas o engine falhou: devolve o erro real em vez de fingir que falta o Node.
        Ok(out) => {
            let stderr = String::from_utf8_lossy(&out.stderr);
            let stdout = String::from_utf8_lossy(&out.stdout);
            Err(format!("O engine falhou ao iniciar:\n{}{}", stderr.trim(), stdout.trim()))
        }
        // Não foi possível executar "node": a UI mostra o onboarding.
        Err(_) => Ok(json!({ "node": null })),
    }
}

#[tauri::command]
fn create_project(app: AppHandle, state: State<Engine>, config: String) -> Result<(), String> {
    let mut pid = state.pid.lock().unwrap();
    if pid.is_some() {
        return Err("Já existe uma criação em andamento.".into());
    }

    let engine = engine_path(&app)?;
    let mut child = silent("node")
        .arg(engine)
        .args(["create", "--stdin"])
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Não foi possível iniciar o Node: {e}"))?;

    {
        let mut stdin = child.stdin.take().expect("stdin");
        stdin
            .write_all(config.as_bytes())
            .map_err(|e| e.to_string())?;
    } // stdin fechado aqui → o engine recebe EOF

    *pid = Some(child.id());
    let stdout = child.stdout.take().expect("stdout");
    let stderr = child.stderr.take().expect("stderr");

    let err_app = app.clone();
    std::thread::spawn(move || {
        for line in BufReader::new(stderr).lines().map_while(Result::ok) {
            let _ = err_app.emit("engine://event", json!({ "type": "log", "text": line }));
        }
    });

    std::thread::spawn(move || {
        for line in BufReader::new(stdout).lines().map_while(Result::ok) {
            let event = serde_json::from_str::<Value>(&line)
                .unwrap_or_else(|_| json!({ "type": "log", "text": line }));
            let _ = app.emit("engine://event", event);
        }
        let code = child.wait().ok().and_then(|s| s.code());
        *app.state::<Engine>().pid.lock().unwrap() = None;
        let _ = app.emit("engine://exit", json!({ "code": code }));
    });

    Ok(())
}

#[tauri::command]
fn cancel_create(state: State<Engine>) -> Result<(), String> {
    if let Some(pid) = *state.pid.lock().unwrap() {
        // /T encerra a árvore inteira (node → npm → …)
        silent("taskkill")
            .args(["/PID", &pid.to_string(), "/T", "/F"])
            .output()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn open_target(app: AppHandle, target: String, path: String, pm: Option<String>) -> Result<(), String> {
    let engine = engine_path(&app)?;
    silent("node")
        .arg(engine)
        .args(["open", &target, &path, pm.as_deref().unwrap_or("npm")])
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// "free" (não existe), "empty" (existe vazia), "taken" (existe com arquivos), "missing-parent".
#[tauri::command]
fn check_target(parent: String, name: String) -> String {
    let parent = Path::new(&parent);
    if !parent.is_dir() {
        return "missing-parent".into();
    }
    let dir = parent.join(name);
    match std::fs::read_dir(&dir) {
        Ok(mut entries) => {
            if entries.next().is_some() {
                "taken".into()
            } else {
                "empty".into()
            }
        }
        Err(_) => "free".into(),
    }
}

#[tauri::command]
fn path_exists(path: String) -> bool {
    Path::new(&path).exists()
}

/// Pasta-pai sugerida no primeiro uso: C:\dev se existir, senão Documentos.
#[tauri::command]
fn suggest_parent_dir(app: AppHandle) -> String {
    for candidate in ["C:\\dev", "D:\\dev"] {
        if Path::new(candidate).is_dir() {
            return candidate.into();
        }
    }
    app.path()
        .document_dir()
        .map(|p| p.to_string_lossy().into_owned())
        .unwrap_or_default()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(Engine::default())
        .invoke_handler(tauri::generate_handler![
            detect_tools,
            create_project,
            cancel_create,
            open_target,
            check_target,
            path_exists,
            suggest_parent_dir
        ])
        .run(tauri::generate_context!())
        .expect("erro ao iniciar o StackForge");
}
