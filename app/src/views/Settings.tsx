import clsx from 'clsx'
import { CheckCircle2, CircleDashed, FolderOpen, Monitor, Moon, RefreshCw, Sun } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button, Input, Section, Segmented } from '@/components/ui'
import { pickFolder, type Tools } from '@/lib/bridge'
import { accents, useApp } from '@/lib/state'

const toolInfo: { id: keyof Tools; label: string; hint: string }[] = [
  { id: 'node', label: 'Node.js', hint: 'Obrigatório — roda o gerador e os projetos.' },
  { id: 'npm', label: 'npm', hint: 'Vem junto com o Node.' },
  { id: 'pnpm', label: 'pnpm', hint: 'Opcional — instalações mais rápidas: npm i -g pnpm' },
  { id: 'bun', label: 'Bun', hint: 'Opcional — o mais rápido para instalar: bun.sh' },
  { id: 'git', label: 'Git', hint: 'Para iniciar o repositório automaticamente.' },
  { id: 'code', label: 'VS Code', hint: 'Para abrir o projeto no editor.' },
]

export function SettingsView() {
  const settings = useApp((s) => s.settings)
  const update = useApp((s) => s.updateSettings)
  const tools = useApp((s) => s.tools)
  const refresh = useApp((s) => s.refreshTools)

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-7 py-6">
        <h1 className="text-[22px] font-semibold tracking-tight">Configurações</h1>

        <Section title="Geral">
          <Row label="Pasta padrão" hint="Onde novos projetos são criados.">
            <div className="flex w-80 gap-2">
              <Input value={settings.parentDir} onChange={(e) => update({ parentDir: e.target.value })} className="font-mono text-[12px]" />
              <Button
                className="h-9"
                onClick={async () => {
                  const dir = await pickFolder(settings.parentDir)
                  if (dir) update({ parentDir: dir })
                }}
              >
                <FolderOpen />
              </Button>
            </div>
          </Row>
        </Section>

        <Section title="Aparência">
          <Row label="Tema">
            <Segmented
              value={settings.theme}
              onChange={(theme) => update({ theme })}
              options={[
                { value: 'dark', label: <Label icon={<Moon />}>Escuro</Label> },
                { value: 'light', label: <Label icon={<Sun />}>Claro</Label> },
                { value: 'system', label: <Label icon={<Monitor />}>Sistema</Label> },
              ]}
            />
          </Row>
          <Row label="Cor de destaque">
            <div className="flex gap-2">
              {accents.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  aria-label={a.id}
                  onClick={() => update({ accent: a.color })}
                  style={{ background: a.color }}
                  className={clsx(
                    'size-6 rounded-full transition-transform hover:scale-110',
                    settings.accent === a.color && 'ring-2 ring-fg/80 ring-offset-2 ring-offset-panel',
                  )}
                />
              ))}
            </div>
          </Row>
        </Section>

        <Section
          title="Ferramentas detectadas"
          description="O StackForge usa o que já está instalado no seu computador."
          action={
            <Button variant="ghost" size="sm" onClick={() => refresh()}>
              <RefreshCw /> Verificar
            </Button>
          }
        >
          <div className="grid grid-cols-2 gap-2">
            {toolInfo.map((t) => {
              const version = tools?.[t.id]
              return (
                <div key={t.id} className="flex items-start gap-3 rounded-xl border border-line px-3.5 py-3">
                  {version ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ok" />
                  ) : (
                    <CircleDashed className="mt-0.5 size-4 shrink-0 text-subtle" />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{t.label}</span>
                      <span className="font-mono text-[11.5px] text-subtle">{version ?? (tools ? 'não encontrado' : '…')}</span>
                    </div>
                    <p className="text-[12px] text-muted">{t.hint}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </Section>

        <p className="text-center text-[11.5px] text-subtle">StackForge 0.1.0 · Tauri + React</p>
      </div>
    </div>
  )
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 border-t border-line py-3 first:border-t-0 first:pt-0 last:pb-0">
      <div>
        <div className="font-medium">{label}</div>
        {hint && <div className="text-[12px] text-muted">{hint}</div>}
      </div>
      {children}
    </div>
  )
}

function Label({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 [&_svg]:size-3.5">
      {icon}
      {children}
    </span>
  )
}
