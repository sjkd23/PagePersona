// Enhanced rate limiting middleware for sensitive endpoints

import { Request, Response, NextFunction } from 'express'
import { safeToISOString } from '../utils/userSerializer'
import { logger } from '../utils/logger'
import { HttpStatus } from '../constants/http-status'
import { CacheService, type RateLimitData } from '../services/cacheService'

// Import Redis client for cache service initialization
import { redisClient } from '../utils/redis-client'

// Create cache service with Redis if available
const cacheService = new CacheService({
  useRedis: true,
  redisClient: redisClient,
  fallbackToMemory: true
})

/**
 * Check if Redis store is available and being used
 */
export function isUsingRedisStore(): boolean {
  return cacheService.isUsingRedis()
}

// Configuration interface for rate limiting
interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  message?: string
  statusCode?: number
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (req: Request) => string
  onRateLimit?: (req: Request, res: Response, config: RateLimitConfig) => void
  onBurstDetected?: (req: Request, res: Response, config: RateLimitConfig) => void
}

// Enhanced rate limiter factory with cache service
export function createRateLimiter(config: RateLimitConfig) {
  const statusCode = config.statusCode || HttpStatus.TOO_MANY_REQUESTS
  const burstWindowMs = 30000 // 30 seconds for burst detection
  const burstThreshold = Math.max(3, Math.floor(config.maxRequests * 0.6))
  const penaltyMultiplier = 2
  const maxPenaltyMs = 10 * 60 * 1000 // 10 minutes max penalty

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = config.keyGenerator ? 
        config.keyGenerator(req) : 
        (() => {
          const userId = req.user?.id || req.ip || 'anonymous'
          const route = req.route?.path || req.path
          return `${req.method}:${route}:${userId}`
        })()
      
      const now = Date.now()
      
      // Clean up expired entries periodically
      if (Math.random() < 0.01) { // 1% chance to trigger cleanup
        try {
          await cacheService.cleanup()
        } catch (error) {
          logger.warn('Cache cleanup error (non-critical)', { error: error instanceof Error ? error.message : 'unknown' })
        }
      }
      
      const userLimit = await cacheService.get(key)
      
      // Check if user is currently under penalty
      if (userLimit?.penaltyUntil && now < userLimit.penaltyUntil) {
        const retryAfter = Math.ceil((userLimit.penaltyUntil - now) / 1000)
        
        if (config.onRateLimit) {
          config.onRateLimit(req, res, config)
        }
        
        res.status(statusCode).json({
          success: false,
          error: 'Rate limit penalty in effect. Please wait before trying again.',
          retryAfter,
          penaltyExpires: safeToISOString(userLimit.penaltyUntil)
        })
        return
      }
      
      if (!userLimit) {
        // First request in window
        await cacheService.set(key, {
          count: 1,
          resetTime: now + config.windowMs,
          firstRequestTime: now
        })
        
        setupResponseMonitoring(req, res, config, key)
        next()
        return
      }
      
      if (now > userLimit.resetTime) {
        // Window expired, reset (but keep penalty if active)
        await cacheService.set(key, {
          count: 1,
          resetTime: now + config.windowMs,
          firstRequestTime: now,
          penaltyUntil: userLimit.penaltyUntil // Preserve any active penalty
        })
        
        setupResponseMonitoring(req, res, config, key)
        next()
        return
      }
      
      // Check for burst behavior
      const isBurstBehavior = userLimit.firstRequestTime && 
                             (now - userLimit.firstRequestTime) < burstWindowMs &&
                             userLimit.count >= burstThreshold
      
      if (isBurstBehavior && config.onBurstDetected) {
        config.onBurstDetected(req, res, config)
      }
      
      if (userLimit.count >= config.maxRequests) {
        // Rate limit exceeded - apply progressive penalty
        const violationCount = userLimit.penaltyUntil ? 
          Math.floor(Math.log2(penaltyMultiplier)) + 1 : 1
        
        const penaltyDuration = Math.min(
          config.windowMs * Math.pow(penaltyMultiplier, violationCount - 1),
          maxPenaltyMs
        )
        
        userLimit.penaltyUntil = now + penaltyDuration
        await cacheService.set(key, userLimit)
        
        if (config.onRateLimit) {
          config.onRateLimit(req, res, config)
        }
        
        const retryAfter = Math.ceil((userLimit.resetTime - now) / 1000)
        
        res.status(statusCode).json({
          success: false,
          error: config.message || 'Too many requests',
          retryAfter,
          rateLimitExceeded: true,
          penaltyDuration: Math.ceil(penaltyDuration / 1000),
          ...(isBurstBehavior && { burstDetected: true })
        })
        return
      }
      
      // Increment request count
      userLimit.count++
      await cacheService.set(key, userLimit)
      
      // Set up response monitoring
      setupResponseMonitoring(req, res, config, key)
      
      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, config.maxRequests - userLimit.count).toString(),
        'X-RateLimit-Reset': new Date(userLimit.resetTime).toISOString()
      })
      
      next()
      
    } catch (error) {
      logger.error('Rate limiting middleware error', {
        error: error instanceof Error ? error.message : 'unknown',
        path: req.path,
        method: req.method
      })
      
      // Don't block requests on rate limit errors
      next()
    }
  }
}

// Response monitoring for success/failure tracking
function setupResponseMonitoring(
  req: Request,
  res: Response,
  config: RateLimitConfig,
  key: string
) {
  const originalSend = res.send
  
  res.send = function(data: any) {
    const statusCode = res.statusCode
    const isSuccess = statusCode >= 200 && statusCode < 400
    const isClientError = statusCode >= 400 && statusCode < 500
    
    // Handle skip logic based on response
    if ((config.skipSuccessfulRequests && isSuccess) ||
        (config.skipFailedRequests && !isSuccess)) {
      
      // Decrement counter for skipped requests
      cacheService.get(key).then(async (userLimit) => {
        if (userLimit && userLimit.count > 0) {
          userLimit.count--
          await cacheService.set(key, userLimit)
        }
      }).catch((error) => {
        logger.warn('Failed to adjust rate limit for skipped request', { error })
      })
    }
    
    return originalSend.call(this, data)
  }
}

// Health check function for cache service
export async function getRateLimitHealth() {
  return await cacheService.healthCheck()
}

// Get cache service stats
export function getRateLimitStats() {
  return cacheService.getStats()
}

// Predefined rate limiters using cache service configurations
export const syncRateLimit = createRateLimiter(CacheService.createRateLimitConfig({
  windowMs: 1 * 60 * 1000, // 1 minute
  maxRequests: 10,
  message: 'Too many sync requests'
}))

export const profileUpdateRateLimit = createRateLimiter(CacheService.createRateLimitConfig({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 20,
  message: 'Too many profile update requests'
}))

export const testEndpointRateLimit = createRateLimiter(CacheService.createRateLimitConfig({
  windowMs: 1 * 60 * 1000, // 1 minute
  maxRequests: 100,
  message: 'Too many test requests'
}))

// Export cache service for external use
export { cacheService }

export function getUserMembershipTierSync(user: any): string {
  // Return tier based on user.membership
  if (user.membership === 'premium') {
    return 'premium'
  }
  if (user.membership === 'admin') {
    return 'admin'
  }
  // Default to free
  return 'free'
}
