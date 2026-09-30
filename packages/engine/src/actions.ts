import { spawn } from 'node:child_process'
import { basename } from 'node:path'
import type { PackageManager } from '@stackforge/core'
import { capture, run, type Emit } from './run'

const quiet: Emit = () => {}

export async function openVsCode(path: string, emit: Emit = quiet): Promise<boolean> {
  return (await run('code .', path, emit)) === 0
}

export function openExplorer(path: string) {
  // explorer.exe devolve código 1 mesmo quando funciona; não há o que checar.
  spawn('explorer.exe', [path], { detached: true, stdio: 'ignore' }).unref()
}

/** Abre uma nova janela de terminal rodando o servidor de desenvolvimento. */
export function startDev(path: string, pm: PackageManager) {
  const title = `${basename(path)} - dev`
  const args = `/c start "${title}" cmd /k ${pm} run dev`
  spawn('cmd.exe', [args], {
    cwd: path,
    detached: true,
    stdio: 'ignore',
    windowsVerbatimArguments: true,
  }).unref()
}

export interface Tools {
  node: string | null
  npm: string | null
  pnpm: string | null
  bun: string | null
  git: string | null
  code: string | null
}

export async function detectTools(): Promise<Tools> {
  const [npm, pnpm, bun, git, code] = await Promise.all([
    capture('npm -v'),
    capture('pnpm -v'),
    capture('bun -v'),
    capture('git --version').then((v) => v?.replace(/^git version\s*/, '') ?? null),
    capture('code --version').then((v) => v?.split(/\r?\n/)[0] ?? null),
  ])
  return { node: process.version.replace(/^v/, ''), npm, pnpm, bun, git, code }
}
