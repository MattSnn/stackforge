/**
 * Versões curadas e testadas juntas (npm run e2e).
 * Não use "latest" cegamente: majors novos quebram peer-deps
 * (ex.: typescript-eslint exige TS < 6.1; plugins do eslint-config-next exigem ESLint 9).
 */
export const versions = {
  // base
  react: '^19.3.0',
  'react-dom': '^19.3.0',
  '@types/react': '^19.3.0',
  '@types/react-dom': '^19.3.0',
  '@types/node': '^24.19.0',
  typescript: '~6.0.3',

  // vite
  vite: '^8.3.1',
  '@vitejs/plugin-react': '^6.1.1',

  // next
  next: '^16.3.7',
  'eslint-config-next': '^16.3.7',

  // estilo
  tailwindcss: '^4.3.3',
  '@tailwindcss/vite': '^4.3.3',
  '@tailwindcss/postcss': '^4.3.3',
  clsx: '^2.1.1',
  'tailwind-merge': '^3.7.0',
  'class-variance-authority': '^0.7.1',
  'tw-animate-css': '^1.4.0',
  '@radix-ui/react-slot': '^1.3.3',

  // extras
  'react-router': '^8.4.0',
  zustand: '^5.0.15',
  '@tanstack/react-query': '^5.104.0',
  'react-hook-form': '^7.89.0',
  '@hookform/resolvers': '^5.9.1',
  zod: '^4.6.5',
  'lucide-react': '^1.49.0',

  // qualidade
  eslint: '^9.39.5',
  '@eslint/js': '^9.39.5',
  globals: '^17.12.0',
  'eslint-plugin-react-hooks': '^7.1.1',
  'eslint-plugin-react-refresh': '^0.5.7',
  'typescript-eslint': '^8.71.0',
  prettier: '^3.9.9',
  'prettier-plugin-tailwindcss': '^0.8.1',

  // testes
  vitest: '^5.0.3',
  jsdom: '^30.1.1',
  '@testing-library/react': '^16.3.3',
  '@testing-library/dom': '^10.4.2',
  '@testing-library/jest-dom': '^7.0.1',
  '@testing-library/user-event': '^14.6.7',
} as const

export type PackageName = keyof typeof versions
