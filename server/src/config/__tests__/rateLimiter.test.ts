import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createRateLimiter } from '../rateLimiter';
import { getRedisClient, isRedisAvailable } from '../redis';
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

vi.mock('../redis', () => ({
  getRedisClient: vi.fn(),
  isRedisAvailable: vi.fn(),
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
  });

  describe('createRateLimiter', () => {
    it('should create rate limiter with Redis store when available', () => {
      const mockRedisClient = {
        get: vi.fn(),
        set: vi.fn(),
        incr: vi.fn(),
        expire: vi.fn(),
      };

      vi.mocked(getRedisClient).mockReturnValue(mockRedisClient as any);
      vi.mocked(isRedisAvailable).mockReturnValue(true);

      const options = {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100,
      };

      const rateLimiter = createRateLimiter(options);

      expect(rateLimiter).toBeDefined();
      expect(typeof rateLimiter).toBe('function');
    });

    it('should create rate limiter with memory store when Redis is not available', () => {
      vi.mocked(getRedisClient).mockReturnValue(null);
      vi.mocked(isRedisAvailable).mockReturnValue(false);

      const options = {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100,
      };

      const rateLimiter = createRateLimiter(options);

      expect(rateLimiter).toBeDefined();
      expect(typeof rateLimiter).toBe('function');
    });

    it('should create rate limiter with memory store when Redis client is null', () => {
      vi.mocked(getRedisClient).mockReturnValue(null);
      vi.mocked(isRedisAvailable).mockReturnValue(false);

      const options = {
        windowMs: 60 * 1000, // 1 minute
        max: 10,
      };

      const rateLimiter = createRateLimiter(options);

      expect(rateLimiter).toBeDefined();
      expect(typeof rateLimiter).toBe('function');
    });

    it('should use provided windowMs and max values', () => {
      vi.mocked(getRedisClient).mockReturnValue(null);
      vi.mocked(isRedisAvailable).mockReturnValue(false);

      const options = {
        windowMs: 5 * 60 * 1000, // 5 minutes
        max: 50,
      };

      const rateLimiter = createRateLimiter(options);

      expect((rateLimiter as any).windowMs).toBe(options.windowMs);
      expect((rateLimiter as any).max).toBe(options.max);
    });

    it('should set correct configuration properties', () => {
      vi.mocked(getRedisClient).mockReturnValue(null);
      vi.mocked(isRedisAvailable).mockReturnValue(false);

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

    it('should log warning when Redis is not available', () => {
      vi.mocked(getRedisClient).mockReturnValue(null);
      vi.mocked(isRedisAvailable).mockReturnValue(false);

      const options = {
        windowMs: 15 * 60 * 1000,
        max: 100,
      };

      createRateLimiter(options);

      expect(logger.warn).toHaveBeenCalledWith(
        'Redis not available for rate limiting, using memory store',
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero max requests', () => {
      vi.mocked(getRedisClient).mockReturnValue(null);
      vi.mocked(isRedisAvailable).mockReturnValue(false);

      const options = {
        windowMs: 15 * 60 * 1000,
        max: 0,
      };

      const rateLimiter = createRateLimiter(options);

      expect((rateLimiter as any).max).toBe(0);
    });

    it('should handle short window durations', () => {
      vi.mocked(getRedisClient).mockReturnValue(null);
      vi.mocked(isRedisAvailable).mockReturnValue(false);

      const options = {
        windowMs: 1000, // 1 second
        max: 1,
      };

      const rateLimiter = createRateLimiter(options);

      expect((rateLimiter as any).windowMs).toBe(1000);
    });

    it('should handle long window durations', () => {
      vi.mocked(getRedisClient).mockReturnValue(null);
      vi.mocked(isRedisAvailable).mockReturnValue(false);

      const options = {
        windowMs: 24 * 60 * 60 * 1000, // 24 hours
        max: 1000,
      };

      const rateLimiter = createRateLimiter(options);

      expect((rateLimiter as any).windowMs).toBe(24 * 60 * 60 * 1000);
    });

    it('should handle function creation consistently', () => {
      vi.mocked(getRedisClient).mockReturnValue(null);
      vi.mocked(isRedisAvailable).mockReturnValue(false);

      const options1 = { windowMs: 60000, max: 10 };
      const options2 = { windowMs: 120000, max: 20 };

      const rateLimiter1 = createRateLimiter(options1);
      const rateLimiter2 = createRateLimiter(options2);

      expect(rateLimiter1).toBeDefined();
      expect(rateLimiter2).toBeDefined();
      expect(rateLimiter1).not.toBe(rateLimiter2);
    });
  });
});
