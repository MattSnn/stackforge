// Gera projetos reais com o engine e valida build/lint/test de cada um.
// Uso: npm run e2e [-- filtro]
import { execSync, spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(import.meta.url), '../../../..')
const out = join(root, '.e2e')
const engine = join(root, 'packages/engine/dist/engine.mjs')
const filter = process.argv[2]

const all = { router: true, zustand: true, query: true, forms: true, icons: true, lint: true, tests: true }
const none = { router: false, zustand: false, query: false, forms: false, icons: false, lint: false, tests: false }
const base = {
  parentDir: out,
  language: 'ts',
  packageManager: 'npm',
  tailwind: true,
  shadcn: false,
  structure: 'simple',
  examples: false,
  post: { install: true, git: false, vscode: false, explorer: false, dev: false },
}
const cases = [
  { name: 'vite-ts-clean', framework: 'vite-react', features: { ...none, icons: true, lint: true } },
  { name: 'vite-ts-full', framework: 'vite-react', shadcn: true, structure: 'feature', examples: true, features: all },
  { name: 'vite-js-full', framework: 'vite-react', language: 'js', shadcn: true, examples: true, features: all },
  { name: 'vite-ts-plain', framework: 'vite-react', tailwind: false, structure: 'none', features: { ...none, router: true, tests: true } },
  { name: 'next-ts-shadcn', framework: 'next', shadcn: true, examples: true, features: all },
  { name: 'next-js-feature', framework: 'next', language: 'js', structure: 'feature', examples: true, features: { ...all, query: false } },
].filter((c) => !filter || c.name.includes(filter))

const results = []
for (const c of cases) {
  const config = { ...base, ...c }
  const dir = join(out, c.name)
  rmSync(dir, { recursive: true, force: true })
  const t0 = Date.now()
  const b64 = Buffer.from(JSON.stringify(config)).toString('base64')
  const create = spawnSync('node', [engine, 'create', '--config-b64', b64], { encoding: 'utf8' })
  const events = create.stdout.trim().split('\n').filter(Boolean).map((l) => JSON.parse(l))
  const failed = events.find((e) => e.type === 'error' || e.status === 'error')
  const row = { name: c.name, create: failed ? 'FAIL' : 'ok', secs: ((Date.now() - t0) / 1000).toFixed(1) }
  if (failed) {
    console.log(events.filter((e) => e.type === 'log').slice(-30).map((e) => e.text).join('\n'))
    row.error = failed.message
    results.push(row)
    continue
  }
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  for (const script of ['build', 'lint', 'test']) {
    if (!pkg.scripts[script]) continue
    try {
      execSync(`npm run ${script}`, { cwd: dir, stdio: 'pipe', encoding: 'utf8' })
      row[script] = 'ok'
    } catch (e) {
      row[script] = 'FAIL'
      console.log(`\n--- ${c.name}: npm run ${script} ---\n${e.stdout}\n${e.stderr}`)
    }
  }
  // Tailwind realmente gerou utilitários?
  if (config.tailwind && c.framework === 'vite-react' && existsSync(join(dir, 'dist/assets'))) {
    const css = readdirSync(join(dir, 'dist/assets')).filter((f) => f.endsWith('.css'))
    row.tailwind = css.some((f) => readFileSync(join(dir, 'dist/assets', f), 'utf8').includes('min-height:100svh')) ? 'ok' : 'FAIL'
  }
  results.push(row)
}
console.table(results)
if (results.some((r) => Object.values(r).includes('FAIL'))) process.exit(1)
