import { vi } from 'vitest';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
};

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.AUTH0_DOMAIN = 'test-domain.auth0.com';
process.env.AUTH0_CLIENT_ID = 'test-client-id';
process.env.AUTH0_CLIENT_SECRET = 'test-client-secret';
process.env.AUTH0_AUDIENCE = 'https://test.api';
process.env.AUTH0_ISSUER = 'https://test-domain.auth0.com/';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-minimum-32-chars';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.SERVER_PORT = '3001';

// Mock global fetch for API calls
global.fetch = vi.fn();

// Mock setTimeout and setInterval for consistent testing
vi.useFakeTimers();

// Setup global test timeout
vi.setConfig({ testTimeout: 10000 });

// Add helper for mocking modules
global.mockModule = (modulePath: string, mockImplementation: unknown) => {
  vi.doMock(modulePath, () => mockImplementation as Record<string, unknown>);
};
