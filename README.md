# StackForge

App desktop para Windows que cria projetos React já configurados: escolha **Vite ou Next.js**, Tailwind, shadcn/ui, extras e estrutura de pastas, veja a prévia dos arquivos e crie em um clique — sem boilerplate.

## Como funciona

```
packages/core     TS puro: plan(config) → arquivos + dependências (usado pela UI na prévia e pelo engine)
packages/engine   CLI Node que executa o plano: escreve arquivos, instala, git, abre VS Code
app/              App Tauri 2 (React + Tailwind). O Rust só inicia o engine e repassa eventos
```

- Os arquivos são **gerados pelo próprio StackForge** (não usa `npm create vite`), então não há boilerplate para apagar.
- As versões dos pacotes ficam em [`packages/core/src/versions.ts`](packages/core/src/versions.ts), testadas juntas (`npm run e2e`).
  Ao atualizar uma versão, rode o e2e: ele gera projetos reais e roda `build`, `lint` e `test` em cada um.

## Desenvolvimento

Requisitos: Node 22+, Rust (rustup) e Visual Studio Build Tools com C++.

```bash
npm install
npm run build:engine   # gera o engine e copia para app/src-tauri/resources
npm run dev            # abre o app em modo desenvolvimento
npm test               # testes unitários do core
npm run e2e            # gera projetos reais e valida build/lint/test (lento)
npm run build          # instalador em app/src-tauri/target/release/bundle/nsis
```

A UI também roda no navegador (`npm run dev -w app`) com a criação simulada, útil para ajustar o visual.

### CLI

O engine funciona sozinho:

```bash
node packages/engine/dist/engine.mjs create --config minha-config.json
node packages/engine/dist/engine.mjs plan --config minha-config.json
node packages/engine/dist/engine.mjs detect
```
