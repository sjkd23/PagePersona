import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import client from '../utils/redis-client';
import { getRedisClient, isRedisAvailable } from './redis';
import { logger } from '../utils/logger';

interface RateLimitOptions {
  windowMs: number;
  max: number;
}

export function createRateLimiter(options: RateLimitOptions): ReturnType<typeof rateLimit> {
  // Use Redis store if available, log if not available but don't crash
  const redisClient = getRedisClient();
  const store =
    redisClient && isRedisAvailable()
      ? new RedisStore({
          sendCommand: async (...args: [string, ...unknown[]]) => {
            const [command, ...rest] = args;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return await (client as any)[command.toLowerCase()](...rest);
          },
        })
      : undefined; // undefined means use default memory store

  if (!store) {
    logger.warn('Redis not available for rate limiting, using memory store');
  } else {
    logger.info('Using Redis for rate limiting storage');
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

const rateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: async (...args: [string, ...unknown[]]) => {
      const [command, ...rest] = args;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await (client as any)[command.toLowerCase()](...rest);
    },
  }),
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

export default rateLimiter;
