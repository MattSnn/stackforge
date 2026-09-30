import { Clock, Code2, FolderOpen, Play, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { FrameworkLogo } from '@/components/Logos'
import { Badge, Button } from '@/components/ui'
import { openTarget, pathExists } from '@/lib/bridge'
import { useApp } from '@/lib/state'

const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })

function ago(ts: number) {
  const s = (ts - Date.now()) / 1000
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  for (const [unit, secs] of units) if (Math.abs(s) >= secs) return rtf.format(Math.round(s / secs), unit)
  return 'agora'
}

export function Recents() {
  const recents = useApp((s) => s.recents)
  const remove = useApp((s) => s.removeRecent)
  const setView = useApp((s) => s.setView)
  const [missing, setMissing] = useState<Set<string>>(new Set())

  useEffect(() => {
    Promise.all(recents.map(async (r) => [r.path, await pathExists(r.path)] as const)).then((res) =>
      setMissing(new Set(res.filter(([, ok]) => !ok).map(([p]) => p))),
    )
  }, [recents])

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl px-7 py-6">
        <h1 className="text-[22px] font-semibold tracking-tight">Recentes</h1>
        <p className="mt-0.5 text-muted">Projetos criados pelo StackForge.</p>

        {recents.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line py-16 text-center">
            <Clock className="size-8 text-subtle" />
            <p className="text-muted">Nenhum projeto criado ainda.</p>
            <Button variant="primary" onClick={() => setView('new')}>
              Criar o primeiro
            </Button>
          </div>
        ) : (
          <div className="mt-5 flex flex-col divide-y divide-line overflow-hidden rounded-2xl border border-line bg-panel">
            {recents.map((r) => {
              const gone = missing.has(r.path)
              return (
                <div key={r.path} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-hover">
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-elevated ring-1 ring-line">
                    <FrameworkLogo framework={r.framework} className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{r.name}</span>
                      {gone && <Badge tone="warn">pasta não encontrada</Badge>}
                      <span className="text-[11.5px] text-subtle">{ago(r.createdAt)}</span>
                    </div>
                    <p className="truncate font-mono text-[11.5px] text-subtle">{r.path}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" disabled={gone} onClick={() => openTarget('vscode', r.path, r.packageManager)} title="Abrir no VS Code">
                      <Code2 /> VS Code
                    </Button>
                    <Button size="sm" disabled={gone} onClick={() => openTarget('explorer', r.path)} title="Abrir pasta">
                      <FolderOpen />
                    </Button>
                    <Button size="sm" disabled={gone} onClick={() => openTarget('dev', r.path, r.packageManager)} title="Rodar servidor dev">
                      <Play />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(r.path)} title="Remover da lista" className="opacity-0 group-hover:opacity-100">
                      <X />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
