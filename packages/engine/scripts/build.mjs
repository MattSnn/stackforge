import { build } from 'esbuild'
import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const out = resolve(here, '../dist/engine.mjs')

await build({
  entryPoints: [resolve(here, '../src/cli.ts')],
  outfile: out,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  minify: true,
  legalComments: 'none',
})

// O app Tauri empacota o engine como resource.
const resource = resolve(here, '../../../app/src-tauri/resources/engine.mjs')
mkdirSync(dirname(resource), { recursive: true })
copyFileSync(out, resource)
console.log('engine →', out)
