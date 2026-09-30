import { create } from 'zustand'
import {
  builtinPresets,
  defaultConfig,
  normalizeConfig,
  stackSummary,
  type EngineEvent,
  type Framework,
  type PackageManager,
  type Preset,
  type ProjectConfig,
  type StepId,
} from '@stackforge/core'
import * as bridge from './bridge'
import type { Tools } from './bridge'

export type View = 'new' | 'presets' | 'recents' | 'settings'
export type Theme = 'dark' | 'light' | 'system'

export interface Settings {
  parentDir: string
  theme: Theme
  accent: string
  packageManager: PackageManager
}

export interface Recent {
  name: string
  path: string
  framework: Framework
  packageManager: PackageManager
  stack: string[]
  createdAt: number
}

export type StepStatus = 'pending' | 'running' | 'done' | 'warn' | 'error'

export interface RunState {
  status: 'running' | 'done' | 'error' | 'cancelled'
  config: ProjectConfig
  steps: Partial<Record<StepId, { status: StepStatus; message?: string }>>
  logs: string[]
  startedAt: number
  path?: string
  ms?: number
  error?: string
}

export const accents = [
  { id: 'violet', color: '#8b5cf6' },
  { id: 'indigo', color: '#6366f1' },
  { id: 'blue', color: '#3b82f6' },
  { id: 'emerald', color: '#10b981' },
  { id: 'orange', color: '#f97316' },
  { id: 'pink', color: '#ec4899' },
]

interface AppState {
  ready: boolean
  view: View
  tools: Tools | null
  /** Erro ao iniciar o engine (Node existe, mas algo falhou). */
  toolsError: string | null
  settings: Settings
  config: ProjectConfig
  presets: Preset[]
  recents: Recent[]
  activePresetId: string | null
  run: RunState | null
  palette: boolean

  init(): Promise<void>
  refreshTools(): Promise<void>
  setView(view: View): void
  setPalette(open: boolean): void
  updateConfig(patch: Partial<ProjectConfig> | ((c: ProjectConfig) => Partial<ProjectConfig>)): void
  applyPreset(preset: Preset): void
  savePreset(name: string, description?: string): void
  deletePreset(id: string): void
  renamePreset(id: string, name: string): void
  updateSettings(patch: Partial<Settings>): void
  startCreate(): Promise<void>
  cancelCreate(): Promise<void>
  closeRun(): void
  removeRecent(path: string): void
}

const defaultSettings: Settings = { parentDir: '', theme: 'dark', accent: '#8b5cf6', packageManager: 'npm' }

export const useApp = create<AppState>()((set, get) => ({
  ready: false,
  view: 'new',
  tools: null,
  toolsError: null,
  settings: defaultSettings,
  config: defaultConfig,
  presets: [],
  recents: [],
  activePresetId: 'react-clean',
  run: null,
  palette: false,

  async init() {
    const [settings, presets, recents, lastConfig] = await Promise.all([
      bridge.loadValue<Settings>('settings'),
      bridge.loadValue<Preset[]>('presets'),
      bridge.loadValue<Recent[]>('recents'),
      bridge.loadValue<ProjectConfig>('lastConfig'),
    ])
    const s = { ...defaultSettings, ...settings }
    if (!s.parentDir) s.parentDir = await bridge.suggestParentDir()
    const config: ProjectConfig = {
      ...defaultConfig,
      ...lastConfig,
      features: { ...defaultConfig.features, ...lastConfig?.features },
      post: { ...defaultConfig.post, ...lastConfig?.post },
      name: lastConfig?.name ?? defaultConfig.name,
      parentDir: s.parentDir,
      packageManager: lastConfig?.packageManager ?? s.packageManager,
    }
    set({ settings: s, presets: presets ?? [], recents: recents ?? [], config, ready: true, activePresetId: lastConfig ? null : 'react-clean' })
    void get().refreshTools()
  },

  async refreshTools() {
    let tools: Tools
    try {
      tools = await bridge.detectTools()
    } catch (err) {
      set({ toolsError: String(err) })
      return
    }
    set({ tools, toolsError: null })
    // Se o gerenciador escolhido não estiver instalado, volta para o npm.
    const pm = get().config.packageManager
    if (pm !== 'npm' && !tools[pm]) get().updateConfig({ packageManager: 'npm' })
  },

  setView: (view) => set({ view }),
  setPalette: (palette) => set({ palette }),

  updateConfig(patch) {
    const current = get().config
    const partial = typeof patch === 'function' ? patch(current) : patch
    const config = { ...current, ...partial }
    const presetChanged = Object.keys(partial).some((k) => k !== 'name' && k !== 'parentDir')
    set({ config, activePresetId: presetChanged ? null : get().activePresetId })
    void bridge.saveValue('lastConfig', config)
  },

  applyPreset(preset) {
    const { config } = get()
    const tools = get().tools
    const pm = preset.config.packageManager
    const next: ProjectConfig = {
      ...structuredClone(preset.config),
      name: config.name,
      parentDir: config.parentDir,
      packageManager: pm === 'npm' || !tools || tools[pm] ? pm : 'npm',
    }
    set({ config: next, activePresetId: preset.id, view: 'new', palette: false })
    void bridge.saveValue('lastConfig', next)
  },

  savePreset(name, description) {
    const { name: _n, parentDir: _p, ...config } = normalizeConfig(get().config)
    const preset: Preset = {
      id: `user-${Date.now().toString(36)}`,
      name,
      description: description || stackSummary({ ...config, name: '', parentDir: '' }).slice(0, 4).join(' · '),
      config,
    }
    const presets = [...get().presets, preset]
    set({ presets, activePresetId: preset.id })
    void bridge.saveValue('presets', presets)
  },

  deletePreset(id) {
    const presets = get().presets.filter((p) => p.id !== id)
    set({ presets, activePresetId: get().activePresetId === id ? null : get().activePresetId })
    void bridge.saveValue('presets', presets)
  },

  renamePreset(id, name) {
    const presets = get().presets.map((p) => (p.id === id ? { ...p, name } : p))
    set({ presets })
    void bridge.saveValue('presets', presets)
  },

  updateSettings(patch) {
    const settings = { ...get().settings, ...patch }
    set({ settings })
    if (patch.parentDir) get().updateConfig({ parentDir: patch.parentDir })
    void bridge.saveValue('settings', settings)
  },

  async startCreate() {
    if (get().run?.status === 'running') return
    const config = normalizeConfig(get().config)
    const run: RunState = { status: 'running', config, steps: {}, logs: [], startedAt: Date.now() }
    set({ run })

    const onEvent = (e: EngineEvent) => {
      const r = get().run
      if (!r) return
      if (e.type === 'log') set({ run: { ...r, logs: [...r.logs.slice(-400), e.text] } })
      else if (e.type === 'step')
        set({ run: { ...r, steps: { ...r.steps, [e.id]: { status: e.status, message: e.message } } } })
      else if (e.type === 'error') set({ run: { ...r, status: 'error', error: e.message } })
      else if (e.type === 'done') {
        set({ run: { ...r, status: 'done', path: e.path, ms: e.ms } })
        const recent: Recent = {
          name: config.name,
          path: e.path,
          framework: config.framework,
          packageManager: config.packageManager,
          stack: stackSummary(config),
          createdAt: Date.now(),
        }
        const recents = [recent, ...get().recents.filter((x) => x.path !== e.path)].slice(0, 50)
        set({ recents })
        void bridge.saveValue('recents', recents)
      }
    }

    try {
      await bridge.createProject(config, onEvent)
    } catch (err) {
      onEvent({ type: 'error', message: String(err) })
    }
    const r = get().run
    if (r?.status === 'running') set({ run: { ...r, status: 'error', error: r.error ?? 'O processo terminou inesperadamente.' } })
  },

  async cancelCreate() {
    // Marca antes de matar o processo: o evento de saída chega logo em seguida
    // e não deve ser tratado como erro.
    const r = get().run
    if (r) set({ run: { ...r, status: 'cancelled' } })
    await bridge.cancelCreate()
  },

  closeRun() {
    const r = get().run
    if (r?.status === 'running') return
    // Depois de criar, sugere um novo nome livre para o próximo projeto.
    if (r?.status === 'done') get().updateConfig({ name: nextFreeName(r.config.name) })
    set({ run: null })
  },

  removeRecent(path) {
    const recents = get().recents.filter((r) => r.path !== path)
    set({ recents })
    void bridge.saveValue('recents', recents)
  },
}))

/** meu-app → meu-app-2 → meu-app-3 … */
function nextFreeName(name: string): string {
  const m = name.match(/^(.*?)-(\d+)$/)
  return m ? `${m[1]}-${Number(m[2]) + 1}` : `${name}-2`
}

export const allPresets = (user: Preset[]) => [...builtinPresets, ...user]
