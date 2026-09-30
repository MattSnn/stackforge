import { existsSync } from 'node:fs'
import { mkdir, readdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { plan as makePlan, validateName, type Plan, type ProjectConfig, type StepId } from '@stackforge/core'
import { openExplorer, openVsCode, startDev } from './actions'
import { run, type Emit } from './run'

const installCommand: Record<string, string> = {
  npm: 'npm install --no-audit --no-fund',
  pnpm: 'pnpm install',
  bun: 'bun install',
}

export async function createProject(input: ProjectConfig, emit: Emit): Promise<boolean> {
  const started = Date.now()
  const nameError = validateName(input.name)
  if (nameError) {
    emit({ type: 'error', message: nameError })
    return false
  }
  if (!input.parentDir) {
    emit({ type: 'error', message: 'Escolha a pasta onde o projeto será criado.' })
    return false
  }

  const plan = makePlan(input)
  const { config } = plan
  const root = resolve(config.parentDir, config.name)

  if (existsSync(root) && (await readdir(root)).length > 0) {
    emit({ type: 'error', message: `A pasta ${root} já existe e não está vazia.` })
    return false
  }

  const step = async (id: StepId, fn: () => Promise<'done' | { warn: string } | { error: string }>) => {
    if (!plan.steps.some((s) => s.id === id)) return true
    emit({ type: 'step', id, status: 'running' })
    try {
      const result = await fn()
      if (result === 'done') emit({ type: 'step', id, status: 'done' })
      else if ('warn' in result) emit({ type: 'step', id, status: 'warn', message: result.warn })
      else {
        emit({ type: 'step', id, status: 'error', message: result.error })
        return false
      }
      return true
    } catch (err) {
      emit({ type: 'step', id, status: 'error', message: (err as Error).message })
      return false
    }
  }

  const ok =
    (await step('write', () => writeFiles(root, plan, emit))) &&
    (await step('install', async () => {
      const code = await run(installCommand[config.packageManager]!, root, emit)
      return code === 0 ? 'done' : { error: `A instalação falhou (código ${code}). Veja o log.` }
    }))
  if (!ok) {
    emit({ type: 'error', message: 'Não foi possível concluir a criação do projeto.' })
    return false
  }

  // Passos pós-criação: falhas viram avisos, o projeto já existe.
  await step('git', () => initGit(root, emit))
  await step('vscode', async () =>
    (await openVsCode(root, emit)) ? 'done' : { warn: 'Não encontrei o comando "code" no PATH.' },
  )
  await step('explorer', async () => {
    openExplorer(root)
    return 'done'
  })
  await step('dev', async () => {
    startDev(root, config.packageManager)
    return 'done'
  })

  emit({ type: 'done', path: root, ms: Date.now() - started })
  return true
}

async function writeFiles(root: string, plan: Plan, emit: Emit) {
  await mkdir(root, { recursive: true })
  const dirs = new Set(plan.files.map((f) => dirname(join(root, f.path))))
  await Promise.all([...dirs].map((d) => mkdir(d, { recursive: true })))
  await Promise.all(plan.files.map((f) => writeFile(join(root, f.path), f.content, 'utf8')))
  emit({ type: 'log', text: `${plan.files.length} arquivos escritos em ${root}` })
  return 'done' as const
}

async function initGit(root: string, emit: Emit) {
  if ((await run('git init -b main', root, emit)) !== 0) return { warn: 'git não está disponível.' }
  await run('git add -A', root, emit)
  const code = await run('git commit -q -m "chore: projeto inicial criado com StackForge"', root, emit)
  if (code !== 0) {
    return {
      warn: 'Repositório criado, mas sem commit inicial. Configure git config --global user.name e user.email.',
    }
  }
  return 'done' as const
}
