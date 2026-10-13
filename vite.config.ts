import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'

const PORT = 3000
const PREVIEW_PORT = 4000

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    nitro({ rollupConfig: { external: [/^@sentry\//] } }),
    tailwindcss(),
    tanstackStart(),
    react(),
  ],
  server: {
    port: PORT,
  },
  preview: {
    port: PREVIEW_PORT,
  },
})

export default config
