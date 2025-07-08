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
      reporter: ['text', 'html', 'json', 'lcov'],
      // Coverage thresholds - fail build if below these percentages
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90
      },
      // Report on all files, not just tested ones
      all: true,
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
        // Data and constants - static data files
        'src/data/personas.ts',
        'src/data/basePrompt.ts',
        // Config modules - environment setup
        'src/config/database.ts',
        'src/config/rate-limit-configs.ts',
        'src/config/web-scraper-config.ts',
        // Type definitions
        'src/types/**/*.ts',
        // Generated or legacy files
        'src/middleware/auth0-middleware-simple.ts', // Legacy
        'src/utils/gpt/prompt-call-new.ts', // Newer version exists
        'src/services/cacheService.ts' // Duplicate of cache-service.ts
      ],
      // Include specific patterns for comprehensive coverage
      include: [
        'src/**/*.ts',
        'src/**/*.js'
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
