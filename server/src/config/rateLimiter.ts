import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { parsedEnv } from '../utils/env-validation';
import { logger } from '../utils/logger';
import redisClient from '../utils/redis-client';

interface RateLimitOptions {
  windowMs: number;
  max: number;
}

export function createRateLimiter(options: RateLimitOptions): ReturnType<typeof rateLimit> {
  // Check if Redis URL is available in environment
  if (!parsedEnv.REDIS_URL) {
    logger.warn('REDIS_URL not configured, using memory store for rate limiting');
    return rateLimit({
      windowMs: options.windowMs,
      max: options.max,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many requests, please try again later.' },
    });
  }

  try {
    // Use Redis store for distributed rate limiting
    logger.info('Using Redis store for rate limiting');
    return rateLimit({
      store: new RedisStore({
        sendCommand: (...args: string[]) => redisClient.sendCommand(args),
      }),
      windowMs: options.windowMs,
      max: options.max,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many requests, please try again later.' },
    });
  } catch (error) {
    logger.error(
      'Failed to initialize Redis store for rate limiting, falling back to memory store:',
      error,
    );
    return rateLimit({
      windowMs: options.windowMs,
      max: options.max,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many requests, please try again later.' },
    });
  }
}
