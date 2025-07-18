import rateLimit from 'express-rate-limit';
import { isRedisAvailable } from './redis';
import { logger } from '../utils/logger';

interface RateLimitOptions {
  windowMs: number;
  max: number;
}

export function createRateLimiter(options: RateLimitOptions): ReturnType<typeof rateLimit> {
  // Check if Redis is available
  if (!isRedisAvailable()) {
    logger.warn('Redis not available for rate limiting, using memory store');
    return rateLimit({
      windowMs: options.windowMs,
      max: options.max,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many requests, please try again later.' },
    });
  }

  // Redis is available, but temporarily disable Redis rate limiting
  // until we resolve the sendCommand issue
  logger.warn('Redis rate limiting temporarily disabled, using memory store');
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
  });
}

// Default rate limiter instance using memory store
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

export default rateLimiter;
