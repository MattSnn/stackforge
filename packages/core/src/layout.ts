import type { ProjectConfig } from './types'

/** Onde cada tipo de arquivo mora, de acordo com a estrutura de pastas escolhida. */
export interface Layout {
  /** Pasta do App/providers (Vite) — no Next é sempre src/app. */
  app: string
  pages: string
  components: string
  ui: string
  lib: string
  hooks: string
  services: string
  store: string
  /** Pastas criadas vazias (com .gitkeep) para guiar a organização. */
  emptyDirs: string[]
}

export function resolveLayout(config: ProjectConfig): Layout {
  const next = config.framework === 'next'
  const app = next ? 'src/app' : 'src'

  if (config.structure === 'feature') {
    return {
      app: next ? 'src/app' : 'src/app',
      pages: 'src/pages',
      components: 'src/shared/components',
      ui: 'src/shared/components/ui',
      lib: 'src/shared/lib',
      hooks: 'src/shared/hooks',
      services: 'src/shared/api',
      store: 'src/shared/store',
      emptyDirs: [
        'src/features',
        'src/shared/components',
        'src/shared/hooks',
        'src/shared/lib',
        'src/shared/api',
        ...(next ? [] : ['src/pages']),
      ],
    }
  }

  const layout: Layout = {
    app,
    pages: 'src/pages',
    components: 'src/components',
    ui: 'src/components/ui',
    lib: 'src/lib',
    hooks: 'src/hooks',
    services: 'src/services',
    store: 'src/store',
    emptyDirs: [],
  }
  if (config.structure === 'simple') {
    layout.emptyDirs = [
      'src/components/ui',
      'src/components/layout',
      'src/hooks',
      'src/lib',
      'src/services',
      ...(next ? [] : ['src/pages', 'src/assets']),
    ]
  }
  return layout
}

/** Converte "src/shared/lib" em "@/shared/lib". */
export function alias(dir: string): string {
  return dir.replace(/^src/, '@')
}
