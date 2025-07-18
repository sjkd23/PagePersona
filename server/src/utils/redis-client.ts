/**
 * Redis Configuration and Usage Documentation
 *
 * This application uses Redis for the following purposes:
 *
 * 1. RATE LIMITING STORAGE
 *    - Stores rate limit counters per user/IP
 *    - Tracks penalty periods for burst behavior
 *    - Keys: rate_limit:{method}:{route}:{userId}
 *    - TTL: Automatically managed based on window duration
 *
 * 2. USER TIER CACHING
 *    - Caches user membership levels (free/premium/admin)
 *    - Keys: user:{userId}:tier
 *    - TTL: 5 minutes
 *
 * 3. SESSION MANAGEMENT (planned for production)
 *    - Currently uses in-memory fallback
 *    - Will store user session data for persistence
 *
 * 4. GRACEFUL FALLBACK
 *    - Application continues without Redis
 *    - Falls back to in-memory storage
 *    - Logs appropriate warnings
 *
 * IMPORTANT: Redis does NOT cache scraped website content or AI transformations.
 * Those use separate NodeCache instances with different TTL strategies:
 * - Scraped content: 1 hour TTL, 1000 pages max
 * - AI transformations: 24 hours TTL, 5000 transformations max
 *
 * Configuration:
 * - REDIS_URL: Connection string (default: redis://localhost:6379)
 * - REDIS_DISABLED: Set to 'true' to disable Redis entirely
 *
 * @see redis-client.ts for connection management
 * @see cache-service.ts for content caching
 * @see rate-limit-middleware.ts for rate limiting implementation
 */

import { createClient } from 'redis';

const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});
let warned = false;
let connectionFailed = false;

client.on('error', (err) => {
  if (!warned) {
    console.warn('⚠️ Redis error—falling back to memory store:', err.message);
    warned = true;
  }
  connectionFailed = true;
});

client.on('connect', () => {
  console.info('✅ Connected to Redis');
  connectionFailed = false;
});

// Attempt to connect, but don't fail if it doesn't work
client.connect().catch(() => {
  connectionFailed = true;
});

// Export singleton instance as redisClient for compatibility
export const redisClient = {
  getClient() {
    return connectionFailed ? null : client;
  },

  async get(key: string): Promise<string | null> {
    if (connectionFailed) return null;

    try {
      return await client.get(key);
    } catch (error) {
      if (!warned) {
        console.warn(
          '⚠️ Redis GET error:',
          error instanceof Error ? error.message : 'Unknown error',
        );
        warned = true;
      }
      connectionFailed = true;
      return null;
    }
  },

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    if (connectionFailed) return false;

    try {
      if (ttlSeconds) {
        await client.setEx(key, ttlSeconds, value);
      } else {
        await client.set(key, value);
      }
      return true;
    } catch (error) {
      if (!warned) {
        console.warn(
          '⚠️ Redis SET error:',
          error instanceof Error ? error.message : 'Unknown error',
        );
        warned = true;
      }
      connectionFailed = true;
      return false;
    }
  },

  async del(key: string): Promise<boolean> {
    if (connectionFailed) return false;

    try {
      await client.del(key);
      return true;
    } catch (error) {
      if (!warned) {
        console.warn(
          '⚠️ Redis DEL error:',
          error instanceof Error ? error.message : 'Unknown error',
        );
        warned = true;
      }
      connectionFailed = true;
      return false;
    }
  },

  async disconnect(): Promise<void> {
    try {
      await client.disconnect();
      console.info('Redis connection closed successfully');
    } catch (error) {
      console.warn(
        'Error disconnecting Redis:',
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  },
};

export default client;
