import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['server/src/**/*.test.ts', 'client/src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '**/*.d.ts'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html'],
      all: true,
      include: [
        'server/src/**/*.ts',
        'client/src/**/*.{ts,tsx}'
      ],
      exclude: [
        '**/*.d.ts',
        '**/__tests__/**',
        '**/node_modules/**',
        '**/dist/**',
        '**/coverage/**',
        'server/src/index.ts',
        'client/src/main.tsx',
        'client/src/vite-env.d.ts',
        'server/src/config/database.ts',
        'server/src/config/web-scraper-config.ts',
        'server/src/types/**/*.ts',
        'client/src/types/**/*.ts',
        'client/src/assets/**/*',
        '**/*.css'
      ],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90
      }
    }
  }
});
