/**
 * Redis Configuration
 *
 * Provides a singleton Redis client instance for caching operations
 * with proper error handling and graceful fallback behavior.
 */

import Redis from 'ioredis';
import { logger } from '../utils/logger';

// Redis singleton instance
let redis: Redis | null = null;
let isRedisConnected = false;

/**
 * Initialize Redis client with connection handling
 */
function initializeRedis(): Redis | null {
  try {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      logger.warn('Redis URL not configured, Redis caching will be disabled');
      return null;
    }

    if (process.env.REDIS_DISABLED === 'true') {
      logger.info('Redis is disabled via environment variable');
      return null;
    }

    const client = new Redis(redisUrl, {
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      // Connection timeout
      connectTimeout: 5000,
      // Command timeout
      commandTimeout: 2000,
    });

    // Connection event handlers
    client.on('connect', () => {
      logger.info('Redis client connected successfully');
      isRedisConnected = true;
    });

    client.on('error', (error) => {
      logger.error('Redis connection error:', error);
      isRedisConnected = false;
    });

    client.on('close', () => {
      logger.warn('Redis connection closed');
      isRedisConnected = false;
    });

    client.on('reconnecting', () => {
      logger.info('Redis client reconnecting...');
    });

    return client;
  } catch (error) {
    logger.error('Failed to initialize Redis client:', error);
    return null;
  }
}

/**
 * Get Redis client instance
 */
function getRedisClient(): Redis | null {
  if (!redis) {
    redis = initializeRedis();
  }
  return redis;
}

/**
 * Check if Redis is connected and available
 */
function isRedisAvailable(): boolean {
  return redis !== null && isRedisConnected;
}

/**
 * Safe Redis operation wrapper
 */
async function safeRedisOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  fallbackValue: T,
): Promise<T> {
  try {
    const client = getRedisClient();
    if (!client || !isRedisAvailable()) {
      logger.warn(`Redis not available for ${operationName}, using fallback`);
      return fallbackValue;
    }

    return await operation();
  } catch (error) {
    logger.error(`Redis ${operationName} operation failed:`, error);
    return fallbackValue;
  }
}

/**
 * Export Redis client and utility functions
 */
export default getRedisClient();
export { getRedisClient, isRedisAvailable, safeRedisOperation };
