import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createRateLimiter } from '../rateLimiter';
import { logger } from '../../utils/logger';

// Mock dependencies
vi.mock('express-rate-limit', () => ({
  default: vi.fn((options) => {
    // Return a mock function that represents the middleware
    const middleware = vi.fn();
    // Store options on the middleware for testing
    Object.assign(middleware, options);
    return middleware;
  }),
}));

vi.mock('rate-limit-redis', () => ({
  default: vi.fn().mockImplementation((options) => ({
    ...options,
    _mockRedisStore: true,
  })),
}));

// Mock redis module
const mockCreateClient = vi.fn().mockImplementation(() => ({
  sendCommand: vi.fn(),
}));

vi.mock('redis', () => ({
  createClient: mockCreateClient,
}));

// Mock env-validation with a writable parsedEnv
let mockParsedEnv: { REDIS_URL?: string } = {
  REDIS_URL: 'redis://localhost:6379',
};

vi.mock('../../utils/env-validation', () => ({
  get parsedEnv() {
    return mockParsedEnv;
  },
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('Rate Limiter Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mockParsedEnv to default state
    mockParsedEnv = {
      REDIS_URL: 'redis://localhost:6379',
    };
    // Reset the Redis client mock
    mockCreateClient.mockImplementation(() => ({
      sendCommand: vi.fn(),
    }));
  });

  describe('createRateLimiter', () => {
    it('should create rate limiter with Redis store when REDIS_URL is available', () => {
      const options = {
        windowMs: 15 * 60 * 1000,
        max: 100,
      };

      const rateLimiter = createRateLimiter(options);

      expect(rateLimiter).toBeDefined();
      expect(logger.info).toHaveBeenCalledWith('Using Redis store for rate limiting');
    });

    it('should create rate limiter with memory store when REDIS_URL is not available', () => {
      // Mock parsedEnv to not have REDIS_URL
      mockParsedEnv.REDIS_URL = undefined;

      const options = {
        windowMs: 15 * 60 * 1000,
        max: 100,
      };

      const rateLimiter = createRateLimiter(options);

      expect(rateLimiter).toBeDefined();
      expect(logger.warn).toHaveBeenCalledWith(
        'REDIS_URL not configured, using memory store for rate limiting',
      );
    });

    it('should use provided windowMs and max values', () => {
      const options = {
        windowMs: 30 * 60 * 1000,
        max: 50,
      };

      const rateLimiter = createRateLimiter(options);

      expect((rateLimiter as any).windowMs).toBe(30 * 60 * 1000);
      expect((rateLimiter as any).max).toBe(50);
    });

    it('should set correct configuration properties', () => {
      const options = {
        windowMs: 15 * 60 * 1000,
        max: 100,
      };

      const rateLimiter = createRateLimiter(options);

      expect((rateLimiter as any).standardHeaders).toBe(true);
      expect((rateLimiter as any).legacyHeaders).toBe(false);
      expect((rateLimiter as any).message).toEqual({
        error: 'Too many requests, please try again later.',
      });
    });

    it('should fallback to memory store on Redis error', () => {
      // Mock createClient to throw an error
      mockCreateClient.mockImplementation(() => {
        throw new Error('Redis connection failed');
      });

      const options = {
        windowMs: 15 * 60 * 1000,
        max: 100,
      };

      const rateLimiter = createRateLimiter(options);

      expect(rateLimiter).toBeDefined();
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to initialize Redis store for rate limiting, falling back to memory store:',
        expect.any(Error),
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero max requests', () => {
      mockParsedEnv.REDIS_URL = undefined;

      const options = {
        windowMs: 15 * 60 * 1000,
        max: 0,
      };

      const rateLimiter = createRateLimiter(options);

      expect((rateLimiter as any).max).toBe(0);
    });

    it('should handle short window durations', () => {
      mockParsedEnv.REDIS_URL = undefined;

      const options = {
        windowMs: 1000, // 1 second
        max: 10,
      };

      const rateLimiter = createRateLimiter(options);

      expect((rateLimiter as any).windowMs).toBe(1000);
    });

    it('should handle long window durations', () => {
      mockParsedEnv.REDIS_URL = undefined;

      const options = {
        windowMs: 24 * 60 * 60 * 1000, // 24 hours
        max: 1000,
      };

      const rateLimiter = createRateLimiter(options);

      expect((rateLimiter as any).windowMs).toBe(24 * 60 * 60 * 1000);
    });

    it('should handle function creation consistently', () => {
      mockParsedEnv.REDIS_URL = undefined;

      const options = {
        windowMs: 15 * 60 * 1000,
        max: 100,
      };

      const rateLimiter1 = createRateLimiter(options);
      const rateLimiter2 = createRateLimiter(options);

      expect(typeof rateLimiter1).toBe('function');
      expect(typeof rateLimiter2).toBe('function');
      expect(rateLimiter1).not.toBe(rateLimiter2); // Different instances
    });
  });
});
