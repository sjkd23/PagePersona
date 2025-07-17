import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { getRedisClient, isRedisAvailable } from './redis';
import { logger } from '../utils/logger';

interface RateLimitOptions {
  windowMs: number;
  max: number;
}

export function createRateLimiter(options: RateLimitOptions) {
  const redisClient = getRedisClient();

  // Use Redis store if available, otherwise fallback to memory store
  const store =
    redisClient && isRedisAvailable()
      ? new RedisStore({
          sendCommand: async (...args: [string, ...unknown[]]) => {
            // Convert args to the format expected by ioredis
            const [command, ...rest] = args;
            // Use explicit any for Redis command invocation as it's a dynamic interface
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return await (redisClient as any)[command.toLowerCase()](...rest);
          },
        })
      : undefined; // undefined means use default memory store

  if (!store) {
    logger.warn('Redis not available for rate limiting, using memory store');
  }

  return rateLimit({
    store,
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
  });
}
