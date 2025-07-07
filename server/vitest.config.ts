import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.js', 'tests/**/*.test.ts', 'tests/**/*.test.js'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: [
        'node_modules/',
        'dist/',
        'coverage/',
        'src/**/*.d.ts',
        'src/index.ts', // entry point
        '**/*.test.ts',
        '**/*.test.js',
        // Config files
        'vitest.config.ts',
        'tailwind.config.js',
        'eslint.config.js',
        'postcss.config.js',
        'tsconfig*.json',
        // Data and constants
        'src/data/personas.ts',
        // Config modules
        'src/config/database.ts',
        'src/config/rateLimitConfigs.ts'
      ]
    },
    setupFiles: ['./tests/setup.ts']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests')
    }
  }
})
