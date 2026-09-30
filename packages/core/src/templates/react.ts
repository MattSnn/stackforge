import { alias, type Layout } from '../layout'
import type { ProjectConfig } from '../types'
import { dedent, lines } from './common'

/** Pastas dos exemplos opcionais. */
export function exampleDirs(config: ProjectConfig, layout: Layout) {
  if (config.structure === 'feature') {
    const base = 'src/features/examples'
    return { components: `${base}/components`, hooks: `${base}/hooks`, store: `${base}/store` }
  }
  return { components: `${layout.components}/examples`, hooks: layout.hooks, store: layout.store }
}

export interface ExampleSet {
  counter: boolean
  form: boolean
  posts: boolean
}

export function activeExamples(config: ProjectConfig): ExampleSet {
  const on = config.examples
  return {
    counter: on && config.features.zustand,
    form: on && config.features.forms,
    posts: on && config.features.query,
  }
}

/** className só quando o projeto usa Tailwind. */
const cn = (config: ProjectConfig, classes: string) => (config.tailwind ? ` className="${classes}"` : '')

const muted = (config: ProjectConfig) => (config.shadcn ? 'text-muted-foreground' : 'text-neutral-500 dark:text-neutral-400')
const surface = (config: ProjectConfig) =>
  config.shadcn ? 'bg-muted' : 'bg-neutral-100 dark:bg-neutral-800'
const border = (config: ProjectConfig) => (config.shadcn ? 'border' : 'border border-neutral-200 dark:border-neutral-800')

/**
 * Componente da página inicial. Limpo: título, dica de onde editar e, se escolhidos,
 * botão do shadcn, ícone e exemplos.
 */
export function homeComponent(
  config: ProjectConfig,
  layout: Layout,
  opts: { name: string; editPath: string; exportDefault: boolean },
): string {
  const ex = activeExamples(config)
  const dirs = exampleDirs(config, layout)
  const anyExample = ex.counter || ex.form || ex.posts
  const icon = config.features.icons

  const imports = lines(
    icon && `import { Rocket } from 'lucide-react'`,
    config.shadcn && `import { Button } from '${alias(layout.ui)}/button'`,
    ex.counter && `import { ExampleCounter } from '${alias(dirs.components)}/ExampleCounter'`,
    ex.form && `import { ExampleForm } from '${alias(dirs.components)}/ExampleForm'`,
    ex.posts && `import { ExamplePosts } from '${alias(dirs.components)}/ExamplePosts'`,
  )

  const body = lines(
    icon && `      <Rocket${cn(config, `size-10 ${muted(config)}`)} />`,
    `      <h1${cn(config, 'text-4xl font-bold tracking-tight')}>${config.name}</h1>`,
    `      <p${cn(config, muted(config))}>`,
    `        Edite <code${cn(config, `rounded ${surface(config)} px-1.5 py-0.5 font-mono text-sm`)}>${opts.editPath}</code> para começar.`,
    `      </p>`,
    config.shadcn && `      <Button>Começar</Button>`,
    anyExample && `      <div${cn(config, 'mt-6 grid w-full gap-4 text-left sm:grid-cols-2')}>`,
    ex.counter && `        <ExampleCounter />`,
    ex.form && `        <ExampleForm />`,
    ex.posts && `        <ExamplePosts />`,
    anyExample && `      </div>`,
  )

  const mainClasses = anyExample
    ? 'mx-auto flex min-h-svh max-w-3xl flex-col items-center justify-center gap-4 p-8 text-center'
    : 'flex min-h-svh flex-col items-center justify-center gap-4 p-8 text-center'
  const mainStyle = config.tailwind
    ? ''
    : ` style={{ minHeight: '100svh', display: 'grid', placeContent: 'center', justifyItems: 'center', gap: '1rem', textAlign: 'center' }}`

  return lines(
    imports,
    imports && '',
    `${opts.exportDefault ? 'export default function' : 'export function'} ${opts.name}() {`,
    `  return (`,
    `    <main${cn(config, mainClasses)}${mainStyle}>`,
    body,
    `    </main>`,
    `  )`,
    `}`,
    '',
  )
}

export function notFoundPage(config: ProjectConfig): string {
  return dedent(`
    import { Link } from 'react-router'

    export default function NotFoundPage() {
      return (
        <main${cn(config, 'flex min-h-svh flex-col items-center justify-center gap-3 p-8 text-center')}>
          <h1${cn(config, 'text-6xl font-bold')}>404</h1>
          <p${cn(config, muted(config))}>Página não encontrada.</p>
          <Link to="/"${cn(config, 'underline underline-offset-4')}>Voltar ao início</Link>
        </main>
      )
    }
  `)
}

// ---------- exemplos ----------

const client = (config: ProjectConfig) => (config.framework === 'next' ? `'use client'\n\n` : '')

const card = (config: ProjectConfig) => cn(config, `rounded-xl ${border(config)} p-5`)
const cardTitle = (config: ProjectConfig) => cn(config, 'mb-3 font-semibold')
const btn = (config: ProjectConfig, primary = true) =>
  cn(
    config,
    primary
      ? config.shadcn
        ? 'rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground'
        : 'rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white dark:bg-white dark:text-neutral-900'
      : `rounded-md ${border(config)} px-3 py-1.5 text-sm`,
  )

export function counterStore(ts: boolean): string {
  return ts
    ? dedent(`
        import { create } from 'zustand'

        interface CounterState {
          count: number
          increment: () => void
          reset: () => void
        }

        export const useCounterStore = create<CounterState>()((set) => ({
          count: 0,
          increment: () => set((state) => ({ count: state.count + 1 })),
          reset: () => set({ count: 0 }),
        }))
      `)
    : dedent(`
        import { create } from 'zustand'

        export const useCounterStore = create((set) => ({
          count: 0,
          increment: () => set((state) => ({ count: state.count + 1 })),
          reset: () => set({ count: 0 }),
        }))
      `)
}

export function exampleCounter(config: ProjectConfig, storeAlias: string): string {
  return (
    client(config) +
    dedent(`
      import { useCounterStore } from '${storeAlias}/useCounterStore'

      export function ExampleCounter() {
        const count = useCounterStore((state) => state.count)
        const increment = useCounterStore((state) => state.increment)
        const reset = useCounterStore((state) => state.reset)

        return (
          <section${card(config)}>
            <h2${cardTitle(config)}>Estado global (Zustand)</h2>
            <p${cn(config, 'mb-3 text-3xl font-bold tabular-nums')}>{count}</p>
            <div${cn(config, 'flex gap-2')}>
              <button type="button" onClick={increment}${btn(config)}>
                +1
              </button>
              <button type="button" onClick={reset}${btn(config, false)}>
                Zerar
              </button>
            </div>
          </section>
        )
      }
    `)
  )
}

export function exampleForm(config: ProjectConfig): string {
  const ts = config.language === 'ts'
  const input = cn(config, `w-full rounded-md ${border(config)} bg-transparent px-3 py-1.5 text-sm`)
  const error = cn(config, 'text-sm text-red-500')
  return (
    client(config) +
    dedent(`
      import { zodResolver } from '@hookform/resolvers/zod'
      import { useForm } from 'react-hook-form'
      import { z } from 'zod'

      const schema = z.object({
        email: z.email('Informe um e-mail válido'),
        password: z.string().min(8, 'Mínimo de 8 caracteres'),
      })
      ${ts ? '\n      type FormValues = z.infer<typeof schema>\n' : ''}
      export function ExampleForm() {
        const {
          register,
          handleSubmit,
          formState: { errors, isSubmitSuccessful },
        } = useForm${ts ? '<FormValues>' : ''}({ resolver: zodResolver(schema) })

        return (
          <form
            onSubmit={handleSubmit((values) => console.log(values))}${card(config)}
            noValidate
          >
            <h2${cardTitle(config)}>Formulário (react-hook-form + zod)</h2>
            <div${cn(config, 'flex flex-col gap-2')}>
              <input {...register('email')} placeholder="E-mail"${input} />
              {errors.email && <span${error}>{errors.email.message}</span>}
              <input {...register('password')} type="password" placeholder="Senha"${input} />
              {errors.password && <span${error}>{errors.password.message}</span>}
              <button type="submit"${btn(config)}>
                Enviar
              </button>
              {isSubmitSuccessful && <span${cn(config, 'text-sm text-green-600')}>Válido! Veja o console.</span>}
            </div>
          </form>
        )
      }
    `)
  )
}

export function postsHook(ts: boolean): string {
  return dedent(`
    import { useQuery } from '@tanstack/react-query'
    ${
      ts
        ? `
    export interface Post {
      id: number
      title: string
    }
`
        : ''
    }
    export function usePosts() {
      return useQuery({
        queryKey: ['posts'],
        queryFn: async ()${ts ? ': Promise<Post[]>' : ''} => {
          const res = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5')
          if (!res.ok) throw new Error('Falha ao carregar os posts')
          return res.json()
        },
      })
    }
  `)
}

export function examplePosts(config: ProjectConfig, hooksAlias: string): string {
  return (
    client(config) +
    dedent(`
      import { usePosts } from '${hooksAlias}/usePosts'

      export function ExamplePosts() {
        const { data, isPending, error } = usePosts()

        return (
          <section${cn(config, `rounded-xl ${border(config)} p-5 sm:col-span-2`)}>
            <h2${cardTitle(config)}>Dados de API (TanStack Query)</h2>
            {isPending && <p${cn(config, muted(config))}>Carregando…</p>}
            {error && <p${cn(config, 'text-red-500')}>{error.message}</p>}
            <ul${cn(config, 'list-disc space-y-1 pl-5 text-sm')}>
              {data?.map((post) => (
                <li key={post.id}>{post.title}</li>
              ))}
            </ul>
          </section>
        )
      }
    `)
  )
}
