import { defineConfig } from 'vitest/config'
import GithubActionsReporter from 'vitest-github-actions-reporter'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'c8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/**/*.test.ts'],
      reporter: ['clover', 'html-spa'],
    },
    reporters: process.env.GITHUB_ACTIONS ? new GithubActionsReporter() : 'default',
  },
})
