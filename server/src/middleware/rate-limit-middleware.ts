// Enhanced rate limiting middleware for sensitive endpoints

import { Request, Response, NextFunction } from 'express'
import { safeToISOString } from '../utils/userSerializer'
import { logger } from '../utils/logger'
import { HttpStatus } from '../constants/http-status'
import { CacheService, RateLimitStore, RateLimitData, InMemoryStore, RedisStore } from '../services/cacheService'

// Import Redis client for cache service initialization
import { redisClient } from '../utils/redis-client'

// Create cache service with Redis if available
const cacheService = new CacheService({
  useRedis: true,
  redisClient: redisClient,
  fallbackToMemory: true
})

let redisStore: RateLimitStore | null = null;
let defaultStore: RateLimitStore;

// Initialize stores on module load
initializeStores().catch(() => {
  // Fallback is already set to in-memory store, just log
  defaultStore = new InMemoryStore();
  logger.info('Rate limiting initialization complete - using in-memory storage. For production scaling, consider setting up Redis.', {
    impact: 'limited_scaling',
    fallback: 'in_memory_store',
    action: 'consider_redis_for_production'
  });
});

async function initializeStores() {
  const client = await redisClient.getClient();
  if (client) {
    redisStore = new RedisStore(redisClient);
    defaultStore = redisStore as RateLimitStore;
    logger.info('Rate limiting using Redis storage for enhanced persistence and scaling');
  } else {
    // Keep the in-memory store that was already created
    logger.info('Rate limiting using in-memory storage. Redis not available - this is fine for development but limits scaling in production.', {
      impact: 'limited_scaling',
      fallback: 'in_memory_store',
      recommendation: 'use_redis_for_production'
    });
  }
}

/**
 * Check if Redis store is available and being used
 */
export function isUsingRedisStore(): boolean {
  return redisStore !== null && defaultStore === redisStore;
}

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  
  // Response options
  message?: string;
  statusCode?: number; // Custom status code (default: 429)
  
  // Behavioral options
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean; // Skip counting failed requests (4xx, 5xx)
  keyGenerator?: (req: Request) => string; // Custom key generation
  skip?: (req: Request, res: Response) => boolean; // Skip rate limiting entirely
  
  // Burst protection
  burstThreshold?: number; // Number of requests in short time to trigger burst protection
  burstWindowMs?: number; // Time window for burst detection (default: 10 seconds)
  
  // Progressive penalties
  penaltyMultiplier?: number; // Multiply penalty time on repeated violations (default: 2)
  maxPenaltyMs?: number; // Maximum penalty time (default: 1 hour)
  
  // Storage
  store?: RateLimitStore; // Custom store (defaults to in-memory)
  
  // Callbacks
  onRateLimit?: (req: Request, res: Response, options: RateLimitConfig) => void;
  onBurstDetected?: (req: Request, res: Response, options: RateLimitConfig) => void;
}

/**
 * Get the current rate limit store (Redis if available, in-memory fallback)
 */
export function getCurrentStore(): RateLimitStore {
  return defaultStore;
}

/**
 * Create enhanced rate limiting middleware with burst protection and progressive penalties
 */
export function createRateLimit(config: RateLimitConfig) {
  const store = config.store || defaultStore || new InMemoryStore(); // Triple fallback safety
  const burstThreshold = config.burstThreshold || Math.ceil(config.maxRequests * 0.6);
  const burstWindowMs = config.burstWindowMs || 10000; // 10 seconds
  const penaltyMultiplier = config.penaltyMultiplier || 2;
  const maxPenaltyMs = config.maxPenaltyMs || 60 * 60 * 1000; // 1 hour
  const statusCode = config.statusCode || 429;
  
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if this request should skip rate limiting
      if (config.skip && config.skip(req, res)) {
        next();
        return;
      }

      // Use custom key generator if provided, otherwise use enhanced default
      const key = config.keyGenerator 
        ? config.keyGenerator(req)
        : (() => {
            // Use userContext if available, fallback to legacy fields, then IP
            const userId = req.userContext?.mongoUser?._id?.toString() || 
                          req.userContext?.jwtPayload?.sub || 
                          req.ip;
            
            // Include method and route for granular control
            const route = req.route?.path || req.path;
            return `${req.method}:${route}:${userId}`;
          })();
      
      const now = Date.now();
      
      // Clean up expired entries periodically
      if (store && store.cleanup && Math.random() < 0.01) { // 1% chance to trigger cleanup
        try {
          await store.cleanup();
        } catch (error) {
          // Cleanup errors shouldn't affect the rate limiting functionality
          logger.warn('Rate limit store cleanup error (non-critical):', { error: error instanceof Error ? error.message : 'unknown' });
        }
      }
      
      const userLimit = await store.get(key);
      
      // Check if user is currently under penalty
      if (userLimit?.penaltyUntil && now < userLimit.penaltyUntil) {
        const retryAfter = Math.ceil((userLimit.penaltyUntil - now) / 1000);
        
        if (config.onRateLimit) {
          config.onRateLimit(req, res, config);
        }
        
        res.status(statusCode).json({
          success: false,
          error: 'Rate limit penalty in effect. Please wait before trying again.',
          retryAfter,
          penaltyExpires: safeToISOString(userLimit.penaltyUntil)
        });
        return;
      }
      
      if (!userLimit) {
        // First request in window
        await store.set(key, {
          count: 1,
          resetTime: now + config.windowMs,
          firstRequestTime: now
        });
        
        // Set up success/failure monitoring if configured
        setupResponseMonitoring(req, res, config, store, key);
        next();
        return;
      }
      
      if (now > userLimit.resetTime) {
        // Window expired, reset (but keep penalty if active)
        await store.set(key, {
          count: 1,
          resetTime: now + config.windowMs,
          firstRequestTime: now,
          penaltyUntil: userLimit.penaltyUntil // Preserve any active penalty
        });
        
        setupResponseMonitoring(req, res, config, store, key);
        next();
        return;
      }
      
      // Check for burst behavior
      const isBurstBehavior = userLimit.firstRequestTime && 
                             (now - userLimit.firstRequestTime) < burstWindowMs &&
                             userLimit.count >= burstThreshold;
      
      if (isBurstBehavior && config.onBurstDetected) {
        config.onBurstDetected(req, res, config);
      }
      
      if (userLimit.count >= config.maxRequests) {
        // Rate limit exceeded - apply progressive penalty
        const violationCount = userLimit.penaltyUntil ? 
          Math.floor(Math.log2(penaltyMultiplier)) + 1 : 1;
        
        const penaltyDuration = Math.min(
          config.windowMs * Math.pow(penaltyMultiplier, violationCount - 1),
          maxPenaltyMs
        );
        
        userLimit.penaltyUntil = now + penaltyDuration;
        await store.set(key, userLimit);
        
        if (config.onRateLimit) {
          config.onRateLimit(req, res, config);
        }
        
        const retryAfter = Math.ceil((userLimit.resetTime - now) / 1000);
        
        res.status(statusCode).json({
          success: false,
          error: config.message || 'Too many requests',
          retryAfter,
          rateLimitExceeded: true,
          penaltyDuration: Math.ceil(penaltyDuration / 1000),
          ...(isBurstBehavior && { burstDetected: true })
        });
        return;
      }
      
      // Increment counter 
      userLimit.count++;
      await store.set(key, userLimit);
      
      setupResponseMonitoring(req, res, config, store, key);
      next();
      
    } catch (error) {
      console.error('❌ Rate limiting error:', error);
      // Fail open - allow request if rate limiting fails
      next();
    }
  };
}

/**
 * Set up monitoring for successful/failed requests
 */
function setupResponseMonitoring(
  req: Request, 
  res: Response, 
  config: RateLimitConfig, 
  store: RateLimitStore, 
  key: string
) {
  if (!config.skipSuccessfulRequests && !config.skipFailedRequests) {
    return;
  }
  
  const originalSend = res.send.bind(res);
  const originalJson = res.json.bind(res);
  
  const handleResponse = async () => {
    const shouldSkip = 
      (config.skipSuccessfulRequests && res.statusCode >= 200 && res.statusCode < 300) ||
      (config.skipFailedRequests && res.statusCode >= 400);
    
    if (shouldSkip) {
      const currentLimit = await store.get(key);
      if (currentLimit && currentLimit.count > 0) {
        currentLimit.count--;
        await store.set(key, currentLimit);
      }
    }
  };
  
  res.send = function(body?: unknown) {
    handleResponse().catch(console.error); // Fire and forget
    return originalSend(body);
  };
  
  res.json = function(obj?: unknown) {
    handleResponse().catch(console.error); // Fire and forget
    return originalJson(obj);
  };
}

// Helper utilities

/**
 * Get current rate limit status for a user/IP
 */
export async function getRateLimitStatus(
  key: string, 
  store: RateLimitStore = defaultStore
): Promise<{
  remaining: number;
  resetTime: number;
  penaltyUntil?: number;
  isUnderPenalty: boolean;
} | null> {
  const data = await store.get(key);
  if (!data) return null;
  
  const now = Date.now();
  const isUnderPenalty = data.penaltyUntil ? now < data.penaltyUntil : false;
  
  return {
    remaining: Math.max(0, data.count),
    resetTime: data.resetTime,
    penaltyUntil: data.penaltyUntil,
    isUnderPenalty
  };
}

/**
 * Clear rate limit for a specific key (admin function)
 */
export async function clearRateLimit(
  key: string, 
  store: RateLimitStore = defaultStore
): Promise<void> {
  await store.delete(key);
}

/**
 * Enhanced logging for rate limit events
 */
export const rateLimitLogger = {
  violation: (req: Request, config: RateLimitConfig, data: RateLimitData) => {
    const userId = req.userContext?.mongoUser?._id?.toString() || 'anonymous';
    console.warn(`🚫 Rate limit exceeded: ${userId} at ${req.method} ${req.path} (${data.count}/${config.maxRequests})`);
  },
  
  burst: (req: Request, config: RateLimitConfig, data: RateLimitData) => {
    const userId = req.userContext?.mongoUser?._id?.toString() || 'anonymous';
    console.warn(`💥 Burst behavior: ${userId} at ${req.method} ${req.path} (${data.count} requests)`);
  },
  
  penalty: (req: Request, penaltyDuration: number) => {
    const userId = req.userContext?.mongoUser?._id?.toString() || 'anonymous';
    console.error(`⏱️ Progressive penalty applied: ${userId} banned for ${Math.ceil(penaltyDuration / 1000)}s`);
  }
};

// Predefined rate limiters with enhanced security

export const syncRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 3, // 3 sync requests per minute
  message: 'Too many sync requests. Please try again later.',
  burstThreshold: 2, // Trigger burst protection if 2 requests in 10 seconds
  burstWindowMs: 10000,
  penaltyMultiplier: 3, // Harsh penalty for sync abuse
  skipSuccessfulRequests: true, // Don't count successful syncs
  onBurstDetected: (req, res, config) => {
    console.warn(`🚨 Burst sync behavior detected from ${req.ip}`);
  }
});

export const profileUpdateRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute  
  maxRequests: 10, // 10 profile updates per minute
  message: 'Too many profile updates. Please try again later.',
  burstThreshold: 5, // 5 updates in quick succession is suspicious
  skipFailedRequests: true, // Don't count validation failures
  onRateLimit: (req, res, config) => {
    console.warn(`⚠️ Profile update rate limit hit for ${req.userContext?.mongoUser?._id?.toString() || req.ip}`);
  }
});

export const testEndpointRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20, // 20 test requests per minute
  message: 'Too many test requests. Please try again later.',
  skipSuccessfulRequests: true, // Only count failed tests
  skip: (req, res) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  }
});

// Stricter rate limiter for authentication endpoints
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 failed auth attempts per 15 minutes
  message: 'Too many authentication attempts. Please try again later.',
  burstThreshold: 3, // 3 attempts in 30 seconds triggers burst protection
  burstWindowMs: 30000,
  penaltyMultiplier: 4, // Very harsh penalty for auth abuse
  maxPenaltyMs: 24 * 60 * 60 * 1000, // Max 24 hour penalty
  skipSuccessfulRequests: true, // Only count failed auth attempts
  statusCode: HttpStatus.LOCKED, // 423 Locked instead of 429
  keyGenerator: (req) => {
    // Rate limit by IP for auth endpoints, regardless of user
    return `auth:${req.ip}`;
  },
  onBurstDetected: (req, res, config) => {
    console.error(`🔒 Auth brute force attempt detected from ${req.ip}`);
    // In production, you might want to trigger additional security measures here
  }
});

// API endpoint rate limiter with different limits for different user types
export const createApiRateLimit = (userType: 'free' | 'premium' | 'admin' = 'free') => {
  const limits = {
    free: { windowMs: 60 * 1000, maxRequests: 100 },
    premium: { windowMs: 60 * 1000, maxRequests: 1000 },
    admin: { windowMs: 60 * 1000, maxRequests: 10000 }
  };
  
  const limit = limits[userType];
  
  return createRateLimit({
    ...limit,
    message: `API rate limit exceeded for ${userType} tier`,
    burstThreshold: Math.ceil(limit.maxRequests * 0.1), // 10% of limit in burst window
    skipSuccessfulRequests: false, // Count all API calls
    keyGenerator: (req) => {
      const userId = req.userContext?.mongoUser?._id?.toString() || req.ip;
      return `api:${userType}:${userId}`;
    }
  });
};

// Export store types for advanced usage
export { RateLimitStore, RateLimitData, InMemoryStore };
