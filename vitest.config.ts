import react from '@vitejs/plugin-react'
import { configDefaults, defineConfig } from 'vitest/config'

const clientTests = ['**/*.client.{test,spec}.{ts,tsx,js,jsx}']
const serverTests = ['**/*.server.{test,spec}.{ts,tsx,js,jsx}']

export default defineConfig({
  test: {
    projects: [
      {
        resolve: { tsconfigPaths: true },
        test: {
          name: 'server',
          environment: 'node',
          include: serverTests,
          exclude: configDefaults.exclude,
        },
      },
      {
        plugins: [react()],
        resolve: { tsconfigPaths: true },
        test: {
          name: 'client',
          environment: 'jsdom',
          include: clientTests,
          exclude: configDefaults.exclude,
          setupFiles: ['./src/test/setup.client.ts'],
        },
      },
    ],
  },
})
