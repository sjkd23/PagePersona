// Rate limiting configuration presets and utilities

import { Request } from 'express';
import { RateLimitConfig } from '../middleware/rateLimitMiddleware';

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
    statusCode: 423,
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
 * Create user-tier specific rate limiter
 */
export function createTieredRateLimit(
  type: keyof typeof USER_TIER_CONFIGS.free,
  getUserTier: (req: any) => keyof typeof USER_TIER_CONFIGS = () => 'free',
  customConfig?: Partial<RateLimitConfig>
) {
  return (req: any, res: any, next: any) => {
    const userTier = getUserTier(req);
    const config = USER_TIER_CONFIGS[userTier]?.[type] || USER_TIER_CONFIGS.free[type];
    
    const rateLimitConfig = {
      ...config,
      ...customConfig,
      keyGenerator: (req: any) => {
        const userId = req.userContext?.userId || req.ip;
        return `${type}:${userTier}:${userId}`;
      }
    };
    
    // This would need to import and use createRateLimit
    // For now, just pass through - implement when needed
    next();
  };
}

// Export specific configurations for easy import
export const AUTH_BRUTE_FORCE_CONFIG = SECURITY_CONFIGS.authBruteForce;
export const PASSWORD_RESET_CONFIG = SECURITY_CONFIGS.passwordReset;
export const SIGNUP_LIMIT_CONFIG = SECURITY_CONFIGS.signupLimit;
