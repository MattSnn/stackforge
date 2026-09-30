import clsx from 'clsx'
import {
  Boxes,
  Check,
  FolderOpen,
  FolderTree,
  Paintbrush,
  PartyPopper,
  Puzzle,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'
import type { ReactNode } from 'react'
import {
  features,
  frameworks,
  joinPath,
  structures,
  toPackageName,
  type PackageManager,
  type PostActions,
  type Structure,
} from '@stackforge/core'
import { FrameworkLogo, ReactLogo } from '@/components/Logos'
import { PreviewPanel } from '@/components/PreviewPanel'
import { Badge, Button, Input, Section, Segmented, Switch } from '@/components/ui'
import { pickFolder } from '@/lib/bridge'
import { useTargetProblem } from '@/lib/hooks'
import { allPresets, useApp } from '@/lib/state'

export function NewProject() {
  return (
    <div className="flex min-h-0 flex-1">
      <div className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-7 py-6">
          <Header />
          <ProjectSection />
          <FrameworkSection />
          <StyleSection />
          <ExtrasSection />
          <StructureSection />
          <PostSection />
          <div className="h-4" />
        </div>
      </div>
      <PreviewPanel />
    </div>
  )
}

function Header() {
  const activeId = useApp((s) => s.activePresetId)
  const presets = useApp((s) => s.presets)
  const applyPreset = useApp((s) => s.applyPreset)
  const setPalette = useApp((s) => s.setPalette)
  const list = allPresets(presets)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Novo projeto</h1>
          <p className="mt-0.5 text-muted">Monte sua stack, confira a prévia e crie em um clique.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setPalette(true)}>
          Todos os presets <span className="text-subtle">Ctrl K</span>
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {list.slice(0, 6).map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => applyPreset(p)}
            title={p.description}
            className={clsx(
              'flex h-7 items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium transition-all',
              activeId === p.id
                ? 'border-accent/50 bg-accent/12 text-fg'
                : 'border-line text-muted hover:border-line-strong hover:text-fg',
            )}
          >
            {activeId === p.id && <Check className="size-3 text-accent" />}
            {p.name}
          </button>
        ))}
      </div>
    </div>
  )
}

function ProjectSection() {
  const config = useApp((s) => s.config)
  const update = useApp((s) => s.updateConfig)
  const updateSettings = useApp((s) => s.updateSettings)
  const choose = async () => {
    const dir = await pickFolder(config.parentDir)
    if (dir) updateSettings({ parentDir: dir })
  }

  const problem = useTargetProblem()

  return (
    <Section title="Projeto" icon={<Sparkles />}>
      <div className="grid grid-cols-[1fr_1.3fr] gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-medium text-muted">Nome</span>
          <Input
            autoFocus
            value={config.name}
            invalid={!!problem}
            onChange={(e) => update({ name: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
            onBlur={() => update({ name: toPackageName(config.name) || config.name })}
            placeholder="meu-projeto"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-medium text-muted">Criar em</span>
          <div className="flex gap-2">
            <Input value={config.parentDir} onChange={(e) => updateSettings({ parentDir: e.target.value })} className="font-mono text-[12px]" />
            <Button onClick={choose} className="h-9 shrink-0" title="Escolher pasta">
              <FolderOpen />
            </Button>
          </div>
        </label>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[12px]">
        {problem ? (
          <span className="flex items-center gap-1.5 text-danger">
            <TriangleAlert className="size-3.5" /> {problem}
          </span>
        ) : (
          <span className="truncate font-mono text-subtle">
            {joinPath(config.parentDir, config.name)}
          </span>
        )}
      </div>
    </Section>
  )
}

function FrameworkSection() {
  const config = useApp((s) => s.config)
  const update = useApp((s) => s.updateConfig)
  const tools = useApp((s) => s.tools)

  const pmOption = (pm: PackageManager) => ({
    value: pm,
    label: pm,
    disabled: pm !== 'npm' && !!tools && !tools[pm],
    hint: pm !== 'npm' && tools && !tools[pm] ? `${pm} não está instalado` : undefined,
  })

  return (
    <Section title="Framework" description="A base do projeto. Ambos usam React." icon={<Boxes />}>
      <div className="grid grid-cols-2 gap-3">
        {frameworks.map((fw) => {
          const active = config.framework === fw.id
          return (
            <button
              key={fw.id}
              type="button"
              onClick={() => update({ framework: fw.id })}
              className={clsx(
                'relative flex flex-col gap-2 rounded-xl border p-4 text-left transition-all',
                active
                  ? 'border-accent/60 bg-accent/[0.07] ring-1 ring-accent/30'
                  : 'border-line bg-elevated/50 hover:border-line-strong hover:bg-elevated',
              )}
            >
              <div className="flex items-center gap-2.5">
                <FrameworkLogo framework={fw.id} className="size-7" />
                <span className="text-[14px] font-semibold">{fw.label}</span>
                <ReactLogo className="ml-auto size-5 opacity-70" />
              </div>
              <div>
                <Badge tone={active ? 'accent' : 'neutral'}>{fw.tagline}</Badge>
              </div>
              <p className="text-[12px] leading-relaxed text-muted">{fw.description}</p>
              {active && (
                <span className="absolute top-3 right-3 hidden size-5 place-items-center rounded-full bg-accent text-accent-fg">
                  <Check className="size-3" />
                </span>
              )}
            </button>
          )
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3">
        <Inline label="Linguagem">
          <Segmented
            value={config.language}
            onChange={(language) => update({ language })}
            options={[
              { value: 'ts', label: 'TypeScript', hint: 'Recomendado: autocomplete e erros antes de rodar' },
              { value: 'js', label: 'JavaScript' },
            ]}
          />
        </Inline>
        <Inline label="Gerenciador">
          <Segmented
            value={config.packageManager}
            onChange={(packageManager) => update({ packageManager })}
            options={[pmOption('npm'), pmOption('pnpm'), pmOption('bun')]}
          />
        </Inline>
      </div>
    </Section>
  )
}

function Inline({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[12px] font-medium text-muted">{label}</span>
      {children}
    </div>
  )
}

function ToggleRow({
  title,
  description,
  badge,
  checked,
  onChange,
  disabled,
}: {
  title: string
  description: string
  badge?: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div
      role="button"
      tabIndex={-1}
      onClick={() => !disabled && onChange(!checked)}
      className={clsx(
        'flex cursor-pointer items-center gap-4 rounded-xl border px-4 py-3 transition-all',
        checked ? 'border-accent/40 bg-accent/[0.05]' : 'border-line hover:border-line-strong',
        disabled && 'pointer-events-none opacity-45',
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{title}</span>
          {badge && <Badge>{badge}</Badge>}
        </div>
        <p className="mt-0.5 text-[12px] text-muted">{description}</p>
      </div>
      <Switch checked={checked} onChange={onChange} disabled={disabled} label={title} />
    </div>
  )
}

function StyleSection() {
  const config = useApp((s) => s.config)
  const update = useApp((s) => s.updateConfig)
  return (
    <Section title="Estilo" description="Como você vai estilizar os componentes." icon={<Paintbrush />}>
      <div className="flex flex-col gap-2">
        <ToggleRow
          title="Tailwind CSS"
          badge="v4"
          description="Estilize direto no JSX com classes utilitárias (flex, p-4, text-lg). Já vem configurado, sem arquivo de config."
          checked={config.tailwind}
          onChange={(tailwind) => update({ tailwind, shadcn: tailwind ? config.shadcn : false })}
        />
        <ToggleRow
          title="shadcn/ui"
          description="Componentes prontos e bonitos (botão, modal, tabela…) copiados para o seu projeto. Adicione mais com npx shadcn add."
          checked={config.shadcn}
          onChange={(shadcn) => update({ shadcn, tailwind: shadcn ? true : config.tailwind })}
        />
      </div>
    </Section>
  )
}

function ExtrasSection() {
  const config = useApp((s) => s.config)
  const update = useApp((s) => s.updateConfig)
  const available = features.filter((f) => f.frameworks.includes(config.framework))
  const anyExampleable = config.features.zustand || config.features.forms || config.features.query

  return (
    <Section
      title="Extras"
      description="Bibliotecas populares do ecossistema React. Ligue só o que for usar."
      icon={<Puzzle />}
    >
      <div className="grid grid-cols-2 gap-2">
        {available.map((f) => {
          const on = config.features[f.id]
          return (
            <div
              key={f.id}
              role="button"
              tabIndex={-1}
              onClick={() => update((c) => ({ features: { ...c.features, [f.id]: !on } }))}
              className={clsx(
                'flex cursor-pointer flex-col gap-1.5 rounded-xl border p-3.5 transition-all',
                on ? 'border-accent/40 bg-accent/[0.05]' : 'border-line hover:border-line-strong',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{f.label}</span>
                <Switch checked={on} onChange={(v) => update((c) => ({ features: { ...c.features, [f.id]: v } }))} label={f.label} />
              </div>
              <p className="text-[12px] leading-relaxed text-muted">{f.description}</p>
              <code className="mt-auto pt-1 font-mono text-[11px] text-subtle">{f.packages}</code>
            </div>
          )
        })}
      </div>
      <div className="mt-3">
        <ToggleRow
          title="Incluir exemplos de uso"
          description="Adiciona pequenos componentes de exemplo (contador com Zustand, formulário validado, lista vinda de uma API) para você ver como cada biblioteca funciona."
          checked={config.examples}
          onChange={(examples) => update({ examples })}
          disabled={!anyExampleable}
        />
      </div>
    </Section>
  )
}

const structureTrees: Record<Structure, (next: boolean) => string[]> = {
  none: (next) => (next ? ['app/', '  layout', '  page'] : ['App', 'main', 'index.css']),
  simple: (next) => [...(next ? ['app/'] : ['assets/']), 'components/', '  ui/', '  layout/', 'hooks/', 'lib/', ...(next ? [] : ['pages/']), 'services/'],
  feature: (next) => ['app/', 'features/', ...(next ? [] : ['pages/']), 'shared/', '  api/', '  components/', '  hooks/', '  lib/'],
}

function StructureSection() {
  const config = useApp((s) => s.config)
  const update = useApp((s) => s.updateConfig)
  return (
    <Section
      title="Estrutura de pastas"
      description="Como organizar o src/. O alias @/ aponta para src/ em todas."
      icon={<FolderTree />}
    >
      <div className="grid grid-cols-3 gap-2">
        {structures.map((s) => {
          const active = config.structure === s.id
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => update({ structure: s.id })}
              className={clsx(
                'flex flex-col gap-2 rounded-xl border p-3.5 text-left transition-all',
                active ? 'border-accent/60 bg-accent/[0.07] ring-1 ring-accent/30' : 'border-line hover:border-line-strong',
              )}
            >
              <span className="font-medium">{s.label}</span>
              <pre className="rounded-lg bg-bg/60 px-2.5 py-2 font-mono text-[11px] leading-[1.55] text-muted">
                {'src/\n' + structureTrees[s.id](config.framework === 'next').map((l) => '  ' + l).join('\n')}
              </pre>
              <p className="text-[12px] leading-relaxed text-muted">{s.description}</p>
            </button>
          )
        })}
      </div>
    </Section>
  )
}

const postOptions: { id: keyof PostActions; label: string; tool?: 'git' | 'code' }[] = [
  { id: 'install', label: 'Instalar dependências' },
  { id: 'git', label: 'git init + commit', tool: 'git' },
  { id: 'vscode', label: 'Abrir no VS Code', tool: 'code' },
  { id: 'explorer', label: 'Abrir a pasta' },
  { id: 'dev', label: 'Rodar servidor dev' },
]

function PostSection() {
  const config = useApp((s) => s.config)
  const update = useApp((s) => s.updateConfig)
  const tools = useApp((s) => s.tools)
  return (
    <Section title="Depois de criar" description="O que fazer automaticamente quando o projeto estiver pronto." icon={<PartyPopper />}>
      <div className="flex flex-wrap gap-2">
        {postOptions.map((o) => {
          const missing = !!o.tool && !!tools && !tools[o.tool]
          const disabled = missing || (o.id === 'dev' && !config.post.install)
          const on = config.post[o.id] && !disabled
          return (
            <button
              key={o.id}
              type="button"
              disabled={disabled}
              title={missing ? `${o.tool === 'code' ? 'VS Code' : 'git'} não encontrado no PATH` : undefined}
              onClick={() => update((c) => ({ post: { ...c.post, [o.id]: !c.post[o.id] } }))}
              className={clsx(
                'flex h-8 items-center gap-2 rounded-lg border px-3 text-[12.5px] font-medium transition-all disabled:opacity-40',
                on ? 'border-accent/50 bg-accent/12 text-fg' : 'border-line text-muted hover:border-line-strong hover:text-fg',
              )}
            >
              <span
                className={clsx(
                  'grid size-3.5 place-items-center rounded-[4px] border transition-colors',
                  on ? 'border-accent bg-accent text-accent-fg' : 'border-line-strong',
                )}
              >
                {on && <Check className="size-2.5" strokeWidth={3} />}
              </span>
              {o.label}
            </button>
          )
        })}
      </div>
    </Section>
  )
}

