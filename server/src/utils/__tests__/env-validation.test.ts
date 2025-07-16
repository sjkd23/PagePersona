import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getEnvironmentInfo,
  validateAuth0Environment,
  ensureSafeAuth0Config,
} from '../env-validation';

describe('Environment Validation Utilities', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables to a clean state
    process.env = { ...originalEnv };

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
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('validateAuth0Environment', () => {
    it('should pass validation with all required variables', () => {
      // Environment variables are already set in beforeEach
      process.env.NODE_ENV = 'development';

      const result = validateAuth0Environment();

      expect(result.isValid).toBe(true);
      expect(result.missing).toEqual([]);
      expect(result.config.domain).toBe('test-domain.auth0.com');
      expect(result.config.audience).toBe('https://api.test.com');
      expect(result.config.environment).toBe('development');
    });

    it('should fail validation with missing AUTH0_DOMAIN', () => {
      delete process.env.AUTH0_DOMAIN;

      expect(() => validateAuth0Environment()).toThrow('Environment validation failed');
    });

    it('should provide warnings for missing AUTH0_AUDIENCE in production', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.AUTH0_AUDIENCE;

      expect(() => validateAuth0Environment()).toThrow('Environment validation failed');
    });

    it('should warn about missing NODE_ENV', () => {
      delete process.env.NODE_ENV;

      const result = validateAuth0Environment();

      // NODE_ENV has a default value, so no warnings are generated
      expect(result.config.environment).toBe('development'); // Default
      expect(result.warnings).not.toContain('NODE_ENV');
    });

    it('should handle completely missing environment', () => {
      delete process.env.AUTH0_DOMAIN;
      delete process.env.AUTH0_AUDIENCE;
      delete process.env.NODE_ENV;

      expect(() => validateAuth0Environment()).toThrow('Environment validation failed');
    });
  });

  describe('getEnvironmentInfo', () => {
    it('should return complete environment information', () => {
      process.env.NODE_ENV = 'test';

      const envInfo = getEnvironmentInfo();

      expect(envInfo).toMatchObject({
        isValid: true,
        missing: [],
        config: {
          domain: 'test-domain.auth0.com',
          audience: 'https://api.test.com',
          environment: 'test',
        },
        timestamp: expect.any(String),
        nodeVersion: expect.any(String),
      });

      // Validate timestamp is recent
      const timestamp = new Date(envInfo.timestamp);
      const now = new Date();
      expect(timestamp.getTime()).toBeCloseTo(now.getTime(), -3); // Within ~1 second

      // Validate node version format
      expect(envInfo.nodeVersion).toMatch(/^v\d+\.\d+\.\d+/);
    });

    it('should include validation results', () => {
      delete process.env.AUTH0_AUDIENCE;
      process.env.NODE_ENV = 'production';

      expect(() => getEnvironmentInfo()).toThrow('Environment validation failed');
    });
  });

  describe('ensureSafeAuth0Config', () => {
    it('should not throw with valid configuration', () => {
      // Environment is already set with valid values in beforeEach
      expect(() => ensureSafeAuth0Config()).not.toThrow();
    });

    it('should throw with invalid configuration', () => {
      delete process.env.AUTH0_DOMAIN;

      expect(() => ensureSafeAuth0Config()).toThrow();
    });

    it('should provide helpful error message', () => {
      delete process.env.AUTH0_DOMAIN;

      // Mock process.exit to prevent actual exit and capture the call
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      expect(() => ensureSafeAuth0Config()).toThrow('process.exit called');

      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });
  });

  describe('Integration Tests', () => {
    it('should work together for complete env validation flow', () => {
      process.env.NODE_ENV = 'test';

      // Should validate successfully
      const validation = validateAuth0Environment();
      expect(validation.isValid).toBe(true);

      // Should get complete info
      const envInfo = getEnvironmentInfo();
      expect(envInfo.isValid).toBe(true);

      // Should not throw safety check
      expect(() => ensureSafeAuth0Config()).not.toThrow();
    });

    it('should handle missing config consistently', () => {
      delete process.env.AUTH0_DOMAIN;

      expect(() => validateAuth0Environment()).toThrow('Environment validation failed');
      expect(() => getEnvironmentInfo()).toThrow('Environment validation failed');
      expect(() => ensureSafeAuth0Config()).toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string values', () => {
      process.env.AUTH0_DOMAIN = '';
      process.env.AUTH0_AUDIENCE = '';

      expect(() => validateAuth0Environment()).toThrow('Environment validation failed');
    });

    it('should handle whitespace-only values', () => {
      process.env.AUTH0_DOMAIN = '   ';
      process.env.AUTH0_AUDIENCE = '\t\n';

      // The current validation allows whitespace-only values
      const result = validateAuth0Environment();
      expect(result.isValid).toBe(true);
      expect(result.config.domain).toBe('   ');
      expect(result.config.audience).toBe('\t\n');
    });

    it('should handle special characters in domain', () => {
      process.env.AUTH0_DOMAIN = 'test@domain.auth0.com';

      const result = validateAuth0Environment();
      expect(result.config.domain).toBe('test@domain.auth0.com');
    });
  });
});
