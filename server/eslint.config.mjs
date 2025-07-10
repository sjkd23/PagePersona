import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  // 1. Ignore compiled output and problematic files
  { ignores: ['dist', '**/*.test.ts', '**/__tests__/**', 'tests/**', 'vitest.config.ts'] },

  // 2. Base config for all files
  {
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        ...globals.node,
        NodeJS: 'readonly'
      },
    },
    rules: {
      // Basic ESLint rules
      'no-unused-vars': 'error',
      'no-undef': 'error',
      'no-console': 'warn',
    },
  },

  // 3. TypeScript-specific config for source files only
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        ...globals.node,
        NodeJS: 'readonly'
      },
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // Disable base rule as it can report incorrect errors
      'no-unused-vars': 'off',
      'no-undef': 'off', // TypeScript handles this
      '@typescript-eslint/no-explicit-any': 'warn', // Reduce to warning
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // Reduce to warning
      'no-console': 'warn',
    },
  },
];
