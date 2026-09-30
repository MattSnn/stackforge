import clsx from 'clsx'
import { BookmarkPlus, ChevronRight, File, FileCode2, FileJson, Folder, Package, Rocket, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { buildTree, type FileEntry, type TreeNode } from '@stackforge/core'
import { usePlan, useTargetProblem } from '@/lib/hooks'
import { useApp } from '@/lib/state'
import { Button, Input, Kbd } from './ui'

export function PreviewPanel() {
  const planned = usePlan()
  const [tab, setTab] = useState<'files' | 'packages'>('files')
  const [openFile, setOpenFile] = useState<FileEntry | null>(null)
  const [saving, setSaving] = useState(false)
  const problem = useTargetProblem()
  const startCreate = useApp((s) => s.startCreate)
  const tree = useMemo(() => buildTree(planned.files), [planned.files])
  const deps = Object.entries(planned.dependencies)
  const devDeps = Object.entries(planned.devDependencies)
  const fileCount = planned.files.filter((f) => !f.path.endsWith('.gitkeep')).length

  return (
    <aside className="relative flex w-[340px] shrink-0 flex-col border-l border-line bg-panel">
      <div className="flex items-center gap-1 border-b border-line px-3 pt-3">
        <Tab active={tab === 'files'} onClick={() => setTab('files')}>
          Arquivos <span className="text-subtle">{fileCount}</span>
        </Tab>
        <Tab active={tab === 'packages'} onClick={() => setTab('packages')}>
          Pacotes <span className="text-subtle">{deps.length + devDeps.length}</span>
        </Tab>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {tab === 'files' ? (
          <div className="animate-in">
            <div className="flex items-center gap-1.5 px-2 py-1 font-mono text-[12px] font-medium">
              <Folder className="size-3.5 text-accent" /> {planned.config.name || 'meu-projeto'}/
            </div>
            {tree.children.map((n) => (
              <TreeItem key={n.path} node={n} depth={1} onOpen={(path) => setOpenFile(planned.files.find((f) => f.path === path) ?? null)} />
            ))}
          </div>
        ) : (
          <div className="animate-in flex flex-col gap-4 px-2 py-1">
            <PackageList title="dependencies" items={deps} />
            <PackageList title="devDependencies" items={devDeps} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-line p-3">
        {saving ? (
          <SavePreset onDone={() => setSaving(false)} />
        ) : (
          <Button data-save-preset variant="ghost" size="sm" onClick={() => setSaving(true)} className="self-start">
            <BookmarkPlus /> Salvar como preset
          </Button>
        )}
        {problem && <p className="px-1 text-[11.5px] text-danger">{problem}</p>}
        <Button data-create variant="primary" size="lg" disabled={!!problem} onClick={() => startCreate()} className="w-full">
          <Rocket /> Criar projeto
          <span className="ml-1 flex gap-0.5 opacity-70">
            <Kbd>Ctrl</Kbd>
            <Kbd>↵</Kbd>
          </span>
        </Button>
      </div>

      {openFile && <FileViewer file={openFile} onClose={() => setOpenFile(null)} />}
    </aside>
  )
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        '-mb-px flex items-center gap-1.5 border-b-2 px-2.5 pb-2 text-[12.5px] font-medium transition-colors',
        active ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg',
      )}
    >
      {children}
    </button>
  )
}

function fileIcon(name: string) {
  if (name.endsWith('.json')) return <FileJson className="size-3.5 text-amber-400/80" />
  if (/\.(tsx?|jsx?|mjs)$/.test(name)) return <FileCode2 className="size-3.5 text-sky-400/80" />
  if (name.endsWith('.css')) return <FileCode2 className="size-3.5 text-pink-400/80" />
  return <File className="size-3.5 text-subtle" />
}

function TreeItem({ node, depth, onOpen }: { node: TreeNode; depth: number; onOpen: (path: string) => void }) {
  const [open, setOpen] = useState(!['.vscode'].includes(node.name))
  const pad = { paddingLeft: depth * 12 + 6 }
  if (node.kind === 'file') {
    return (
      <button
        type="button"
        style={pad}
        onClick={() => onOpen(node.path)}
        className="flex h-[26px] w-full items-center gap-1.5 rounded-md pr-2 text-left font-mono text-[12px] text-muted transition-colors hover:bg-hover hover:text-fg"
      >
        <span className="w-3" />
        {fileIcon(node.name)}
        <span className="truncate">{node.name}</span>
      </button>
    )
  }
  return (
    <div>
      <button
        type="button"
        style={pad}
        onClick={() => setOpen(!open)}
        className="flex h-[26px] w-full items-center gap-1.5 rounded-md pr-2 text-left font-mono text-[12px] text-fg/90 transition-colors hover:bg-hover"
      >
        <ChevronRight className={clsx('size-3 text-subtle transition-transform', open && 'rotate-90')} />
        <Folder className="size-3.5 text-accent/80" />
        <span className="truncate">{node.name}</span>
        {node.children.length === 0 && <span className="ml-auto text-[10.5px] text-subtle">vazia</span>}
      </button>
      {open && node.children.map((c) => <TreeItem key={c.path} node={c} depth={depth + 1} onOpen={onOpen} />)}
    </div>
  )
}

function PackageList({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-subtle uppercase">
        <Package className="size-3" /> {title}
      </div>
      <div className="flex flex-col">
        {items.map(([name, version]) => (
          <div key={name} className="flex h-7 items-center justify-between gap-2 rounded-md px-2 font-mono text-[12px] hover:bg-hover">
            <span className="truncate">{name}</span>
            <span className="shrink-0 text-subtle">{version}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FileViewer({ file, onClose }: { file: FileEntry; onClose: () => void }) {
  return (
    <div className="animate-in absolute inset-0 z-10 flex flex-col bg-panel">
      <div className="flex h-11 items-center gap-2 border-b border-line px-3">
        {fileIcon(file.path)}
        <span className="min-w-0 flex-1 truncate font-mono text-[12px]">{file.path}</span>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fechar">
          <X />
        </Button>
      </div>
      <pre className="min-h-0 flex-1 overflow-auto p-3 font-mono text-[11.5px] leading-relaxed text-muted">
        {file.content || '(arquivo vazio — mantém a pasta no git)'}
      </pre>
    </div>
  )
}

function SavePreset({ onDone }: { onDone: () => void }) {
  const savePreset = useApp((s) => s.savePreset)
  const [name, setName] = useState('')
  const submit = () => {
    if (!name.trim()) return
    savePreset(name.trim())
    onDone()
  }
  return (
    <form
      className="animate-in flex gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <Input autoFocus placeholder="Nome do preset" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Escape' && onDone()} />
      <Button type="submit" variant="secondary" className="h-9">
        Salvar
      </Button>
    </form>
  )
}
