import { spawn, type SpawnOptions } from 'node:child_process'
import type { EngineEvent } from '@stackforge/core'

export type Emit = (event: EngineEvent) => void

/** Imprime um evento como uma linha JSON (protocolo lido pelo app). */
export const emitStdout: Emit = (event) => {
  process.stdout.write(JSON.stringify(event) + '\n')
}

// eslint-disable-next-line no-control-regex
const ANSI = /\u001b\[[0-9;?]*[A-Za-z]/g

/**
 * Executa um comando via shell (necessário no Windows para npm.cmd, code.cmd…),
 * repassando cada linha de saída como log. Resolve com o código de saída.
 */
export function run(command: string, cwd: string, emit: Emit, opts: SpawnOptions = {}): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn(command, {
      cwd,
      shell: true,
      windowsHide: true,
      env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1', CI: 'true', npm_config_update_notifier: 'false' },
      ...opts,
    })
    const pipe = (chunk: Buffer) => {
      for (const line of chunk.toString('utf8').split(/\r?\n/)) {
        const text = line.replace(ANSI, '').trimEnd()
        if (text) emit({ type: 'log', text })
      }
    }
    child.stdout?.on('data', pipe)
    child.stderr?.on('data', pipe)
    child.on('error', (err) => {
      emit({ type: 'log', text: err.message })
      resolve(-1)
    })
    child.on('close', (code) => resolve(code ?? -1))
  })
}

/** Executa e captura a saída (para detecção de ferramentas). */
export function capture(command: string, timeoutMs = 8000): Promise<string | null> {
  return new Promise((resolve) => {
    const child = spawn(command, { shell: true, windowsHide: true })
    let out = ''
    const timer = setTimeout(() => {
      child.kill()
      resolve(null)
    }, timeoutMs)
    child.stdout?.on('data', (c: Buffer) => (out += c.toString()))
    child.on('error', () => {
      clearTimeout(timer)
      resolve(null)
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve(code === 0 ? out.trim() : null)
    })
  })
}
