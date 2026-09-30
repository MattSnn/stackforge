import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { stackSummary, type Preset } from '@stackforge/core'
import { FrameworkLogo } from '@/components/Logos'
import { Badge, Button, Input } from '@/components/ui'
import { allPresets, useApp } from '@/lib/state'

export function Presets() {
  const presets = useApp((s) => s.presets)
  const list = allPresets(presets)
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl px-7 py-6">
        <h1 className="text-[22px] font-semibold tracking-tight">Presets</h1>
        <p className="mt-0.5 text-muted">
          Configurações prontas para reutilizar. Salve a sua em <b className="font-medium text-fg">Novo projeto → Salvar como preset</b>.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {list.map((p) => (
            <PresetCard key={p.id} preset={p} />
          ))}
        </div>
      </div>
    </div>
  )
}

function PresetCard({ preset }: { preset: Preset }) {
  const apply = useApp((s) => s.applyPreset)
  const remove = useApp((s) => s.deletePreset)
  const rename = useApp((s) => s.renamePreset)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(preset.name)
  const stack = stackSummary({ ...preset.config, name: '', parentDir: '' }).slice(0, -1)

  return (
    <div className="group animate-in flex flex-col gap-3 rounded-2xl border border-line bg-panel p-4 transition-colors hover:border-line-strong">
      <div className="flex items-center gap-3">
        <div className="grid size-9 place-items-center rounded-lg bg-elevated ring-1 ring-line">
          <FrameworkLogo framework={preset.config.framework} className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          {editing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (name.trim()) rename(preset.id, name.trim())
                setEditing(false)
              }}
            >
              <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setEditing(false)} className="h-7" />
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <span className="truncate font-semibold">{preset.name}</span>
              {preset.builtin && <Badge>embutido</Badge>}
            </div>
          )}
          <p className="truncate text-[12px] text-muted">{preset.description}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {stack.map((s) => (
          <Badge key={s}>{s.replace(/`/g, '').replace(/ \(.*\)/, '')}</Badge>
        ))}
      </div>
      <div className="mt-auto flex items-center gap-1 pt-1">
        <Button variant="primary" size="sm" onClick={() => apply(preset)}>
          Usar preset
        </Button>
        <div className="flex-1" />
        {!preset.builtin && (
          <>
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)} aria-label="Renomear">
              <Pencil />
            </Button>
            <Button variant="danger" size="sm" onClick={() => remove(preset.id)} aria-label="Excluir">
              <Trash2 />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
