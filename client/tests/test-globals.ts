// Global test utilities and types
import type { vi } from 'vitest'

declare global {
  const vi: typeof import('vitest').vi
}

// Extended matchers for testing-library
import '@testing-library/jest-dom'
