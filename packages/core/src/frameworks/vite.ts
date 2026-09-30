import type { Builder } from '../builder'
import { alias } from '../layout'
import { dedent, json, lines } from '../templates/common'
import { homeComponent } from '../templates/react'

export function viteReact(b: Builder) {
  const { config, layout, ts } = b
  const x = b.jsx
  const f = config.features
  const appDir = layout.app
  const rel = appDir === 'src' ? '.' : `./${appDir.slice(4)}`

  b.dep('react', 'react-dom')
  b.devDep('vite', '@vitejs/plugin-react')
  if (ts) b.devDep('typescript', '@types/react', '@types/react-dom', '@types/node')
  if (config.tailwind) b.devDep('tailwindcss', '@tailwindcss/vite')

  b.script('dev', 'vite')
  b.script('build', ts ? 'tsc -b && vite build' : 'vite build')
  b.script('preview', 'vite preview')

  // index.html
  b.add(
    'index.html',
    dedent(`
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />
          <link rel="icon" href="data:," />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${config.name}</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" src="/src/main.${x}"></script>
        </body>
      </html>
    `),
  )

  // vite.config
  b.add(
    `vite.config.${b.js}`,
    lines(
      f.tests && ts && '/// <reference types="vitest/config" />',
      `import { fileURLToPath, URL } from 'node:url'`,
      `import react from '@vitejs/plugin-react'`,
      config.tailwind && `import tailwindcss from '@tailwindcss/vite'`,
      `import { defineConfig } from 'vite'`,
      '',
      '// https://vite.dev/config/',
      'export default defineConfig({',
      `  plugins: [react()${config.tailwind ? ', tailwindcss()' : ''}],`,
      '  resolve: {',
      `    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },`,
      '  },',
      f.tests && `  test: {\n    environment: 'jsdom',\n    setupFiles: ['./src/test/setup.${b.js}'],\n  },`,
      '})',
      '',
    ),
  )

  // tsconfig / jsconfig
  const paths = { '@/*': ['./src/*'] }
  if (ts) {
    const strictish = {
      skipLibCheck: true,
      moduleResolution: 'bundler',
      allowImportingTsExtensions: true,
      verbatimModuleSyntax: true,
      moduleDetection: 'force',
      noEmit: true,
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      erasableSyntaxOnly: true,
      noFallthroughCasesInSwitch: true,
      noUncheckedSideEffectImports: true,
    }
    b.add(
      'tsconfig.json',
      json({
        files: [],
        references: [{ path: './tsconfig.app.json' }, { path: './tsconfig.node.json' }],
        // O shadcn e o VS Code leem os aliases daqui.
        compilerOptions: { paths },
      }),
    )
    b.add(
      'tsconfig.app.json',
      json({
        compilerOptions: {
          tsBuildInfoFile: './node_modules/.tmp/tsconfig.app.tsbuildinfo',
          target: 'ES2022',
          useDefineForClassFields: true,
          lib: ['ES2022', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          types: ['vite/client'],
          jsx: 'react-jsx',
          ...strictish,
          paths,
        },
        include: ['src'],
      }),
    )
    b.add(
      'tsconfig.node.json',
      json({
        compilerOptions: {
          tsBuildInfoFile: './node_modules/.tmp/tsconfig.node.tsbuildinfo',
          target: 'ES2023',
          lib: ['ES2023'],
          module: 'ESNext',
          types: ['node'],
          ...strictish,
        },
        include: ['vite.config.ts'],
      }),
    )
  } else {
    b.add('jsconfig.json', json({ compilerOptions: { paths } }))
  }

  // css
  b.add('src/index.css', b.css())

  // main
  const needsProviders = f.query
  b.add(
    `src/main.${x}`,
    lines(
      `import { StrictMode } from 'react'`,
      `import { createRoot } from 'react-dom/client'`,
      '',
      `import App from '${rel}/App'`,
      needsProviders && `import { Providers } from '${rel}/providers'`,
      `import './index.css'`,
      '',
      `createRoot(document.getElementById('root')${ts ? '!' : ''}).render(`,
      '  <StrictMode>',
      needsProviders ? '    <Providers>\n      <App />\n    </Providers>' : '    <App />',
      '  </StrictMode>,',
      ')',
      '',
    ),
  )

  if (needsProviders) {
    b.add(
      `${appDir}/providers.${x}`,
      lines(
        `import { QueryClient, QueryClientProvider } from '@tanstack/react-query'`,
        ts && `import type { ReactNode } from 'react'`,
        '',
        'const queryClient = new QueryClient()',
        '',
        `export function Providers({ children }${ts ? ': { children: ReactNode }' : ''}) {`,
        '  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>',
        '}',
        '',
      ),
    )
  }

  // App + páginas
  if (f.router) {
    const pages = alias(layout.pages)
    b.add(
      `${layout.pages}/HomePage.${x}`,
      homeComponent(config, layout, {
        name: 'HomePage',
        editPath: `${layout.pages}/HomePage.${x}`,
        exportDefault: true,
      }),
    )
    b.add(`${layout.pages}/NotFoundPage.${x}`, b.notFound())
    b.add(
      `${appDir}/App.${x}`,
      dedent(`
        import { createBrowserRouter, RouterProvider } from 'react-router'

        import HomePage from '${pages}/HomePage'
        import NotFoundPage from '${pages}/NotFoundPage'

        const router = createBrowserRouter([
          { path: '/', element: <HomePage /> },
          { path: '*', element: <NotFoundPage /> },
        ])

        export default function App() {
          return <RouterProvider router={router} />
        }
      `),
    )
  } else {
    b.add(
      `${appDir}/App.${x}`,
      homeComponent(config, layout, { name: 'App', editPath: `${appDir}/App.${x}`, exportDefault: true }),
    )
  }

  // lint
  if (f.lint) {
    b.devDep('eslint', '@eslint/js', 'globals', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh')
    if (ts) b.devDep('typescript-eslint')
    b.script('lint', 'eslint .')
    b.add(
      'eslint.config.js',
      lines(
        `import js from '@eslint/js'`,
        `import { defineConfig, globalIgnores } from 'eslint/config'`,
        `import reactHooks from 'eslint-plugin-react-hooks'`,
        `import reactRefresh from 'eslint-plugin-react-refresh'`,
        `import globals from 'globals'`,
        ts && `import tseslint from 'typescript-eslint'`,
        '',
        'export default defineConfig([',
        `  globalIgnores(['dist']),`,
        '  {',
        `    files: ['**/*.{${ts ? 'ts,tsx' : 'js,jsx'}}'],`,
        '    extends: [',
        '      js.configs.recommended,',
        ts && '      tseslint.configs.recommended,',
        '      reactHooks.configs.flat.recommended,',
        '      reactRefresh.configs.vite,',
        '    ],',
        '    languageOptions: {',
        '      ecmaVersion: 2022,',
        '      globals: globals.browser,',
        !ts && `      parserOptions: { ecmaFeatures: { jsx: true } },`,
        '    },',
        // Sem TS, o ESLint não vê o uso de componentes em JSX (<App />); ignora nomes em PascalCase.
        !ts && `    rules: {\n      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],\n    },`,
        '  },',
        config.shadcn &&
          `  {\n    // componentes do shadcn exportam variantes junto com o componente\n    files: ['${layout.ui}/**'],\n    rules: { 'react-refresh/only-export-components': 'off' },\n  },`,
        '])',
        '',
      ),
    )
  }

  // testes
  if (f.tests) {
    b.devDep(
      'vitest',
      'jsdom',
      '@testing-library/react',
      '@testing-library/dom',
      '@testing-library/jest-dom',
      '@testing-library/user-event',
    )
    b.script('test', 'vitest run')
    b.script('test:watch', 'vitest')
    b.add(
      `src/test/setup.${b.js}`,
      dedent(`
        import '@testing-library/jest-dom/vitest'
        import { cleanup } from '@testing-library/react'
        import { afterEach } from 'vitest'

        afterEach(() => {
          cleanup()
        })
      `),
    )
    b.add(
      `${appDir}/App.test.${x}`,
      lines(
        `import { render, screen } from '@testing-library/react'`,
        `import { describe, expect, it } from 'vitest'`,
        '',
        `import App from './App'`,
        needsProviders && `import { Providers } from './providers'`,
        '',
        `describe('App', () => {`,
        `  it('renderiza o título', () => {`,
        needsProviders
          ? '    render(\n      <Providers>\n        <App />\n      </Providers>,\n    )'
          : '    render(<App />)',
        `    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()`,
        '  })',
        '})',
        '',
      ),
    )
  }
}
