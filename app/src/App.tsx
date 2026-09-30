import { useEffect } from 'react'
import { CommandPalette } from '@/components/CommandPalette'
import { AppLogo } from '@/components/Logos'
import { RunOverlay } from '@/components/RunOverlay'
import { Sidebar, TitleBar } from '@/components/Shell'
import { Button, Spinner } from '@/components/ui'
import { useApp } from '@/lib/state'
import { NewProject } from '@/views/NewProject'
import { Presets } from '@/views/Presets'
import { Recents } from '@/views/Recents'
import { SettingsView } from '@/views/Settings'

export default function App() {
  const ready = useApp((s) => s.ready)
  const view = useApp((s) => s.view)
  const tools = useApp((s) => s.tools)
  const toolsError = useApp((s) => s.toolsError)
  useTheme()
  useShortcuts()

  useEffect(() => {
    void useApp.getState().init()
  }, [])

  return (
    <div className="flex h-full flex-col">
      <TitleBar />
      {!ready ? (
        <div className="grid flex-1 place-items-center">
          <Spinner className="size-5 text-accent" />
        </div>
      ) : toolsError ? (
        <EngineError message={toolsError} />
      ) : tools && !tools.node ? (
        <NodeMissing />
      ) : (
        <div className="flex min-h-0 flex-1">
          <Sidebar />
          {view === 'new' && <NewProject />}
          {view === 'presets' && <Presets />}
          {view === 'recents' && <Recents />}
          {view === 'settings' && <SettingsView />}
        </div>
      )}
      <RunOverlay />
      <CommandPalette />
    </div>
  )
}

function NodeMissing() {
  const refresh = useApp((s) => s.refreshTools)
  return (
    <div className="grid flex-1 place-items-center p-8">
      <div className="animate-pop flex max-w-md flex-col items-center gap-4 text-center">
        <AppLogo className="size-14" />
        <h1 className="text-[20px] font-semibold">Falta só o Node.js</h1>
        <p className="text-muted">
          O StackForge usa o Node.js instalado no seu computador para gerar e instalar os projetos. Instale a versão LTS e
          clique em verificar.
        </p>
        <pre className="rounded-lg border border-line bg-panel px-4 py-2 font-mono text-[12px]">winget install OpenJS.NodeJS.LTS</pre>
        <Button variant="primary" onClick={() => refresh()}>
          Verificar novamente
        </Button>
      </div>
    </div>
  )
}

function EngineError({ message }: { message: string }) {
  const refresh = useApp((s) => s.refreshTools)
  return (
    <div className="grid flex-1 place-items-center p-8">
      <div className="animate-pop flex w-full max-w-xl flex-col items-center gap-4 text-center">
        <AppLogo className="size-14" />
        <h1 className="text-[20px] font-semibold">Não foi possível iniciar o gerador</h1>
        <p className="text-muted">O Node.js foi encontrado, mas o engine do StackForge falhou. Detalhes:</p>
        <pre className="max-h-48 w-full overflow-auto rounded-lg border border-line bg-panel px-4 py-3 text-left font-mono text-[11.5px] whitespace-pre-wrap text-danger">
          {message}
        </pre>
        <Button variant="primary" onClick={() => refresh()}>
          Tentar novamente
        </Button>
      </div>
    </div>
  )
}

function useTheme() {
  const theme = useApp((s) => s.settings.theme)
  const accent = useApp((s) => s.settings.accent)
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches)
      document.documentElement.classList.toggle('dark', dark)
    }
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accent)
  }, [accent])
}

function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useApp.getState()
      if (!e.ctrlKey) return
      if (e.key === 'k') {
        e.preventDefault()
        s.setPalette(!s.palette)
      } else if (e.key === 'Enter' && s.view === 'new' && !s.run) {
        e.preventDefault()
        // O botão de criar valida nome/pasta; o atalho só o aciona se estiver habilitado.
        const button = document.querySelector<HTMLButtonElement>('[data-create]')
        if (button && !button.disabled) button.click()
      } else if (e.key === 's' && s.view === 'new') {
        e.preventDefault()
        document.querySelector<HTMLButtonElement>('[data-save-preset]')?.click()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
