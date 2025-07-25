/// &lt;reference types="vitest" /&gt;
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.tsx', 'src/**/*.test.ts', 'tests/**/*.test.tsx', 'tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'lcov'],
      // Coverage thresholds for client-side code
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
      all: true,
      exclude: [
        'node_modules/',
        'dist/',
        'coverage/',
        'src/**/*.d.ts',
        'src/main.tsx', // entry point
        '**/*.test.tsx',
        '**/*.test.ts',
        // Static data and configuration
        'src/config/auth.ts',
        // Type definitions
        'src/types/**/*.ts',
        // Style files
        '**/*.css',
        // Assets
        'src/assets/**/*',
        // Generated files
        'src/vite-env.d.ts',
      ],
      include: ['src/**/*.tsx', 'src/**/*.ts'],
    },
    setupFiles: ['./tests/setup.ts', './tests/test-globals.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests'),
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
});
