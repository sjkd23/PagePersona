import globals from 'globals';
import tsParser from '@typescript-eslint/parser';

export default [
  // 1. Ignore compiled output
  { ignores: ['dist'] },

  // 2. Base config for all files
  {
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      // Basic ESLint rules
      'no-unused-vars': 'error',
      'no-undef': 'error',
      'no-console': 'warn',
    },
  },

  // 3. TypeScript-specific config
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: globals.node,
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      // Disable base rule as it can report incorrect errors
      'no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
    },
  },
];
