import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { envSchema } from '../env-validation';

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

  describe('envSchema', () => {
    it('should parse valid environment variables', () => {
      const validEnv = {
        NODE_ENV: 'development',
        PORT: '5000',
        MONGODB_URI: 'mongodb://localhost:27017/test',
        OPENAI_API_KEY: 'sk-test-key-1234567890abcdef',
        AUTH0_DOMAIN: 'test-domain.auth0.com',
        AUTH0_CLIENT_ID: 'test-client-id',
        AUTH0_CLIENT_SECRET: 'test-client-secret-1234567890abcdef',
        AUTH0_AUDIENCE: 'https://api.test.com',
        AUTH0_ISSUER: 'https://test-domain.auth0.com/',
        JWT_SECRET: 'test-jwt-secret-1234567890abcdef-minimum-32-chars',
        JWT_EXPIRES_IN: '7d',
        REDIS_URL: 'redis://localhost:6379',
      };

      const result = envSchema.safeParse(validEnv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.AUTH0_DOMAIN).toBe('test-domain.auth0.com');
        expect(result.data.AUTH0_AUDIENCE).toBe('https://api.test.com');
        expect(result.data.NODE_ENV).toBe('development');
        expect(result.data.PORT).toBe(5000); // Should be transformed to number
        expect(result.data.MONGODB_URI).toBe('mongodb://localhost:27017/test');
      }
    });

    it('should throw on missing required variables', () => {
      const incompleteEnv = {
        NODE_ENV: 'production',
        PORT: '5000',
        // Missing required variables like MONGODB_URI, OPENAI_API_KEY, etc.
      };

      const result = envSchema.safeParse(incompleteEnv);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
        // Check that it fails for missing MONGODB_URI
        const mongoIssue = result.error.issues.find((issue) => issue.path.includes('MONGODB_URI'));
        expect(mongoIssue).toBeDefined();
      }
    });

    it('should use defaults for optional fields', () => {
      const minimalEnv = {
        MONGODB_URI: 'mongodb://localhost:27017/test',
        OPENAI_API_KEY: 'sk-test-key-1234567890abcdef',
        AUTH0_DOMAIN: 'test-domain.auth0.com',
        AUTH0_CLIENT_ID: 'test-client-id',
        AUTH0_CLIENT_SECRET: 'test-client-secret-1234567890abcdef',
        AUTH0_AUDIENCE: 'https://api.test.com',
        AUTH0_ISSUER: 'https://test-domain.auth0.com/',
        JWT_SECRET: 'test-jwt-secret-1234567890abcdef-minimum-32-chars',
        // Omit optional fields like NODE_ENV, PORT, JWT_EXPIRES_IN
      };

      const result = envSchema.safeParse(minimalEnv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.NODE_ENV).toBe('development'); // Default
        expect(result.data.PORT).toBe(5000); // Default from string '5000'
        expect(result.data.JWT_EXPIRES_IN).toBe('7d'); // Default
      }
    });

    it('should validate Auth0 issuer URL format', () => {
      const envWithInvalidIssuer = {
        MONGODB_URI: 'mongodb://localhost:27017/test',
        OPENAI_API_KEY: 'sk-test-key-1234567890abcdef',
        AUTH0_DOMAIN: 'test-domain.auth0.com',
        AUTH0_CLIENT_ID: 'test-client-id',
        AUTH0_CLIENT_SECRET: 'test-client-secret-1234567890abcdef',
        AUTH0_AUDIENCE: 'https://api.test.com',
        AUTH0_ISSUER: 'invalid-url', // Invalid URL
        JWT_SECRET: 'test-jwt-secret-1234567890abcdef-minimum-32-chars',
      };

      const result = envSchema.safeParse(envWithInvalidIssuer);

      expect(result.success).toBe(false);
      if (!result.success) {
        const issuerIssue = result.error.issues.find((issue) =>
          issue.path.includes('AUTH0_ISSUER'),
        );
        expect(issuerIssue).toBeDefined();
        expect(issuerIssue?.message).toContain('URL');
      }
    });

    it('should validate JWT secret minimum length', () => {
      const envWithShortSecret = {
        MONGODB_URI: 'mongodb://localhost:27017/test',
        OPENAI_API_KEY: 'sk-test-key-1234567890abcdef',
        AUTH0_DOMAIN: 'test-domain.auth0.com',
        AUTH0_CLIENT_ID: 'test-client-id',
        AUTH0_CLIENT_SECRET: 'test-client-secret-1234567890abcdef',
        AUTH0_AUDIENCE: 'https://api.test.com',
        AUTH0_ISSUER: 'https://test-domain.auth0.com/',
        JWT_SECRET: 'short', // Too short
      };

      const result = envSchema.safeParse(envWithShortSecret);

      expect(result.success).toBe(false);
      if (!result.success) {
        const secretIssue = result.error.issues.find((issue) => issue.path.includes('JWT_SECRET'));
        expect(secretIssue).toBeDefined();
        expect(secretIssue?.message).toContain('32 characters');
      }
    });
  });

  describe('parsedEnv integration', () => {
    it('should contain all required keys when environment is valid', async () => {
      // Set up a valid environment
      process.env.NODE_ENV = 'test';
      process.env.PORT = '3000';
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      process.env.OPENAI_API_KEY = 'sk-test-key-1234567890abcdef';
      process.env.AUTH0_DOMAIN = 'test-domain.auth0.com';
      process.env.AUTH0_CLIENT_ID = 'test-client-id';
      process.env.AUTH0_CLIENT_SECRET = 'test-client-secret-1234567890abcdef';
      process.env.AUTH0_AUDIENCE = 'https://api.test.com';
      process.env.AUTH0_ISSUER = 'https://test-domain.auth0.com/';
      process.env.JWT_SECRET = 'test-jwt-secret-1234567890abcdef-minimum-32-chars';

      // Re-import to get the fresh parsedEnv
      const { parsedEnv } = await import('../env-validation');

      expect(parsedEnv).toMatchObject({
        NODE_ENV: 'test',
        PORT: 3000,
        MONGODB_URI: 'mongodb://localhost:27017/test',
        OPENAI_API_KEY: 'sk-test-key-1234567890abcdef',
        AUTH0_DOMAIN: 'test-domain.auth0.com',
        AUTH0_AUDIENCE: 'https://api.test.com',
      });
    });
  });
});
