// Rate limiting configuration presets and utilities

import { Request } from 'express';
import { RateLimitConfig, createRateLimit } from '../middleware/rate-limit-middleware';
import { HttpStatus } from '../constants/http-status';
import { redisClient } from '../utils/redis-client';
import { MongoUser } from '../models/mongo-user';

// Environment-based configurations
export const RATE_LIMIT_PRESETS = {
  development: {
    // Relaxed limits for development
    api: { windowMs: 60 * 1000, maxRequests: 1000 },
    auth: { windowMs: 60 * 1000, maxRequests: 20 },
    sync: { windowMs: 60 * 1000, maxRequests: 10 }
  },
  
  production: {
    // Strict limits for production
    api: { windowMs: 60 * 1000, maxRequests: 100 },
    auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
    sync: { windowMs: 60 * 1000, maxRequests: 3 }
  },
  
  testing: {
    // Very relaxed for testing
    api: { windowMs: 60 * 1000, maxRequests: 10000 },
    auth: { windowMs: 60 * 1000, maxRequests: 100 },
    sync: { windowMs: 60 * 1000, maxRequests: 100 }
  }
} as const;

// Security-focused configurations
export const SECURITY_CONFIGS = {
  // Brute force protection for login endpoints
  authBruteForce: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    burstThreshold: 3,
    burstWindowMs: 30000, // 30 seconds
    penaltyMultiplier: 4,
    maxPenaltyMs: 24 * 60 * 60 * 1000, // 24 hours
    skipSuccessfulRequests: true,
    statusCode: HttpStatus.LOCKED,
    message: 'Too many failed authentication attempts'
  },
  
  // Password reset protection
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    burstThreshold: 2,
    penaltyMultiplier: 3,
    skipSuccessfulRequests: true,
    message: 'Too many password reset attempts'
  },
  
  // Account creation protection
  signupLimit: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
    burstThreshold: 3,
    keyGenerator: (req: Request) => `signup:${req.ip}`, // IP-based
    message: 'Too many account creation attempts from this IP'
  }
} as const;

// User tier configurations
export const USER_TIER_CONFIGS = {
  free: {
    api: { windowMs: 60 * 1000, maxRequests: 100 },
    transform: { windowMs: 60 * 1000, maxRequests: 10 },
    chat: { windowMs: 60 * 1000, maxRequests: 20 }
  },
  
  premium: {
    api: { windowMs: 60 * 1000, maxRequests: 1000 },
    transform: { windowMs: 60 * 1000, maxRequests: 100 },
    chat: { windowMs: 60 * 1000, maxRequests: 200 }
  },
  
  admin: {
    api: { windowMs: 60 * 1000, maxRequests: 10000 },
    transform: { windowMs: 60 * 1000, maxRequests: 1000 },
    chat: { windowMs: 60 * 1000, maxRequests: 1000 }
  }
} as const;

/**
 * Get rate limit config based on environment and context
 */
export function getRateLimitConfig(
  type: keyof typeof RATE_LIMIT_PRESETS.production,
  environment: keyof typeof RATE_LIMIT_PRESETS = process.env.NODE_ENV as any || 'production',
  customConfig?: Partial<RateLimitConfig>
): RateLimitConfig {
  const baseConfig = RATE_LIMIT_PRESETS[environment]?.[type] || RATE_LIMIT_PRESETS.production[type];
  
  return {
    ...baseConfig,
    ...customConfig
  };
}

/**
 * Create user-tier specific rate limiter based on membership
 */
export function createTieredRateLimit(
  type: keyof typeof USER_TIER_CONFIGS.free,
  getUserTier: (req: any) => keyof typeof USER_TIER_CONFIGS = getUserMembershipTierSync,
  customConfig?: Partial<RateLimitConfig>
) {
  return (req: any, res: any, next: any) => {
    const userTier = getUserTier(req);
    const config = USER_TIER_CONFIGS[userTier]?.[type] || USER_TIER_CONFIGS.free[type];
    
    const rateLimitConfig: RateLimitConfig = {
      ...config,
      ...customConfig,
      keyGenerator: (req: any) => {
        const userId = req.userContext?.userId || req.ip;
        return `${type}:${userTier}:${userId}`;
      }
    };
    
    // Create and apply the rate limit middleware
    const rateLimit = createRateLimit(rateLimitConfig);
    return rateLimit(req, res, next);
  };
}

/**
 * Helper function to get user membership tier from request with Redis caching
 */
export async function getUserMembershipTier(req: any): Promise<keyof typeof USER_TIER_CONFIGS> {
  const userId = req.userContext?.mongoUser?._id;
  
  if (!userId) {
    return 'free';
  }

  // Try to get from Redis cache first
  const cacheKey = `user:${userId}:tier`;
  const cached = await redisClient.get(cacheKey);
  
  if (cached && ['free', 'premium', 'admin'].includes(cached)) {
    return cached as keyof typeof USER_TIER_CONFIGS;
  }

  // Fall back to MongoDB if cache miss
  const membership = req.userContext?.mongoUser?.membership;
  
  // Validate membership value and default to 'free' if invalid
  let tier: keyof typeof USER_TIER_CONFIGS = 'free';
  if (membership && ['free', 'premium', 'admin'].includes(membership)) {
    tier = membership as keyof typeof USER_TIER_CONFIGS;
  }

  // Cache the result with 5-minute TTL
  await redisClient.set(cacheKey, tier, 300);
  
  return tier;
}

/**
 * Synchronous helper function to get user membership tier from request (no caching)
 * Use this for rate limiting middleware that requires synchronous operation
 */
export function getUserMembershipTierSync(req: any): keyof typeof USER_TIER_CONFIGS {
  const membership = req.userContext?.mongoUser?.membership;
  
  // Validate membership value and default to 'free' if invalid
  if (membership && ['free', 'premium', 'admin'].includes(membership)) {
    return membership as keyof typeof USER_TIER_CONFIGS;
  }
  
  return 'free';
}

// Export specific configurations for easy import
export const AUTH_BRUTE_FORCE_CONFIG = SECURITY_CONFIGS.authBruteForce;
export const PASSWORD_RESET_CONFIG = SECURITY_CONFIGS.passwordReset;
export const SIGNUP_LIMIT_CONFIG = SECURITY_CONFIGS.signupLimit;
