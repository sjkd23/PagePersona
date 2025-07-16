/**
 * Transform Cache Service
 *
 * Provides Redis-based caching for content transformation results
 * with proper error handling and fallback behavior.
 */

import { getRedisClient, safeRedisOperation } from '../config/redis';
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

  return await safeRedisOperation(
    async () => {
      const client = getRedisClient();
      if (!client) return null;

      const cached = await client.get(cacheKey);
      if (cached) {
        logger.info('Cache hit for transformation', { url, persona });
        return JSON.parse(cached);
      }

      logger.info('Cache miss for transformation', { url, persona });
      return null;
    },
    'getCachedTransformResult',
    null,
  );
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

  await safeRedisOperation(
    async () => {
      const client = getRedisClient();
      if (!client) return;

      await client.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL);
      logger.info('Cached transformation result', { url, persona, ttl: CACHE_TTL });
    },
    'setCachedTransformResult',
    undefined,
  );
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

  return await safeRedisOperation(
    async () => {
      const client = getRedisClient();
      if (!client) return null;

      const cached = await client.get(cacheKey);
      if (cached) {
        logger.info('Cache hit for text transformation', { persona, textLength: text.length });
        return JSON.parse(cached);
      }

      logger.info('Cache miss for text transformation', { persona, textLength: text.length });
      return null;
    },
    'getCachedTextTransformResult',
    null,
  );
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

  await safeRedisOperation(
    async () => {
      const client = getRedisClient();
      if (!client) return;

      await client.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL);
      logger.info('Cached text transformation result', {
        persona,
        textLength: text.length,
        ttl: CACHE_TTL,
      });
    },
    'setCachedTextTransformResult',
    undefined,
  );
}

/**
 * Clear cache for a specific URL and persona
 */
export async function clearTransformCache(url: string, persona: string): Promise<void> {
  const cacheKey = generateCacheKey(url, persona);

  await safeRedisOperation(
    async () => {
      const client = getRedisClient();
      if (!client) return;

      await client.del(cacheKey);
      logger.info('Cleared transformation cache', { url, persona });
    },
    'clearTransformCache',
    undefined,
  );
}

/**
 * Clear all transformation cache (useful for maintenance)
 */
export async function clearAllTransformCache(): Promise<void> {
  await safeRedisOperation(
    async () => {
      const client = getRedisClient();
      if (!client) return;

      const keys = await client.keys('transform:*');
      if (keys.length > 0) {
        await client.del(...keys);
        logger.info('Cleared all transformation cache', { keysCleared: keys.length });
      }
    },
    'clearAllTransformCache',
    undefined,
  );
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalKeys: number;
  transformKeys: number;
  textTransformKeys: number;
} | null> {
  return await safeRedisOperation(
    async () => {
      const client = getRedisClient();
      if (!client) return null;

      const allKeys = await client.keys('*');
      const transformKeys = await client.keys('transform:*:*');
      const textTransformKeys = await client.keys('transform:text:*');

      return {
        totalKeys: allKeys.length,
        transformKeys: transformKeys.length,
        textTransformKeys: textTransformKeys.length,
      };
    },
    'getCacheStats',
    null,
  );
}
