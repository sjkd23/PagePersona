import { Router, Request, Response } from 'express';
import { redisClient } from '../utils/redis-client';
import { HttpStatus } from '../constants/http-status';
import { isUsingRedisStore } from '../middleware/rate-limit-middleware-refactored';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Debug route to test Redis connectivity
 * Sets a test key, reads it back, and returns the result
 * Used to verify Redis is working in the live application
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
        timestamp: new Date().toISOString()
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
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        success: false,
        error: 'Redis GET operation failed or returned unexpected value',
        expected: testValue,
        received: getValue,
        redisAvailable: false,
        rateLimitingStore: isUsingRedisStore() ? 'Redis (but failing)' : 'In-Memory',
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    logger.error('Redis debug test failed', error, {
      endpoint: '/api/debug/redis',
      redisStoreUsed: isUsingRedisStore(),
      testType: 'connectivity_test'
    });
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Redis debug test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      redisAvailable: false,
      rateLimitingStore: isUsingRedisStore() ? 'Redis (but failing)' : 'In-Memory',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
