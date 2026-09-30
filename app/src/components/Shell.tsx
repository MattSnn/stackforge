import clsx from 'clsx'
import { Clock, Layers, Minus, Plus, Settings, Square, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { builtinPresets } from '@stackforge/core'
import { windowAction } from '@/lib/bridge'
import { useApp, type View } from '@/lib/state'
import { AppLogo } from './Logos'

export function TitleBar() {
  return (
    <div data-tauri-drag-region className="flex h-9 shrink-0 items-center border-b border-line bg-panel pl-3">
      <div data-tauri-drag-region className="pointer-events-none flex items-center gap-2">
        <AppLogo className="size-4" />
        <span className="text-[12px] font-semibold tracking-tight">StackForge</span>
      </div>
      <div data-tauri-drag-region className="flex-1 self-stretch" />
      <div className="flex self-stretch">
        <WinButton label="Minimizar" onClick={() => windowAction('minimize')}>
          <Minus />
        </WinButton>
        <WinButton label="Maximizar" onClick={() => windowAction('maximize')}>
          <Square className="!size-3" />
        </WinButton>
        <WinButton label="Fechar" danger onClick={() => windowAction('close')}>
          <X />
        </WinButton>
      </div>
    </div>
  )
}

function WinButton({ children, onClick, danger, label }: { children: ReactNode; onClick: () => void; danger?: boolean; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={clsx(
        'grid w-11 place-items-center text-muted transition-colors [&_svg]:size-3.5',
        danger ? 'hover:bg-[#e81123] hover:text-white' : 'hover:bg-hover hover:text-fg',
      )}
    >
      {children}
    </button>
  )
}

const nav: { id: View; label: string; icon: ReactNode }[] = [
  { id: 'new', label: 'Novo projeto', icon: <Plus /> },
  { id: 'presets', label: 'Presets', icon: <Layers /> },
  { id: 'recents', label: 'Recentes', icon: <Clock /> },
]

export function Sidebar() {
  const view = useApp((s) => s.view)
  const setView = useApp((s) => s.setView)
  const presetsCount = useApp((s) => s.presets.length)
  const recentsCount = useApp((s) => s.recents.length)
  const counts: Partial<Record<View, number>> = { presets: presetsCount + builtinPresets.length, recents: recentsCount }

  return (
    <nav className="flex w-52 shrink-0 flex-col gap-0.5 border-r border-line bg-panel p-2.5">
      {nav.map((item) => (
        <NavItem key={item.id} active={view === item.id} onClick={() => setView(item.id)} icon={item.icon} count={counts[item.id]}>
          {item.label}
        </NavItem>
      ))}
      <div className="flex-1" />
      <NavItem active={view === 'settings'} onClick={() => setView('settings')} icon={<Settings />}>
        Configurações
      </NavItem>
    </nav>
  )
}

function NavItem({
  active,
  onClick,
  icon,
  count,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: ReactNode
  count?: number
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'group flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium transition-colors [&_svg]:size-4',
        active ? 'bg-accent/12 text-fg' : 'text-muted hover:bg-hover hover:text-fg',
      )}
    >
      <span className={clsx(active ? 'text-accent' : 'text-subtle group-hover:text-muted')}>{icon}</span>
      <span className="flex-1 text-left">{children}</span>
      {!!count && <span className="text-[11px] text-subtle tabular-nums">{count}</span>}
    </button>
  )
}
