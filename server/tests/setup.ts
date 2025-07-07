// Server test setup
import { beforeAll, afterAll, afterEach, vi } from 'vitest'
import { logger } from '../src/utils/logger';

// Global test setup for server
beforeAll(async () => {
  logger.test.info('Setting up server tests...')
  // Initialize test database connection if needed
  // Set up test environment variables
  process.env.NODE_ENV = 'test'
})

afterAll(async () => {
  logger.test.info('Cleaning up after server tests...')
  // Close database connections
  // Clean up test resources
})

afterEach(() => {
  // Clean up after each test
  // Reset mocks
  vi.clearAllMocks()
})

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-api-key'
process.env.AUTH0_DOMAIN = 'test-domain'
process.env.AUTH0_CLIENT_ID = 'test-client-id'
process.env.AUTH0_CLIENT_SECRET = 'test-client-secret'
