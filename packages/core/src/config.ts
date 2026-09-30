import { features as featureCatalog } from './catalog'
import type { ProjectConfig } from './types'

/** Resolve dependências entre opções para que o plano seja sempre consistente. */
export function normalizeConfig(input: ProjectConfig): ProjectConfig {
  const config: ProjectConfig = structuredClone(input)
  config.name = config.name.trim()
  if (config.shadcn) config.tailwind = true
  for (const f of featureCatalog) {
    if (!f.frameworks.includes(config.framework)) config.features[f.id] = false
  }
  if (!config.post.install) config.post.dev = false
  return config
}

const RESERVED = new Set(['node_modules', 'favicon.ico', 'con', 'prn', 'aux', 'nul'])

/** Retorna uma mensagem de erro (pt-BR) ou null se o nome for válido para npm e Windows. */
export function validateName(name: string): string | null {
  const n = name.trim()
  if (!n) return 'Dê um nome ao projeto.'
  if (n.length > 214) return 'Nome muito longo.'
  if (/[A-Z]/.test(n)) return 'Use apenas letras minúsculas.'
  if (/^[._]/.test(n)) return 'Não pode começar com ponto ou _.'
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(n)) return 'Use letras minúsculas, números, - , _ ou .'
  if (RESERVED.has(n)) return 'Nome reservado.'
  return null
}

/** Converte um texto livre ("Meu App Legal") em um nome de pacote válido ("meu-app-legal"). */
export function toPackageName(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^[-._]+|-+$/g, '')
}

export function joinPath(parent: string, name: string): string {
  if (!parent) return name
  const sep = parent.includes('\\') ? '\\' : '/'
  return parent.replace(/[\\/]+$/, '') + sep + name
}
