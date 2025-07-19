import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Environment Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules(); // Reset module cache to ensure fresh imports
    // Reset environment variables to a clean state
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('parsedEnv', () => {
    it('should parse valid environment variables', async () => {
      // Set required environment variables for tests
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      process.env.OPENAI_API_KEY = 'sk-test-key-1234567890abcdef';
      process.env.AUTH0_DOMAIN = 'test-domain.auth0.com';
      process.env.AUTH0_CLIENT_ID = 'test-client-id';
      process.env.AUTH0_CLIENT_SECRET = 'test-client-secret-1234567890abcdef';
      process.env.AUTH0_AUDIENCE = 'https://api.test.com';
      process.env.AUTH0_ISSUER = 'https://test-domain.auth0.com/';
      process.env.JWT_SECRET = 'test-jwt-secret-1234567890abcdef';
      process.env.NODE_ENV = 'test';

      const { parsedEnv } = await import('../env-validation');

      expect(parsedEnv.AUTH0_DOMAIN).toBe('test-domain.auth0.com');
      expect(parsedEnv.AUTH0_AUDIENCE).toBe('https://api.test.com');
      expect(parsedEnv.NODE_ENV).toBe('test');
      expect(parsedEnv.PORT).toBe(5000);
      expect(parsedEnv.MONGODB_URI).toBe('mongodb://localhost:27017/test');
    });

    it('should throw error for missing required variables in production', async () => {
      process.env.NODE_ENV = 'production';
      // Intentionally omit required variables

      await expect(async () => {
        await import('../env-validation');
      }).rejects.toThrow('Missing ENV vars');
    });

    it('should use defaults in development mode', async () => {
      process.env.NODE_ENV = 'development';
      // Only set some required variables, let others use defaults
      process.env.PORT = '3000';

      const { parsedEnv } = await import('../env-validation');

      expect(parsedEnv.NODE_ENV).toBe('development');
      expect(parsedEnv.PORT).toBe(3000);
    });
  });
});
