// Client test setup
import { beforeAll, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// Global test setup for client
beforeAll(() => {
  console.log('Setting up client tests...')
  // Set up global test environment
  
  // Suppress console.error for expected test errors to reduce noise
  const originalError = console.error
  console.error = (...args: unknown[]) => {
    // Suppress specific test error messages that are expected
    const message = args[0]
    if (typeof message === 'string') {
      if (message.includes('Error loading personas:') ||
          message.includes('API request failed:') ||
          message.includes('Failed to get Auth0 token:')) {
        return // Suppress expected test errors
      }
    }
    originalError(...args)
  }
})

// Clean up after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Mock window.matchMedia (commonly needed for React tests)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))
