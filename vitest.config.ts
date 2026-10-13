import react from '@vitejs/plugin-react'
import { configDefaults, defineConfig } from 'vitest/config'

const domTests = ['**/*.dom.{test,spec}.{ts,tsx,js,jsx}']

export default defineConfig({
  test: {
    projects: [
      {
        resolve: { tsconfigPaths: true },
        test: {
          name: 'node',
          environment: 'node',
          include: configDefaults.include,
          exclude: [...configDefaults.exclude, ...domTests],
        },
      },
      {
        plugins: [react()],
        resolve: { tsconfigPaths: true },
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: domTests,
          exclude: configDefaults.exclude,
          setupFiles: ['./src/test/setup.dom.ts'],
        },
      },
    ],
  },
})
