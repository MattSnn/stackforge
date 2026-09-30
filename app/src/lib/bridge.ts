/**
 * Ponte com o backend Tauri. Fora do Tauri (ex.: `npm run dev` no navegador)
 * usa implementações simuladas para que a UI possa ser desenvolvida e testada.
 */
import { invoke, isTauri } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import type { EngineEvent, PackageManager, ProjectConfig } from '@stackforge/core'
import { planSteps } from '@stackforge/core'

export const inTauri = isTauri()

export interface Tools {
  node: string | null
  npm: string | null
  pnpm: string | null
  bun: string | null
  git: string | null
  code: string | null
}

export type TargetStatus = 'free' | 'empty' | 'taken' | 'missing-parent'
export type OpenTarget = 'vscode' | 'explorer' | 'dev'

export async function detectTools(): Promise<Tools> {
  if (!inTauri) {
    await sleep(300)
    return { node: '24.16.0', npm: '11.13.0', pnpm: null, bun: null, git: '2.54.0', code: '1.139.1' }
  }
  const t = await invoke<Partial<Tools>>('detect_tools')
  return { node: null, npm: null, pnpm: null, bun: null, git: null, code: null, ...t }
}

export async function suggestParentDir(): Promise<string> {
  return inTauri ? invoke<string>('suggest_parent_dir') : 'C:\\dev'
}

export async function checkTarget(parent: string, name: string): Promise<TargetStatus> {
  if (!inTauri) return name === 'existente' ? 'taken' : 'free'
  return invoke<TargetStatus>('check_target', { parent, name })
}

export async function pathExists(path: string): Promise<boolean> {
  return inTauri ? invoke<boolean>('path_exists', { path }) : true
}

export async function pickFolder(defaultPath?: string): Promise<string | null> {
  if (!inTauri) return prompt('Pasta (simulação):', defaultPath ?? 'C:\\dev')
  const { open } = await import('@tauri-apps/plugin-dialog')
  const result = await open({ directory: true, defaultPath: defaultPath || undefined, title: 'Onde criar o projeto?' })
  return typeof result === 'string' ? result : null
}

export function openTarget(target: OpenTarget, path: string, pm: PackageManager = 'npm') {
  if (!inTauri) return console.info('[mock] open', target, path)
  void invoke('open_target', { target, path, pm })
}

/** Inicia a criação e repassa os eventos; resolve quando o processo termina. */
export async function createProject(config: ProjectConfig, onEvent: (e: EngineEvent) => void): Promise<void> {
  if (!inTauri) return mockCreate(config, onEvent)

  const unlistenEvent = await listen<EngineEvent>('engine://event', (e) => onEvent(e.payload))
  let resolveExit!: () => void
  const exited = new Promise<void>((r) => (resolveExit = r))
  const unlistenExit = await listen('engine://exit', () => resolveExit())
  try {
    await invoke('create_project', { config: JSON.stringify(config) })
    await exited
  } finally {
    unlistenEvent()
    unlistenExit()
  }
}

export async function cancelCreate() {
  if (inTauri) await invoke('cancel_create')
  else mockCancelled = true
}

// ---------- janela ----------

export async function windowAction(action: 'minimize' | 'maximize' | 'close') {
  if (!inTauri) return
  const { getCurrentWindow } = await import('@tauri-apps/api/window')
  const w = getCurrentWindow()
  if (action === 'minimize') await w.minimize()
  else if (action === 'maximize') await w.toggleMaximize()
  else await w.close()
}

// ---------- persistência ----------

type StoreLike = { get<T>(key: string): Promise<T | undefined>; set(key: string, value: unknown): Promise<void> }

let storePromise: Promise<StoreLike> | null = null

function getStore(): Promise<StoreLike> {
  storePromise ??= inTauri
    ? import('@tauri-apps/plugin-store').then(({ load }) =>
        load('stackforge.json', { defaults: {}, autoSave: 200 }) as Promise<StoreLike>,
      )
    : Promise.resolve<StoreLike>({
        async get<T>(key: string) {
          try {
            const raw = localStorage.getItem(`stackforge:${key}`)
            return raw ? (JSON.parse(raw) as T) : undefined
          } catch {
            return undefined
          }
        },
        async set(key, value) {
          try {
            localStorage.setItem(`stackforge:${key}`, JSON.stringify(value))
          } catch {
            /* armazenamento indisponível */
          }
        },
      })
  return storePromise
}

export async function loadValue<T>(key: string): Promise<T | undefined> {
  return (await getStore()).get<T>(key)
}

export async function saveValue(key: string, value: unknown) {
  await (await getStore()).set(key, value)
}

// ---------- simulação ----------

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
let mockCancelled = false

async function mockCreate(config: ProjectConfig, onEvent: (e: EngineEvent) => void) {
  mockCancelled = false
  const started = Date.now()
  for (const step of planSteps(config)) {
    if (mockCancelled) return
    onEvent({ type: 'step', id: step.id, status: 'running' })
    const n = step.id === 'install' ? 14 : 3
    for (let i = 0; i < n && !mockCancelled; i++) {
      await sleep(step.id === 'install' ? 220 : 120)
      onEvent({ type: 'log', text: `[${step.id}] linha de log simulada ${i + 1}` })
    }
    if (mockCancelled) return
    onEvent({ type: 'step', id: step.id, status: step.id === 'git' ? 'warn' : 'done', message: step.id === 'git' ? 'Simulação: sem commit inicial.' : undefined })
  }
  onEvent({ type: 'done', path: `${config.parentDir}\\${config.name}`, ms: Date.now() - started })
}
