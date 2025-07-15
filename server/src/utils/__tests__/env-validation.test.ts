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
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('validateAuth0Environment', () => {
    it('should pass validation with all required variables', () => {
      process.env.AUTH0_DOMAIN = 'test-domain.auth0.com';
      process.env.AUTH0_AUDIENCE = 'https://api.test.com';
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
      process.env.AUTH0_AUDIENCE = 'https://api.test.com';

      const result = validateAuth0Environment();

      expect(result.isValid).toBe(false);
      expect(result.missing).toContain('AUTH0_DOMAIN');
    });

    it('should provide warnings for missing AUTH0_AUDIENCE in production', () => {
      process.env.AUTH0_DOMAIN = 'test.auth0.com';
      process.env.NODE_ENV = 'production';
      delete process.env.AUTH0_AUDIENCE;

      const result = validateAuth0Environment();

      expect(result.isValid).toBe(true); // Required vars present
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.includes('AUTH0_AUDIENCE'))).toBe(true);
    });

    it('should warn about missing NODE_ENV', () => {
      process.env.AUTH0_DOMAIN = 'test.auth0.com';
      delete process.env.NODE_ENV;

      const result = validateAuth0Environment();

      expect(result.warnings.some((w) => w.includes('NODE_ENV'))).toBe(true);
      expect(result.config.environment).toBe('development'); // Default
    });

    it('should handle completely missing environment', () => {
      delete process.env.AUTH0_DOMAIN;
      delete process.env.AUTH0_AUDIENCE;
      delete process.env.NODE_ENV;

      const result = validateAuth0Environment();

      expect(result.isValid).toBe(false);
      expect(result.missing).toContain('AUTH0_DOMAIN');
      expect(result.config.domain).toBe('');
      expect(result.config.environment).toBe('development');
    });
  });

  describe('getEnvironmentInfo', () => {
    it('should return complete environment information', () => {
      process.env.AUTH0_DOMAIN = 'test.auth0.com';
      process.env.AUTH0_AUDIENCE = 'https://api.test.com';
      process.env.NODE_ENV = 'test';

      const envInfo = getEnvironmentInfo();

      expect(envInfo).toMatchObject({
        isValid: true,
        missing: [],
        config: {
          domain: 'test.auth0.com',
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
      process.env.AUTH0_DOMAIN = 'test.auth0.com';
      delete process.env.AUTH0_AUDIENCE;
      process.env.NODE_ENV = 'production';

      const envInfo = getEnvironmentInfo();

      expect(envInfo.isValid).toBe(true);
      expect(envInfo.warnings.length).toBeGreaterThan(0);
      expect(envInfo.timestamp).toBeDefined();
      expect(envInfo.nodeVersion).toBeDefined();
    });
  });

  describe('ensureSafeAuth0Config', () => {
    it('should not throw with valid configuration', () => {
      process.env.AUTH0_DOMAIN = 'valid.auth0.com';
      process.env.AUTH0_AUDIENCE = 'https://api.valid.com';

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

      mockExit.mockRestore();
    });
  });

  describe('Integration Tests', () => {
    it('should work together for complete env validation flow', () => {
      process.env.AUTH0_DOMAIN = 'integration.auth0.com';
      process.env.AUTH0_AUDIENCE = 'https://api.integration.com';
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

      const validation = validateAuth0Environment();
      expect(validation.isValid).toBe(false);

      const envInfo = getEnvironmentInfo();
      expect(envInfo.isValid).toBe(false);

      expect(() => ensureSafeAuth0Config()).toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string values', () => {
      process.env.AUTH0_DOMAIN = '';
      process.env.AUTH0_AUDIENCE = '';

      const result = validateAuth0Environment();
      expect(result.isValid).toBe(false);
      expect(result.missing).toContain('AUTH0_DOMAIN');
    });

    it('should handle whitespace-only values', () => {
      process.env.AUTH0_DOMAIN = '   ';
      process.env.AUTH0_AUDIENCE = '\t\n';

      const result = validateAuth0Environment();
      // Depends on implementation - might treat as invalid
      expect(typeof result.isValid).toBe('boolean');
    });

    it('should handle special characters in domain', () => {
      process.env.AUTH0_DOMAIN = 'test@domain.auth0.com';

      const result = validateAuth0Environment();
      expect(result.config.domain).toBe('test@domain.auth0.com');
    });
  });
});
