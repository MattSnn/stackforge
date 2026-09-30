export type Framework = 'vite-react' | 'next'
export type Language = 'ts' | 'js'
export type PackageManager = 'npm' | 'pnpm' | 'bun'
export type Structure = 'none' | 'simple' | 'feature'

export type FeatureId =
  | 'router'
  | 'zustand'
  | 'query'
  | 'forms'
  | 'icons'
  | 'lint'
  | 'tests'

export interface ProjectConfig {
  name: string
  /** Pasta onde a pasta do projeto será criada. */
  parentDir: string
  framework: Framework
  language: Language
  packageManager: PackageManager
  tailwind: boolean
  shadcn: boolean
  features: Record<FeatureId, boolean>
  structure: Structure
  /** Inclui pequenos exemplos de uso das bibliotecas escolhidas. */
  examples: boolean
  post: PostActions
}

export interface PostActions {
  install: boolean
  git: boolean
  vscode: boolean
  explorer: boolean
  dev: boolean
}

export interface FileEntry {
  path: string
  content: string
}

export type StepId = 'write' | 'install' | 'git' | 'vscode' | 'explorer' | 'dev'

export interface PlanStep {
  id: StepId
  label: string
}

/** Protocolo engine → app: uma linha JSON por evento no stdout. */
export type EngineEvent =
  | { type: 'step'; id: StepId; status: 'running' | 'done' | 'warn' | 'error'; message?: string }
  | { type: 'log'; text: string }
  | { type: 'done'; path: string; ms: number }
  | { type: 'error'; message: string }

export interface Plan {
  /** Configuração normalizada (ex.: shadcn força Tailwind). */
  config: ProjectConfig
  files: FileEntry[]
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  scripts: Record<string, string>
  steps: PlanStep[]
}
