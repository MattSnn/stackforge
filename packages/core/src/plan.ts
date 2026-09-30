import { Builder } from './builder'
import { normalizeConfig } from './config'
import { nextApp } from './frameworks/next'
import { viteReact } from './frameworks/vite'
import { alias } from './layout'
import {
  buttonFile,
  componentsJson,
  envExample,
  gitignore,
  json,
  prettierrc,
  readme,
  utilsFile,
  vscodeExtensions,
  vscodeSettings,
} from './templates/common'
import {
  activeExamples,
  counterStore,
  exampleCounter,
  exampleDirs,
  exampleForm,
  examplePosts,
  postsHook,
} from './templates/react'
import type { Plan, PlanStep, ProjectConfig } from './types'

const sortKeys = (obj: Record<string, string>) =>
  Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)))

export function plan(input: ProjectConfig): Plan {
  const config = normalizeConfig(input)
  const b = new Builder(config)
  const { layout } = b
  const f = config.features

  if (config.framework === 'next') nextApp(b)
  else viteReact(b)

  // ---- estilo ----
  if (config.shadcn) {
    b.dep('clsx', 'tailwind-merge', 'class-variance-authority', '@radix-ui/react-slot')
    b.devDep('tw-animate-css')
    b.add('components.json', componentsJson(config, layout, b.cssPath))
    b.add(`${layout.lib}/utils.${b.js}`, utilsFile(b.ts))
    b.add(`${layout.ui}/button.${b.jsx}`, buttonFile(b.ts, layout))
  }

  // ---- extras ----
  if (f.router) b.dep('react-router')
  if (f.icons || config.shadcn) b.dep('lucide-react')
  if (f.zustand) b.dep('zustand')
  if (f.query) b.dep('@tanstack/react-query')
  if (f.forms) b.dep('react-hook-form', '@hookform/resolvers', 'zod')

  const ex = activeExamples(config)
  const dirs = exampleDirs(config, layout)
  if (ex.counter) {
    b.add(`${dirs.store}/useCounterStore.${b.js}`, counterStore(b.ts))
    b.add(`${dirs.components}/ExampleCounter.${b.jsx}`, exampleCounter(config, alias(dirs.store)))
  }
  if (ex.form) b.add(`${dirs.components}/ExampleForm.${b.jsx}`, exampleForm(config))
  if (ex.posts) {
    b.add(`${dirs.hooks}/usePosts.${b.js}`, postsHook(b.ts))
    b.add(`${dirs.components}/ExamplePosts.${b.jsx}`, examplePosts(config, alias(dirs.hooks)))
  }

  // ---- qualidade ----
  if (f.lint) {
    b.devDep('prettier')
    if (config.tailwind) b.devDep('prettier-plugin-tailwindcss')
    b.script('format', 'prettier --write .')
    b.add('.prettierrc', prettierrc(config, b.cssPath))
  }

  // ---- arquivos de apoio ----
  b.add('.gitignore', gitignore(config))
  // LF em todo lugar: evita avisos de CRLF do git no Windows e conflitos com o Prettier.
  b.add('.gitattributes', '* text=auto eol=lf\n')
  b.add('.env.example', envExample(config))
  if (f.lint || config.tailwind || f.tests) {
    b.add('.vscode/extensions.json', vscodeExtensions(config))
    b.add('.vscode/settings.json', vscodeSettings(config))
  }

  // pastas vazias da estrutura escolhida
  const paths = [...b.files.keys()]
  for (const dir of layout.emptyDirs) {
    if (!paths.some((p) => p.startsWith(dir + '/'))) b.add(`${dir}/.gitkeep`, '')
  }

  // ---- package.json + README ----
  const scriptOrder = ['dev', 'build', 'start', 'preview', 'lint', 'format', 'test', 'test:watch']
  const scripts = Object.fromEntries(
    scriptOrder.filter((s) => b.scripts[s]).map((s) => [s, b.scripts[s]!]),
  )
  const dependencies = sortKeys(b.dependencies)
  const devDependencies = sortKeys(b.devDependencies)

  b.add(
    'package.json',
    json({
      name: config.name,
      private: true,
      version: '0.1.0',
      type: 'module',
      scripts,
      dependencies,
      devDependencies,
    }),
  )
  b.add('README.md', readme(config, stackSummary(config), scripts))

  const files = [...b.files.entries()]
    .map(([path, content]) => ({ path, content }))
    .sort((a, b) => a.path.localeCompare(b.path))

  return { config, files, dependencies, devDependencies, scripts, steps: planSteps(config) }
}

export function stackSummary(config: ProjectConfig): string[] {
  const f = config.features
  return [
    `${config.framework === 'next' ? 'Next.js (App Router)' : 'Vite + React'} com ${config.language === 'ts' ? 'TypeScript' : 'JavaScript'}`,
    config.tailwind && 'Tailwind CSS v4',
    config.shadcn && 'shadcn/ui (componentes em `' + (config.structure === 'feature' ? 'src/shared/components/ui' : 'src/components/ui') + '`)',
    f.router && 'React Router',
    f.icons && 'Ícones lucide-react',
    f.query && 'TanStack Query',
    f.zustand && 'Zustand',
    f.forms && 'react-hook-form + zod',
    f.lint && 'ESLint + Prettier',
    f.tests && 'Vitest + Testing Library',
    'Alias `@/` → `src/`',
  ].filter((s): s is string => typeof s === 'string')
}

export function planSteps(config: ProjectConfig): PlanStep[] {
  const p = config.post
  const steps: (PlanStep | false)[] = [
    { id: 'write', label: 'Gerando arquivos' },
    p.install && { id: 'install', label: `Instalando dependências (${config.packageManager})` },
    p.git && { id: 'git', label: 'Criando repositório git' },
    p.vscode && { id: 'vscode', label: 'Abrindo no VS Code' },
    p.explorer && { id: 'explorer', label: 'Abrindo a pasta' },
    p.dev && { id: 'dev', label: 'Iniciando servidor de desenvolvimento' },
  ]
  return steps.filter((s): s is PlanStep => !!s)
}
