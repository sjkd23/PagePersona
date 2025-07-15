/**
 * Debug and Testing Route Handler
 *
 * Provides debugging endpoints for testing infrastructure components
 * like Redis connectivity, rate limiting stores, and service availability.
 * Essential for development troubleshooting and production health checks.
 *
 * Routes:
 * - GET /redis: Test Redis connectivity and rate limiting store status
 */

import { Router, Request, Response } from 'express';
import { redisClient } from '../utils/redis-client';
import { HttpStatus } from '../constants/http-status';
import { isUsingRedisStore } from '../middleware/simple-rate-limit';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Test Redis connectivity and rate limiting configuration
 *
 * Performs a complete Redis connectivity test by setting a temporary key,
 * reading it back, and cleaning up. Reports on both Redis availability
 * and the current rate limiting store configuration.
 *
 * @route GET /redis
 * @returns {object} Redis connectivity status and rate limiting store info
 * @throws {503} Service unavailable if Redis operations fail
 * @throws {500} Internal server error for unexpected failures
 */
router.get('/redis', async (req: Request, res: Response) => {
  try {
    const testKey = 'debug:test';
    const testValue = 'pong';
    const ttlSeconds = 10; // 10 second TTL for debug test

    // Set test value with TTL
    const setResult = await redisClient.set(testKey, testValue, ttlSeconds);

    if (!setResult) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        success: false,
        error: 'Redis SET operation failed',
        redisAvailable: false,
        rateLimitingStore: isUsingRedisStore() ? 'Redis (but failing)' : 'In-Memory',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Read back the value
    const getValue = await redisClient.get(testKey);

    if (getValue === testValue) {
      // Success - clean up the test key immediately
      await redisClient.del(testKey);

      res.json({
        success: true,
        value: getValue,
        redisAvailable: true,
        rateLimitingStore: isUsingRedisStore() ? 'Redis' : 'In-Memory',
        message: 'Redis connectivity test successful',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        success: false,
        error: 'Redis GET operation failed or returned unexpected value',
        expected: testValue,
        received: getValue,
        redisAvailable: false,
        rateLimitingStore: isUsingRedisStore() ? 'Redis (but failing)' : 'In-Memory',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    logger.error('Redis debug test failed', error, {
      endpoint: '/api/debug/redis',
      redisStoreUsed: isUsingRedisStore(),
      testType: 'connectivity_test',
    });
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Redis debug test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      redisAvailable: false,
      rateLimitingStore: isUsingRedisStore() ? 'Redis (but failing)' : 'In-Memory',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
