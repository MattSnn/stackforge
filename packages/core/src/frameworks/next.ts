import type { Builder } from '../builder'
import { dedent, json, lines } from '../templates/common'
import { homeComponent } from '../templates/react'

export function nextApp(b: Builder) {
  const { config, layout, ts } = b
  const x = b.jsx
  const f = config.features

  b.dep('next', 'react', 'react-dom')
  if (ts) b.devDep('typescript', '@types/react', '@types/react-dom', '@types/node')
  if (config.tailwind) b.devDep('tailwindcss', '@tailwindcss/postcss')

  b.script('dev', 'next dev')
  b.script('build', 'next build')
  b.script('start', 'next start')

  b.add(
    `next.config.${ts ? 'ts' : 'mjs'}`,
    ts
      ? dedent(`
          import type { NextConfig } from 'next'

          const nextConfig: NextConfig = {}

          export default nextConfig
        `)
      : dedent(`
          /** @type {import('next').NextConfig} */
          const nextConfig = {}

          export default nextConfig
        `),
  )

  const paths = { '@/*': ['./src/*'] }
  if (ts) {
    b.add(
      'tsconfig.json',
      json({
        compilerOptions: {
          target: 'ES2017',
          lib: ['dom', 'dom.iterable', 'esnext'],
          allowJs: true,
          skipLibCheck: true,
          strict: true,
          noEmit: true,
          esModuleInterop: true,
          module: 'esnext',
          moduleResolution: 'bundler',
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: 'react-jsx',
          incremental: true,
          plugins: [{ name: 'next' }],
          paths,
        },
        include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts', '.next/dev/types/**/*.ts', '**/*.mts'],
        exclude: ['node_modules'],
      }),
    )
  } else {
    b.add('jsconfig.json', json({ compilerOptions: { paths } }))
  }

  if (config.tailwind) {
    b.add(
      'postcss.config.mjs',
      dedent(`
        const config = {
          plugins: {
            '@tailwindcss/postcss': {},
          },
        }

        export default config
      `),
    )
  }

  b.add('src/app/globals.css', b.css())

  const needsProviders = f.query
  if (needsProviders) {
    b.add(
      `src/app/providers.${x}`,
      lines(
        `'use client'`,
        '',
        `import { QueryClient, QueryClientProvider } from '@tanstack/react-query'`,
        ts ? `import { useState, type ReactNode } from 'react'` : `import { useState } from 'react'`,
        '',
        `export function Providers({ children }${ts ? ': { children: ReactNode }' : ''}) {`,
        '  const [queryClient] = useState(() => new QueryClient())',
        '  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>',
        '}',
        '',
      ),
    )
  }

  b.add(
    `src/app/layout.${x}`,
    lines(
      ts && `import type { Metadata } from 'next'`,
      ts && `import type { ReactNode } from 'react'`,
      '',
      needsProviders && `import { Providers } from './providers'`,
      `import './globals.css'`,
      '',
      `export const metadata${ts ? ': Metadata' : ''} = {`,
      `  title: '${config.name}',`,
      `  description: 'Criado com StackForge',`,
      '}',
      '',
      ts
        ? 'export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {'
        : 'export default function RootLayout({ children }) {',
      '  return (',
      '    <html lang="pt-BR">',
      needsProviders
        ? '      <body>\n        <Providers>{children}</Providers>\n      </body>'
        : '      <body>{children}</body>',
      '    </html>',
      '  )',
      '}',
      '',
    ).replace(/^\n/, ''),
  )

  b.add(
    `src/app/page.${x}`,
    homeComponent(config, layout, { name: 'Home', editPath: `src/app/page.${x}`, exportDefault: true }),
  )

  if (f.lint) {
    b.devDep('eslint', 'eslint-config-next')
    b.script('lint', 'eslint')
    b.add(
      'eslint.config.mjs',
      lines(
        `import { defineConfig, globalIgnores } from 'eslint/config'`,
        `import nextVitals from 'eslint-config-next/core-web-vitals'`,
        ts && `import nextTs from 'eslint-config-next/typescript'`,
        '',
        'export default defineConfig([',
        '  ...nextVitals,',
        ts && '  ...nextTs,',
        `  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),`,
        '])',
        '',
      ),
    )
  }
}
