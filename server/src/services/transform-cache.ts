/**
 * Transform Cache Service
 *
 * Provides Redis-based caching for content transformation results
 * with proper error handling and fallback behavior.
 */

import { redisClient } from '../utils/redis-client';
import { logger } from '../utils/logger';
import type { TransformationResult } from './content-transformer';

const CACHE_TTL = Number(process.env.CACHE_TTL_SECONDS) || 3600;

/**
 * Generate cache key for transformation results
 */
function generateCacheKey(url: string, persona: string): string {
  const encodedUrl = Buffer.from(url).toString('base64');
  return `transform:${persona}:${encodedUrl}`;
}

/**
 * Get cached transformation result
 */
export async function getCachedTransformResult(
  url: string,
  persona: string,
): Promise<TransformationResult | null> {
  const cacheKey = generateCacheKey(url, persona);

  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.info('Cache hit for transformation', { url, persona });
      return JSON.parse(cached);
    }

    logger.info('Cache miss for transformation', { url, persona });
    return null;
  } catch (error) {
    logger.error('Error getting cached transformation result:', error);
    return null;
  }
}

/**
 * Cache transformation result
 */
export async function setCachedTransformResult(
  url: string,
  persona: string,
  result: TransformationResult,
): Promise<void> {
  const cacheKey = generateCacheKey(url, persona);

  try {
    await redisClient.set(cacheKey, JSON.stringify(result), CACHE_TTL);
    logger.info('Cached transformation result', { url, persona, ttl: CACHE_TTL });
  } catch (error) {
    logger.error('Error caching transformation result:', error);
  }
}

/**
 * Generate cache key for text transformation results
 */
function generateTextCacheKey(text: string, persona: string): string {
  // Use first 100 characters and create hash for consistent key generation
  const textSample = text.substring(0, 100);
  const textHash = Buffer.from(textSample).toString('base64');
  return `transform:text:${persona}:${textHash}`;
}

/**
 * Get cached text transformation result
 */
export async function getCachedTextTransformResult(
  text: string,
  persona: string,
): Promise<TransformationResult | null> {
  const cacheKey = generateTextCacheKey(text, persona);

  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.info('Cache hit for text transformation', { persona, textLength: text.length });
      return JSON.parse(cached);
    }

    logger.info('Cache miss for text transformation', { persona, textLength: text.length });
    return null;
  } catch (error) {
    logger.error('Error getting cached text transformation result:', error);
    return null;
  }
}

/**
 * Cache text transformation result
 */
export async function setCachedTextTransformResult(
  text: string,
  persona: string,
  result: TransformationResult,
): Promise<void> {
  const cacheKey = generateTextCacheKey(text, persona);

  try {
    await redisClient.set(cacheKey, JSON.stringify(result), CACHE_TTL);
    logger.info('Cached text transformation result', {
      persona,
      textLength: text.length,
      ttl: CACHE_TTL,
    });
  } catch (error) {
    logger.error('Error caching text transformation result:', error);
  }
}

/**
 * Clear cache for a specific URL and persona
 */
export async function clearTransformCache(url: string, persona: string): Promise<void> {
  const cacheKey = generateCacheKey(url, persona);

  try {
    await redisClient.del(cacheKey);
    logger.info('Cleared transformation cache', { url, persona });
  } catch (error) {
    logger.error('Error clearing transformation cache:', error);
  }
}

/**
 * Clear all transformation cache (useful for maintenance)
 */
export async function clearAllTransformCache(): Promise<void> {
  try {
    // Note: This would need to be implemented in redis-client if needed
    logger.info('Clear all transformation cache requested');
  } catch (error) {
    logger.error('Error clearing all transformation cache:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalKeys: number;
  transformKeys: number;
  textTransformKeys: number;
} | null> {
  try {
    // Note: This would need to be implemented in redis-client if needed
    logger.info('Cache stats requested');
    return null;
  } catch (error) {
    logger.error('Error getting cache stats:', error);
    return null;
  }
}
