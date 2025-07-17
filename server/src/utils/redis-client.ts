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

import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

class RedisClientManager {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;
  private connectionAttempted: boolean = false;
  private connectionFailed: boolean = false;
  private silentMode: boolean = false;

  async getClient(): Promise<RedisClientType | null> {
    if (!this.client && !this.connectionAttempted && !this.connectionFailed) {
      await this.connect();
    }
    return this.isConnected ? this.client : null;
  }

  private async connect(): Promise<void> {
    this.connectionAttempted = true;

    // Check if Redis is explicitly disabled
    if (process.env.REDIS_DISABLED === 'true') {
      logger.auth.info('Redis disabled via environment variable - using in-memory storage');
      this.isConnected = false;
      this.client = null;
      this.connectionFailed = true;
      this.silentMode = true;
      return;
    }

    try {
      // Redis connection URL from environment or default local
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      this.client = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 3000, // Reduced timeout
          reconnectStrategy: false, // Disable automatic reconnection
        },
      });

      this.client.on('error', (err: Error & { code?: string }) => {
        // Only log the first connection error, then go silent
        if (!this.silentMode) {
          if (err.code === 'ECONNREFUSED') {
            logger.auth.info(
              'Redis not available - using in-memory fallback. Install and start Redis for enhanced performance and persistence.',
              {
                fallback: 'in_memory_storage',
                suggestion: 'install_redis_server',
              },
            );
          } else {
            logger.auth.warn('Redis client error:', { error: err });
          }
          this.silentMode = true; // Suppress further Redis errors
        }
        this.isConnected = false;
        this.connectionFailed = true;
      });

      this.client.on('connect', () => {
        logger.auth.info('Redis client connected successfully');
        this.isConnected = true;
        this.connectionFailed = false;
        this.silentMode = false;
      });

      this.client.on('disconnect', () => {
        if (!this.silentMode) {
          logger.auth.info('Redis client disconnected');
        }
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error: unknown) {
      if ((error as Error & { code?: string }).code === 'ECONNREFUSED') {
        logger.auth.info(
          'Redis server not running - application will use in-memory storage. For production use, please install and configure Redis.',
          {
            fallback: 'in_memory_storage',
            impact: 'no_persistence_across_restarts',
            recommendation: 'install_redis_for_production',
          },
        );
      } else {
        logger.auth.warn('Failed to connect to Redis, will fall back to in-memory storage:', {
          error: (error as Error).message,
        });
      }
      this.isConnected = false;
      this.client = null;
      this.connectionFailed = true;
      this.silentMode = true; // Prevent further connection attempts and errors
    }
  }

  async get(key: string): Promise<string | null> {
    // Don't attempt if connection previously failed
    if (this.connectionFailed) return null;

    const client = await this.getClient();
    if (!client) return null;

    try {
      return await client.get(key);
    } catch (error: unknown) {
      if (!this.silentMode) {
        logger.auth.warn('Redis GET error:', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        this.silentMode = true;
      }
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    // Don't attempt if connection previously failed
    if (this.connectionFailed) return false;

    const client = await this.getClient();
    if (!client) return false;

    try {
      if (ttlSeconds) {
        await client.setEx(key, ttlSeconds, value);
      } else {
        // Log warning for keys without TTL to avoid stale cache
        if (!this.silentMode) {
          logger.auth.warn('Redis SET without TTL - key may become stale:', {
            key,
          });
        }
        await client.set(key, value);
      }
      return true;
    } catch (error: unknown) {
      if (!this.silentMode) {
        logger.auth.warn('Redis SET error:', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        this.silentMode = true;
      }
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    // Don't attempt if connection previously failed
    if (this.connectionFailed) return false;

    const client = await this.getClient();
    if (!client) return false;

    try {
      await client.del(key);
      return true;
    } catch (error: unknown) {
      if (!this.silentMode) {
        logger.auth.warn('Redis DEL error:', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        this.silentMode = true;
      }
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.disconnect();
        if (!this.silentMode) {
          logger.auth.info('Redis connection closed successfully');
        }
      } catch (error: unknown) {
        if (!this.silentMode) {
          logger.auth.warn('Error disconnecting Redis:', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
      this.client = null;
      this.isConnected = false;
    }
  }
}

// Export singleton instance
export const redisClient = new RedisClientManager();
