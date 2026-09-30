import { useEffect, useMemo, useState } from 'react'
import { plan, validateName } from '@stackforge/core'
import { checkTarget, type TargetStatus } from './bridge'
import { useApp } from './state'

/** Situação da pasta de destino + erro do nome, com debounce. */
export function useTargetProblem(): string | null {
  const name = useApp((s) => s.config.name)
  const parentDir = useApp((s) => s.config.parentDir)
  const [status, setStatus] = useState<TargetStatus>('free')
  const nameError = validateName(name)

  useEffect(() => {
    if (nameError || !parentDir) return
    let alive = true
    const t = setTimeout(() => {
      checkTarget(parentDir, name).then((s) => alive && setStatus(s))
    }, 150)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [name, parentDir, nameError])

  if (nameError) return nameError
  if (!parentDir) return 'Escolha a pasta onde o projeto será criado.'
  if (status === 'taken') return 'Já existe uma pasta com esse nome e ela não está vazia.'
  if (status === 'missing-parent') return 'A pasta escolhida não existe.'
  return null
}

/** Plano calculado ao vivo a partir da configuração atual (mesma função que o engine usa). */
export function usePlan() {
  const config = useApp((s) => s.config)
  return useMemo(() => plan({ ...config, name: config.name || 'meu-projeto' }), [config])
}
