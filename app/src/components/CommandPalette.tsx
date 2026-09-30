import clsx from 'clsx'
import { Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { allPresets, useApp } from '@/lib/state'
import { FrameworkLogo } from './Logos'

/** Ctrl+K: troca rápida de preset. */
export function CommandPalette() {
  const open = useApp((s) => s.palette)
  const setOpen = useApp((s) => s.setPalette)
  const presets = useApp((s) => s.presets)
  const apply = useApp((s) => s.applyPreset)
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)

  const items = useMemo(() => {
    const q = query.toLowerCase().trim()
    return allPresets(presets).filter((p) => !q || `${p.name} ${p.description}`.toLowerCase().includes(q))
  }, [presets, query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setIndex(0)
    }
  }, [open])

  if (!open) return null

  return (
    <div className="animate-in fixed inset-0 z-50 flex justify-center bg-bg/60 pt-[14vh] backdrop-blur-[2px]" onMouseDown={() => setOpen(false)}>
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="animate-pop h-fit w-[520px] overflow-hidden rounded-2xl border border-line-strong bg-panel shadow-2xl shadow-black/50"
      >
        <div className="flex items-center gap-2.5 border-b border-line px-4">
          <Search className="size-4 text-subtle" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIndex(0)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') setIndex((i) => Math.min(i + 1, items.length - 1))
              else if (e.key === 'ArrowUp') setIndex((i) => Math.max(i - 1, 0))
              else if (e.key === 'Enter' && items[index]) apply(items[index])
              else if (e.key === 'Escape') setOpen(false)
              else return
              e.preventDefault()
            }}
            placeholder="Buscar preset…"
            className="h-12 flex-1 bg-transparent text-[14px] outline-none placeholder:text-subtle"
          />
        </div>
        <div className="max-h-80 overflow-y-auto p-1.5">
          {items.length === 0 && <p className="px-3 py-6 text-center text-muted">Nenhum preset encontrado.</p>}
          {items.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onMouseEnter={() => setIndex(i)}
              onClick={() => apply(p)}
              className={clsx('flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left', i === index && 'bg-accent/12')}
            >
              <FrameworkLogo framework={p.config.framework} className="size-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-medium">{p.name}</div>
                <div className="truncate text-[12px] text-muted">{p.description}</div>
              </div>
              {i === index && <span className="text-[11px] text-subtle">Enter</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
