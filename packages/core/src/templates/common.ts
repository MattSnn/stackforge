import { alias, type Layout } from '../layout'
import type { ProjectConfig } from '../types'

export const json = (value: unknown) => JSON.stringify(value, null, 2) + '\n'

/** Remove a indentação comum de um template string e garante \n final. */
export function dedent(text: string): string {
  const lines = text.replace(/^\n/, '').replace(/\n\s*$/, '').split('\n')
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)![0].length))
  return lines.map((l) => l.slice(indent)).join('\n') + '\n'
}

/** Junta linhas ignorando false/undefined — útil para imports e blocos condicionais. */
export const lines = (...items: (string | false | undefined | null)[]) =>
  items.filter((i): i is string => typeof i === 'string').join('\n')

export function gitignore(config: ProjectConfig): string {
  return lines(
    '# dependências',
    'node_modules',
    '',
    '# build',
    config.framework === 'next' ? '.next\nout\nbuild\nnext-env.d.ts\n*.tsbuildinfo' : 'dist\ndist-ssr\n*.tsbuildinfo',
    '',
    '# ambiente',
    '.env*',
    '!.env.example',
    '',
    '# logs e sistema',
    '*.log',
    '.DS_Store',
    'Thumbs.db',
    '',
  )
}

export function envExample(config: ProjectConfig): string {
  const prefix = config.framework === 'next' ? 'NEXT_PUBLIC_' : 'VITE_'
  return dedent(`
    # Copie para .env.local e ajuste os valores.
    # Variáveis com prefixo ${prefix} ficam visíveis no navegador.
    ${prefix}API_URL=http://localhost:3000
  `)
}

export function cssFile(config: ProjectConfig): string {
  if (config.shadcn) return shadcnCss()
  if (config.tailwind) {
    return dedent(`
      @import 'tailwindcss';

      @layer base {
        body {
          @apply bg-white text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100;
        }
      }
    `)
  }
  return dedent(`
    :root {
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      color-scheme: light dark;
      -webkit-font-smoothing: antialiased;
    }

    body {
      margin: 0;
    }
  `)
}

function shadcnCss(): string {
  return dedent(`
    @import 'tailwindcss';
    @import 'tw-animate-css';

    @custom-variant dark (&:is(.dark *));

    @theme inline {
      --radius-sm: calc(var(--radius) - 4px);
      --radius-md: calc(var(--radius) - 2px);
      --radius-lg: var(--radius);
      --radius-xl: calc(var(--radius) + 4px);
      --color-background: var(--background);
      --color-foreground: var(--foreground);
      --color-card: var(--card);
      --color-card-foreground: var(--card-foreground);
      --color-popover: var(--popover);
      --color-popover-foreground: var(--popover-foreground);
      --color-primary: var(--primary);
      --color-primary-foreground: var(--primary-foreground);
      --color-secondary: var(--secondary);
      --color-secondary-foreground: var(--secondary-foreground);
      --color-muted: var(--muted);
      --color-muted-foreground: var(--muted-foreground);
      --color-accent: var(--accent);
      --color-accent-foreground: var(--accent-foreground);
      --color-destructive: var(--destructive);
      --color-border: var(--border);
      --color-input: var(--input);
      --color-ring: var(--ring);
    }

    :root {
      --radius: 0.625rem;
      --background: oklch(1 0 0);
      --foreground: oklch(0.145 0 0);
      --card: oklch(1 0 0);
      --card-foreground: oklch(0.145 0 0);
      --popover: oklch(1 0 0);
      --popover-foreground: oklch(0.145 0 0);
      --primary: oklch(0.205 0 0);
      --primary-foreground: oklch(0.985 0 0);
      --secondary: oklch(0.97 0 0);
      --secondary-foreground: oklch(0.205 0 0);
      --muted: oklch(0.97 0 0);
      --muted-foreground: oklch(0.556 0 0);
      --accent: oklch(0.97 0 0);
      --accent-foreground: oklch(0.205 0 0);
      --destructive: oklch(0.577 0.245 27.325);
      --border: oklch(0.922 0 0);
      --input: oklch(0.922 0 0);
      --ring: oklch(0.708 0 0);
    }

    .dark {
      --background: oklch(0.145 0 0);
      --foreground: oklch(0.985 0 0);
      --card: oklch(0.205 0 0);
      --card-foreground: oklch(0.985 0 0);
      --popover: oklch(0.205 0 0);
      --popover-foreground: oklch(0.985 0 0);
      --primary: oklch(0.922 0 0);
      --primary-foreground: oklch(0.205 0 0);
      --secondary: oklch(0.269 0 0);
      --secondary-foreground: oklch(0.985 0 0);
      --muted: oklch(0.269 0 0);
      --muted-foreground: oklch(0.708 0 0);
      --accent: oklch(0.269 0 0);
      --accent-foreground: oklch(0.985 0 0);
      --destructive: oklch(0.704 0.191 22.216);
      --border: oklch(1 0 0 / 10%);
      --input: oklch(1 0 0 / 15%);
      --ring: oklch(0.556 0 0);
    }

    @layer base {
      * {
        @apply border-border outline-ring/50;
      }
      body {
        @apply bg-background text-foreground antialiased;
      }
    }
  `)
}

export function componentsJson(config: ProjectConfig, layout: Layout, cssPath: string): string {
  return json({
    $schema: 'https://ui.shadcn.com/schema.json',
    style: 'new-york',
    rsc: config.framework === 'next',
    tsx: config.language === 'ts',
    tailwind: { config: '', css: cssPath, baseColor: 'neutral', cssVariables: true, prefix: '' },
    aliases: {
      components: alias(layout.components),
      utils: `${alias(layout.lib)}/utils`,
      ui: alias(layout.ui),
      lib: alias(layout.lib),
      hooks: alias(layout.hooks),
    },
    iconLibrary: 'lucide',
  })
}

export function utilsFile(ts: boolean): string {
  return ts
    ? dedent(`
        import { clsx, type ClassValue } from 'clsx'
        import { twMerge } from 'tailwind-merge'

        export function cn(...inputs: ClassValue[]) {
          return twMerge(clsx(inputs))
        }
      `)
    : dedent(`
        import { clsx } from 'clsx'
        import { twMerge } from 'tailwind-merge'

        export function cn(...inputs) {
          return twMerge(clsx(inputs))
        }
      `)
}

export function buttonFile(ts: boolean, layout: Layout): string {
  const signature = ts
    ? `}: React.ComponentProps<'button'> &\n  VariantProps<typeof buttonVariants> & {\n    asChild?: boolean\n  }) {`
    : `}) {`
  return lines(
    ts ? `import * as React from 'react'` : false,
    `import { Slot } from '@radix-ui/react-slot'`,
    ts ? `import { cva, type VariantProps } from 'class-variance-authority'` : `import { cva } from 'class-variance-authority'`,
    '',
    `import { cn } from '${alias(layout.lib)}/utils'`,
    '',
    dedent(`
      const buttonVariants = cva(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        {
          variants: {
            variant: {
              default: 'bg-primary text-primary-foreground hover:bg-primary/90',
              destructive:
                'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40',
              outline:
                'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50',
              secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
              ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
              link: 'text-primary underline-offset-4 hover:underline',
            },
            size: {
              default: 'h-9 px-4 py-2 has-[>svg]:px-3',
              sm: 'h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5',
              lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
              icon: 'size-9',
            },
          },
          defaultVariants: {
            variant: 'default',
            size: 'default',
          },
        },
      )

      function Button({
        className,
        variant,
        size,
        asChild = false,
        ...props
    `).trimEnd(),
    signature,
    dedent(`
        const Comp = asChild ? Slot : 'button'

        return (
          <Comp
            data-slot="button"
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
          />
        )
      }

      export { Button, buttonVariants }
    `),
  )
}

export function prettierrc(config: ProjectConfig, cssPath: string): string {
  return json({
    semi: false,
    singleQuote: true,
    printWidth: 100,
    ...(config.tailwind
      ? { plugins: ['prettier-plugin-tailwindcss'], tailwindStylesheet: `./${cssPath}` }
      : {}),
  })
}

export function vscodeExtensions(config: ProjectConfig): string {
  return json({
    recommendations: [
      ...(config.features.lint ? ['dbaeumer.vscode-eslint', 'esbenp.prettier-vscode'] : []),
      ...(config.tailwind ? ['bradlc.vscode-tailwindcss'] : []),
      ...(config.features.tests ? ['vitest.explorer'] : []),
    ],
  })
}

export function vscodeSettings(config: ProjectConfig): string {
  return json({
    ...(config.features.lint
      ? { 'editor.formatOnSave': true, 'editor.defaultFormatter': 'esbenp.prettier-vscode' }
      : {}),
    ...(config.tailwind ? { 'files.associations': { '*.css': 'tailwindcss' } } : {}),
    ...(config.language === 'ts' ? { 'typescript.tsdk': 'node_modules/typescript/lib' } : {}),
  })
}

export function readme(config: ProjectConfig, stack: string[], scripts: Record<string, string>): string {
  const pm = config.packageManager
  const run = (s: string) => (pm === 'npm' ? `npm run ${s}` : `${pm} ${s}`)
  const describe: Record<string, string> = {
    dev: 'Servidor de desenvolvimento com recarga automática',
    build: 'Gera a versão de produção',
    preview: 'Serve localmente o build de produção',
    start: 'Inicia o servidor de produção (após o build)',
    lint: 'Procura erros e más práticas no código',
    format: 'Formata todo o código com Prettier',
    test: 'Roda os testes uma vez',
    'test:watch': 'Roda os testes em modo observação',
  }
  const rows = Object.keys(scripts)
    .map((s) => `| \`${run(s)}\` | ${describe[s] ?? ''} |`)
    .join('\n')
  return lines(
    `# ${config.name}`,
    '',
    'Projeto criado com **StackForge**.',
    '',
    '## Stack',
    '',
    ...stack.map((s) => `- ${s}`),
    '',
    '## Comandos',
    '',
    '| Comando | O que faz |',
    '| --- | --- |',
    rows,
    '',
  )
}
