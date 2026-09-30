import { readFileSync } from 'node:fs'
import { plan, type PackageManager, type ProjectConfig } from '@stackforge/core'
import { detectTools, openExplorer, openVsCode, startDev } from './actions'
import { createProject } from './create'
import { emitStdout } from './run'

const USAGE = `StackForge engine

  create --config <arquivo.json> | --config-b64 <base64> | --stdin
  plan   --config <arquivo.json> | --config-b64 <base64>
  open   vscode|explorer|dev <pasta> [npm|pnpm|bun]
  detect`

async function readConfig(args: string[]): Promise<ProjectConfig> {
  const i = args.indexOf('--config')
  if (i >= 0) return JSON.parse(readFileSync(args[i + 1]!, 'utf8'))
  const j = args.indexOf('--config-b64')
  if (j >= 0) return JSON.parse(Buffer.from(args[j + 1]!, 'base64').toString('utf8'))
  // --stdin: o app Tauri envia a configuração pela entrada padrão.
  if (args.includes('--stdin')) {
    const chunks: Buffer[] = []
    for await (const chunk of process.stdin) chunks.push(chunk as Buffer)
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  }
  throw new Error('Informe --config, --config-b64 ou --stdin')
}

async function main() {
  const [command, ...args] = process.argv.slice(2)
  switch (command) {
    case 'create': {
      const ok = await createProject(await readConfig(args), emitStdout)
      process.exitCode = ok ? 0 : 1
      break
    }
    case 'plan':
      console.log(JSON.stringify(plan(await readConfig(args)), null, 2))
      break
    case 'open': {
      const [target, path, pm = 'npm'] = args
      if (!path) throw new Error('Informe a pasta')
      if (target === 'vscode') process.exitCode = (await openVsCode(path)) ? 0 : 1
      else if (target === 'explorer') openExplorer(path)
      else if (target === 'dev') startDev(path, pm as PackageManager)
      else throw new Error(`Alvo desconhecido: ${target}`)
      break
    }
    case 'detect':
      console.log(JSON.stringify(await detectTools()))
      break
    default:
      console.log(USAGE)
  }
}

main().catch((err: Error) => {
  emitStdout({ type: 'error', message: err.message })
  process.exitCode = 1
})
