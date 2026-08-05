import { fileURLToPath, URL } from 'node:url'
import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackRouter } from '@tanstack/router-plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const monorepoRoot = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, monorepoRoot, '')

  return {
    envDir: monorepoRoot,
    resolve: { tsconfigPaths: true },
    server: {
      port: Number(env.WEB_PORT) || 5173,
    },
    plugins: [
      devtools(),
      tailwindcss(),
      tanstackRouter({ target: 'react', autoCodeSplitting: true }),
      viteReact(),
    ],
  }
})
