import clsx from 'clsx'
import { Check, ChevronDown, Code2, FolderOpen, Play, RotateCcw, TerminalSquare, TriangleAlert, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { planSteps } from '@stackforge/core'
import { openTarget } from '@/lib/bridge'
import { useApp, type StepStatus } from '@/lib/state'
import { FrameworkLogo } from './Logos'
import { Button, Spinner } from './ui'

export function RunOverlay() {
  const run = useApp((s) => s.run)
  const cancel = useApp((s) => s.cancelCreate)
  const close = useApp((s) => s.closeRun)
  const start = useApp((s) => s.startCreate)
  const [showLog, setShowLog] = useState(false)
  const [now, setNow] = useState(Date.now())
  const logRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    if (run?.status !== 'running') return
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [run?.status])

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [run?.logs.length, showLog])

  useEffect(() => {
    if (run?.status === 'error') setShowLog(true)
  }, [run?.status])

  if (!run) return null
  const steps = planSteps(run.config)
  const elapsed = ((run.status === 'running' ? now : run.startedAt + (run.ms ?? now - run.startedAt)) - run.startedAt) / 1000
  const warnings = steps.map((s) => run.steps[s.id]).filter((s) => s?.status === 'warn' && s.message)
  const path = run.path ?? ''
  const pm = run.config.packageManager

  return (
    <div className="animate-in fixed inset-0 top-9 z-40 grid place-items-center bg-bg/70 backdrop-blur-sm">
      <div className="animate-pop flex max-h-[88%] w-[560px] flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl shadow-black/40">
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <div className="grid size-10 place-items-center rounded-xl bg-elevated ring-1 ring-line">
            <FrameworkLogo framework={run.config.framework} className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[15px] font-semibold">
              {run.status === 'running' && `Criando ${run.config.name}…`}
              {run.status === 'done' && `${run.config.name} está pronto!`}
              {run.status === 'error' && 'Algo deu errado'}
              {run.status === 'cancelled' && 'Criação cancelada'}
            </h2>
            <p className="text-[12px] text-muted tabular-nums">
              {run.status === 'done' ? `Concluído em ${elapsed.toFixed(1)}s` : `${elapsed.toFixed(1)}s`}
            </p>
          </div>
          {run.status !== 'running' && (
            <Button variant="ghost" size="sm" onClick={close} aria-label="Fechar">
              <X />
            </Button>
          )}
        </div>

        <ol className="flex flex-col gap-1 px-5 py-4">
          {steps.map((s) => {
            const st = run.steps[s.id]
            const status: StepStatus = st?.status ?? (run.status === 'running' ? 'pending' : 'pending')
            return (
              <li key={s.id} className="flex items-start gap-3 py-1">
                <StepIcon status={status} idle={run.status !== 'running'} />
                <div className="min-w-0 flex-1">
                  <span className={clsx('text-[13px]', status === 'pending' ? 'text-subtle' : 'text-fg')}>{s.label}</span>
                  {st?.message && (
                    <p className={clsx('mt-0.5 text-[12px]', status === 'error' ? 'text-danger' : 'text-warn')}>{st.message}</p>
                  )}
                </div>
              </li>
            )
          })}
        </ol>

        {run.error && (
          <div className="mx-5 mb-3 flex items-start gap-2 rounded-lg bg-danger/10 px-3 py-2 text-[12.5px] text-danger">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" /> {run.error}
          </div>
        )}

        <div className="border-t border-line">
          <button
            type="button"
            onClick={() => setShowLog(!showLog)}
            className="flex w-full items-center gap-2 px-5 py-2.5 text-[12px] text-muted hover:text-fg"
          >
            <TerminalSquare className="size-3.5" /> Log
            <span className="min-w-0 flex-1 truncate text-left font-mono text-[11px] text-subtle">
              {!showLog && run.logs.at(-1)}
            </span>
            <ChevronDown className={clsx('size-3.5 transition-transform', showLog && 'rotate-180')} />
          </button>
          {showLog && (
            <pre
              ref={logRef}
              className="h-48 overflow-auto bg-bg/60 px-5 py-3 font-mono text-[11px] leading-relaxed text-muted"
            >
              {run.logs.join('\n') || 'Sem saída ainda…'}
            </pre>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-line bg-elevated/40 px-5 py-3">
          {run.status === 'running' && (
            <>
              <span className="flex-1 text-[12px] text-subtle">
                {warnings.length ? '' : 'A instalação costuma levar de 15 a 60 segundos.'}
              </span>
              <Button variant="danger" onClick={cancel}>
                Cancelar
              </Button>
            </>
          )}
          {run.status === 'done' && (
            <>
              <Button variant="primary" onClick={() => openTarget('vscode', path, pm)}>
                <Code2 /> VS Code
              </Button>
              <Button onClick={() => openTarget('explorer', path, pm)}>
                <FolderOpen /> Pasta
              </Button>
              <Button onClick={() => openTarget('dev', path, pm)} disabled={!run.config.post.install}>
                <Play /> Rodar dev
              </Button>
              <div className="flex-1" />
              <Button variant="ghost" onClick={close}>
                Criar outro
              </Button>
            </>
          )}
          {(run.status === 'error' || run.status === 'cancelled') && (
            <>
              <span className="flex-1 text-[12px] text-subtle">
                {run.status === 'cancelled' ? 'Arquivos já gerados continuam na pasta.' : 'Veja o log acima para detalhes.'}
              </span>
              <Button variant="ghost" onClick={close}>
                Voltar
              </Button>
              {run.status === 'error' && (
                <Button onClick={() => void start()}>
                  <RotateCcw /> Tentar de novo
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function StepIcon({ status, idle }: { status: StepStatus; idle: boolean }) {
  return (
    <span
      className={clsx(
        'mt-px grid size-5 shrink-0 place-items-center rounded-full transition-all',
        status === 'done' && 'animate-pop bg-ok/15 text-ok',
        status === 'warn' && 'animate-pop bg-warn/15 text-warn',
        status === 'error' && 'bg-danger/15 text-danger',
        status === 'running' && 'text-accent',
        status === 'pending' && 'ring-1 ring-line-strong ring-inset',
      )}
    >
      {status === 'done' && <Check className="size-3" strokeWidth={3} />}
      {status === 'warn' && <span className="text-[11px] font-bold">!</span>}
      {status === 'error' && <X className="size-3" strokeWidth={3} />}
      {status === 'running' && (idle ? <span className="size-1.5 rounded-full bg-current" /> : <Spinner className="size-4" />)}
    </span>
  )
}
