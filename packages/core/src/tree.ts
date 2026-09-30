import type { FileEntry } from './types'

export interface TreeNode {
  name: string
  path: string
  kind: 'dir' | 'file'
  children: TreeNode[]
}

/** Monta a árvore de pastas a partir da lista plana de arquivos (pastas primeiro, ordem alfabética). */
export function buildTree(files: FileEntry[]): TreeNode {
  const root: TreeNode = { name: '', path: '', kind: 'dir', children: [] }
  for (const file of files) {
    const parts = file.path.split('/')
    let node = root
    parts.forEach((part, i) => {
      const isFile = i === parts.length - 1
      if (isFile && part === '.gitkeep') return
      let child = node.children.find((c) => c.name === part)
      if (!child) {
        child = { name: part, path: parts.slice(0, i + 1).join('/'), kind: isFile ? 'file' : 'dir', children: [] }
        node.children.push(child)
      }
      node = child
    })
  }
  const sort = (n: TreeNode) => {
    n.children.sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === 'dir' ? -1 : 1))
    n.children.forEach(sort)
  }
  sort(root)
  return root
}
