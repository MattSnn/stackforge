import { describe, expect, it } from 'vitest'
import { buildTree, defaultConfig, plan, toPackageName, validateName, type ProjectConfig } from '../src'

const cfg = (patch: Partial<ProjectConfig> = {}): ProjectConfig => ({
  ...defaultConfig,
  name: 'app',
  parentDir: 'C:\\dev',
  ...patch,
  features: { ...defaultConfig.features, ...patch.features },
})

const paths = (c: ProjectConfig) => plan(c).files.map((f) => f.path)
const file = (c: ProjectConfig, path: string) => plan(c).files.find((f) => f.path === path)?.content

describe('plan', () => {
  it('Vite limpo: sem boilerplate, Tailwind configurado', () => {
    const c = cfg({ structure: 'none' })
    const p = paths(c)
    expect(p).toContain('src/App.tsx')
    expect(p).not.toContain('src/App.css')
    expect(p.some((x) => /logo|\.svg$/.test(x))).toBe(false)
    expect(file(c, 'vite.config.ts')).toContain('tailwindcss()')
    expect(file(c, 'src/index.css')).toContain(`@import 'tailwindcss'`)
    expect(plan(c).devDependencies['@tailwindcss/vite']).toBeDefined()
  })

  it('shadcn força Tailwind e gera components.json, utils e button', () => {
    const c = cfg({ tailwind: false, shadcn: true })
    const pl = plan(c)
    expect(pl.config.tailwind).toBe(true)
    expect(paths(c)).toEqual(expect.arrayContaining(['components.json', 'src/lib/utils.ts', 'src/components/ui/button.tsx']))
    expect(JSON.parse(file(c, 'components.json')!).aliases.ui).toBe('@/components/ui')
  })

  it('estrutura por feature move os aliases do shadcn para shared/', () => {
    const c = cfg({ shadcn: true, structure: 'feature' })
    expect(JSON.parse(file(c, 'components.json')!).aliases.utils).toBe('@/shared/lib/utils')
    expect(paths(c)).toContain('src/app/App.tsx')
    expect(file(c, 'src/main.tsx')).toContain(`from './app/App'`)
  })

  it('rotas geram páginas e RouterProvider', () => {
    const c = cfg({ features: { ...defaultConfig.features, router: true } })
    expect(paths(c)).toEqual(expect.arrayContaining(['src/pages/HomePage.tsx', 'src/pages/NotFoundPage.tsx']))
    expect(file(c, 'src/App.tsx')).toContain('RouterProvider')
  })

  it('Next ignora extras exclusivos do Vite', () => {
    const c = cfg({ framework: 'next', features: { ...defaultConfig.features, router: true, tests: true } })
    const pl = plan(c)
    expect(pl.config.features.router).toBe(false)
    expect(pl.config.features.tests).toBe(false)
    expect(pl.dependencies['react-router']).toBeUndefined()
    expect(paths(c)).toEqual(expect.arrayContaining(['src/app/layout.tsx', 'src/app/page.tsx', 'postcss.config.mjs']))
  })

  it('JavaScript não gera arquivos TS', () => {
    const c = cfg({ language: 'js', shadcn: true, examples: true, features: { ...defaultConfig.features, forms: true, zustand: true, query: true, tests: true } })
    const p = paths(c)
    expect(p.some((x) => /\.tsx?$/.test(x))).toBe(false)
    expect(p).toContain('jsconfig.json')
    const all = plan(c).files.map((f) => f.content).join('\n')
    expect(all).not.toMatch(/: (string|number|ReactNode|ClassValue)\b|interface |<FormValues>/)
  })

  it('exemplos só aparecem com as bibliotecas correspondentes', () => {
    expect(paths(cfg({ examples: true })).some((p) => p.includes('Example'))).toBe(false)
    const c = cfg({ examples: true, features: { ...defaultConfig.features, zustand: true } })
    expect(paths(c)).toContain('src/components/examples/ExampleCounter.tsx')
  })

  it('pastas vazias ganham .gitkeep e a árvore as mostra', () => {
    const pl = plan(cfg({ structure: 'simple' }))
    expect(pl.files.map((f) => f.path)).toContain('src/hooks/.gitkeep')
    const src = buildTree(pl.files).children.find((n) => n.name === 'src')!
    expect(src.children.find((n) => n.name === 'hooks')?.children).toEqual([])
  })

  it('package.json usa as versões curadas', () => {
    const pkg = JSON.parse(file(cfg(), 'package.json')!)
    expect(pkg.devDependencies.typescript).toBe('~6.0.3')
    expect(pkg.devDependencies.eslint).toMatch(/^\^9\./)
    expect(pkg.scripts.build).toBe('tsc -b && vite build')
  })

  it('passos pós-criação respeitam as opções', () => {
    const steps = plan(cfg({ post: { install: false, git: true, vscode: false, explorer: false, dev: true } })).steps
    expect(steps.map((s) => s.id)).toEqual(['write', 'git'])
  })
})

describe('nomes', () => {
  it('valida nomes de pacote', () => {
    expect(validateName('meu-app')).toBeNull()
    expect(validateName('Meu App')).not.toBeNull()
    expect(validateName('.oculto')).not.toBeNull()
    expect(validateName('con')).not.toBeNull()
  })
  it('converte texto livre', () => {
    expect(toPackageName('Minha Aplicação Legal!')).toBe('minha-aplicacao-legal')
  })
})
