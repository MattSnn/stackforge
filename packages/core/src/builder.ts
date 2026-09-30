import { resolveLayout, type Layout } from './layout'
import { cssFile } from './templates/common'
import { notFoundPage } from './templates/react'
import type { ProjectConfig } from './types'
import { versions, type PackageName } from './versions'

/** Acumula arquivos, dependências e scripts enquanto frameworks e features contribuem. */
export class Builder {
  readonly files = new Map<string, string>()
  readonly dependencies: Record<string, string> = {}
  readonly devDependencies: Record<string, string> = {}
  readonly scripts: Record<string, string> = {}
  readonly layout: Layout
  readonly ts: boolean
  /** Extensão para arquivos com JSX: tsx | jsx */
  readonly jsx: string
  /** Extensão para arquivos sem JSX: ts | js */
  readonly js: string

  constructor(readonly config: ProjectConfig) {
    this.layout = resolveLayout(config)
    this.ts = config.language === 'ts'
    this.jsx = this.ts ? 'tsx' : 'jsx'
    this.js = this.ts ? 'ts' : 'js'
  }

  add(path: string, content: string) {
    this.files.set(path, content)
  }

  dep(...names: PackageName[]) {
    for (const n of names) this.dependencies[n] = versions[n]
  }

  devDep(...names: PackageName[]) {
    for (const n of names) this.devDependencies[n] = versions[n]
  }

  script(name: string, command: string) {
    this.scripts[name] = command
  }

  css() {
    return cssFile(this.config)
  }

  notFound() {
    return notFoundPage(this.config)
  }

  /** Caminho do CSS global, relativo à raiz do projeto. */
  get cssPath() {
    return this.config.framework === 'next' ? 'src/app/globals.css' : 'src/index.css'
  }
}
