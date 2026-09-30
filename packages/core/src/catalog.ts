import type { FeatureId, Framework, ProjectConfig, Structure } from './types'

export interface FrameworkInfo {
  id: Framework
  label: string
  tagline: string
  description: string
}

export const frameworks: FrameworkInfo[] = [
  {
    id: 'vite-react',
    label: 'Vite + React',
    tagline: 'SPA rápida',
    description:
      'Aplicação React que roda 100% no navegador. Dev server instantâneo. Ideal para painéis, sistemas internos e apps que consomem uma API.',
  },
  {
    id: 'next',
    label: 'Next.js',
    tagline: 'Full-stack React',
    description:
      'React com rotas por pastas, renderização no servidor e SEO. Ideal para sites, landing pages e apps com backend próprio.',
  },
]

export interface FeatureInfo {
  id: FeatureId
  label: string
  /** O que é, em uma frase simples. */
  description: string
  packages: string
  frameworks: Framework[]
}

export const features: FeatureInfo[] = [
  {
    id: 'router',
    label: 'Rotas',
    description: 'Várias páginas com URLs próprias (/login, /produtos/1…) sem recarregar a página.',
    packages: 'react-router',
    frameworks: ['vite-react'],
  },
  {
    id: 'icons',
    label: 'Ícones',
    description: 'Mais de 1.500 ícones prontos como componentes: <Search />, <User />…',
    packages: 'lucide-react',
    frameworks: ['vite-react', 'next'],
  },
  {
    id: 'query',
    label: 'Dados de API',
    description: 'Busca dados do backend com cache, loading e erro automáticos. Evita useEffect + fetch na mão.',
    packages: '@tanstack/react-query',
    frameworks: ['vite-react', 'next'],
  },
  {
    id: 'zustand',
    label: 'Estado global',
    description: 'Compartilha dados entre componentes distantes (usuário logado, carrinho…) sem prop drilling.',
    packages: 'zustand',
    frameworks: ['vite-react', 'next'],
  },
  {
    id: 'forms',
    label: 'Formulários',
    description: 'Formulários com validação declarativa: "e-mail obrigatório", "mín. 8 caracteres"…',
    packages: 'react-hook-form + zod',
    frameworks: ['vite-react', 'next'],
  },
  {
    id: 'lint',
    label: 'Qualidade de código',
    description: 'ESLint aponta erros e más práticas; Prettier formata o código sozinho ao salvar.',
    packages: 'eslint + prettier',
    frameworks: ['vite-react', 'next'],
  },
  {
    id: 'tests',
    label: 'Testes',
    description: 'Testes automatizados de componentes que rodam em segundos com npm test.',
    packages: 'vitest + testing-library',
    frameworks: ['vite-react'],
  },
]

export interface StructureInfo {
  id: Structure
  label: string
  description: string
}

export const structures: StructureInfo[] = [
  { id: 'none', label: 'Mínima', description: 'Só o essencial. Você cria as pastas conforme precisar.' },
  {
    id: 'simple',
    label: 'Por tipo',
    description: 'components/, pages/, hooks/, lib/, services/. Simples e comum em projetos pequenos e médios.',
  },
  {
    id: 'feature',
    label: 'Por feature',
    description: 'app/, pages/, features/, shared/. Cada funcionalidade isolada; escala bem em projetos grandes.',
  },
]

export const defaultConfig: ProjectConfig = {
  name: 'meu-projeto',
  parentDir: '',
  framework: 'vite-react',
  language: 'ts',
  packageManager: 'npm',
  tailwind: true,
  shadcn: false,
  features: {
    router: false,
    zustand: false,
    query: false,
    forms: false,
    icons: true,
    lint: true,
    tests: false,
  },
  structure: 'simple',
  examples: false,
  post: { install: true, git: true, vscode: true, explorer: false, dev: false },
}

export interface Preset {
  id: string
  name: string
  description: string
  builtin?: boolean
  config: Omit<ProjectConfig, 'name' | 'parentDir'>
}

const base = (({ name: _n, parentDir: _p, ...rest }) => rest)(defaultConfig)

export const builtinPresets: Preset[] = [
  {
    id: 'react-clean',
    name: 'React + Tailwind limpo',
    description: 'Vite, TypeScript, Tailwind, ícones e ESLint. Nada além disso.',
    builtin: true,
    config: { ...base },
  },
  {
    id: 'react-full',
    name: 'React completo',
    description: 'Vite + shadcn/ui, rotas, dados de API, estado global, formulários e testes.',
    builtin: true,
    config: {
      ...base,
      shadcn: true,
      structure: 'feature',
      features: { router: true, zustand: true, query: true, forms: true, icons: true, lint: true, tests: true },
    },
  },
  {
    id: 'next-shadcn',
    name: 'Next + shadcn',
    description: 'Next.js App Router, Tailwind, shadcn/ui e ícones.',
    builtin: true,
    config: { ...base, framework: 'next', shadcn: true },
  },
]
