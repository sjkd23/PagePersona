import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.js', 'tests/**/*.test.ts', 'tests/**/*.test.js'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'lcov'],
      // More lenient coverage thresholds for CI
      thresholds: {
        lines: 30,
        functions: 30,
        branches: 30,
        statements: 30,
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
        // Config modules - environment setup
        'src/config/database.ts',
        'src/config/web-scraper-config.ts',
        // Type definitions
        'src/types/**/*.ts',
      ],
      // Include specific patterns for comprehensive coverage
      include: ['src/**/*.ts', 'src/**/*.js'],
    },
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
});
