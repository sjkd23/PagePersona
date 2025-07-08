import { logger } from '../utils/logger'
import { Request, Response, NextFunction } from 'express'

export interface RateLimitData {
  count: number
  resetTime: number
  firstRequestTime?: number
  penaltyUntil?: number
}

export interface RateLimitStore {
  get(key: string): Promise<RateLimitData | null> | RateLimitData | null
  set(key: string, value: RateLimitData): Promise<void> | void
  delete(key: string): Promise<void> | void
  cleanup?(): Promise<void> | void
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

export interface CacheConfig {
  useRedis?: boolean
  redisClient?: any
  fallbackToMemory?: boolean
}

class InMemoryStore implements RateLimitStore {
  private store = new Map<string, RateLimitData>()

  get(key: string): RateLimitData | null {
    return this.store.get(key) || null
  }

  set(key: string, value: RateLimitData): void {
    this.store.set(key, value)
  }

  delete(key: string): void {
    this.store.delete(key)
  }

  cleanup(): void {
    const now = Date.now()
    this.store.forEach((value, key) => {
      const shouldCleanup = now > value.resetTime && 
                           (!value.penaltyUntil || now > value.penaltyUntil)
      if (shouldCleanup) {
        this.store.delete(key)
      }
    })
  }

  size(): number {
    return this.store.size
  }

  clear(): void {
    this.store.clear()
  }
}

class RedisStore implements RateLimitStore {
  constructor(private redisClient: any) {}

  async get(key: string): Promise<RateLimitData | null> {
    try {
      if (!this.redisClient || !this.redisClient.isConnected()) {
        return null
      }
      
      const data = await this.redisClient.get(`rate_limit:${key}`)
      return data ? JSON.parse(data) : null
    } catch (error) {
      logger.warn('Redis get operation failed', { key, error })
      return null
    }
  }

  async set(key: string, value: RateLimitData): Promise<void> {
    try {
      if (!this.redisClient || !this.redisClient.isConnected()) {
        return
      }

      const maxTtl = Math.max(
        Math.ceil((value.resetTime - Date.now()) / 1000),
        value.penaltyUntil ? Math.ceil((value.penaltyUntil - Date.now()) / 1000) : 0
      )
      
      if (maxTtl > 0) {
        await this.redisClient.set(`rate_limit:${key}`, JSON.stringify(value), maxTtl)
      }
    } catch (error) {
      logger.warn('Redis set operation failed', { key, error })
    }
  }

  async delete(key: string): Promise<void> {
    try {
      if (!this.redisClient || !this.redisClient.isConnected()) {
        return
      }
      
      await this.redisClient.del(`rate_limit:${key}`)
    } catch (error) {
      logger.warn('Redis delete operation failed', { key, error })
    }
  }

  async cleanup(): Promise<void> {
    // Redis handles TTL automatically, no manual cleanup needed
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.redisClient) {
        return false
      }
      
      await this.redisClient.ping()
      return true
    } catch (error) {
      logger.warn('Redis health check failed', { error })
      return false
    }
  }
}

export class CacheService {
  private primaryStore: RateLimitStore
  private fallbackStore: InMemoryStore
  private useRedis: boolean
  private redisStore?: RedisStore

  constructor(config: CacheConfig = {}) {
    this.fallbackStore = new InMemoryStore()
    this.useRedis = !!(config.useRedis && config.redisClient)
    
    if (this.useRedis && config.redisClient) {
      this.redisStore = new RedisStore(config.redisClient)
      this.primaryStore = this.redisStore
      logger.info('CacheService initialized with Redis')
    } else {
      this.primaryStore = this.fallbackStore
      logger.info('CacheService initialized with in-memory storage')
    }
  }

  async get(key: string): Promise<RateLimitData | null> {
    try {
      const result = await this.primaryStore.get(key)
      return result
    } catch (error) {
      logger.warn('Primary cache get failed, using fallback', { key, error })
      
      if (this.useRedis) {
        return this.fallbackStore.get(key)
      }
      
      return null
    }
  }

  async set(key: string, value: RateLimitData): Promise<void> {
    try {
      await this.primaryStore.set(key, value)
      
      // Also update fallback if using Redis
      if (this.useRedis) {
        this.fallbackStore.set(key, value)
      }
    } catch (error) {
      logger.warn('Primary cache set failed', { key, error })
      
      // Fallback to memory store
      if (this.useRedis) {
        this.fallbackStore.set(key, value)
      }
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.primaryStore.delete(key)
      
      if (this.useRedis) {
        this.fallbackStore.delete(key)
      }
    } catch (error) {
      logger.warn('Primary cache delete failed', { key, error })
      
      if (this.useRedis) {
        this.fallbackStore.delete(key)
      }
    }
  }

  async cleanup(): Promise<void> {
    try {
      if (this.primaryStore.cleanup) {
        await this.primaryStore.cleanup()
      }
      
      if (this.useRedis) {
        this.fallbackStore.cleanup()
      }
    } catch (error) {
      logger.warn('Cache cleanup failed', { error })
    }
  }

  isUsingRedis(): boolean {
    return this.useRedis
  }

  async healthCheck(): Promise<{ redis: boolean; memory: boolean; primary: string }> {
    const redisHealth = this.redisStore ? await this.redisStore.healthCheck() : false
    const memoryHealth = true // In-memory store is always available
    
    return {
      redis: redisHealth,
      memory: memoryHealth,
      primary: this.useRedis ? 'redis' : 'memory'
    }
  }

  getStats() {
    return {
      usingRedis: this.useRedis,
      fallbackStoreSize: this.fallbackStore.size(),
      primaryStoreType: this.useRedis ? 'redis' : 'memory'
    }
  }

  // Method to create rate limiter configurations
  static createRateLimitConfig(options: {
    windowMs: number
    maxRequests: number
    message?: string
    skipSuccessfulRequests?: boolean
    skipFailedRequests?: boolean
  }) {
    return {
      windowMs: options.windowMs,
      maxRequests: options.maxRequests,
      message: options.message || 'Too many requests',
      skipSuccessfulRequests: options.skipSuccessfulRequests || false,
      skipFailedRequests: options.skipFailedRequests || false,
      standardHeaders: true,
      legacyHeaders: false
    }
  }

  // Method to create and apply rate limiting middleware
  static createRateLimit(options: RateLimitConfig) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const key = options.keyGenerator ? options.keyGenerator(req) : (req.ip || 'unknown')
      
      // Skip rate limiting if skip function returns true
      if (options.skip && options.skip(req, res)) {
        return next()
      }
      
      // Get current rate limit data
      let rateLimitData = await options.store?.get(key)
      
      // If no data, this is the first request, initialize rate limit data
      if (!rateLimitData) {
        rateLimitData = {
          count: 1,
          resetTime: Date.now() + options.windowMs,
          firstRequestTime: Date.now(),
          penaltyUntil: undefined
        }
      } else {
        rateLimitData.count++
      }
      
      // Check if request exceeds max requests
      if (rateLimitData.count > options.maxRequests) {
        const now = Date.now()
        
        // Calculate penalty time (progressive)
        const penaltyTime = options.penaltyMultiplier 
                          ? Math.min(options.maxPenaltyMs || 3600000, 
                                      (now - (rateLimitData.firstRequestTime || now)) * options.penaltyMultiplier)
                          : 0
                          
        // Apply penalty
        rateLimitData.penaltyUntil = now + penaltyTime
        
        // Optionally, call onRateLimit callback
        if (options.onRateLimit) {
          options.onRateLimit(req, res, options)
        }
        
        return res.status(options.statusCode || 429).json({
          message: options.message || 'Too many requests',
          resetTime: new Date(rateLimitData.resetTime).toISOString(),
          penaltyUntil: rateLimitData.penaltyUntil ? new Date(rateLimitData.penaltyUntil).toISOString() : null
        })
      }
      
      // Update rate limit data in store
      await options.store?.set(key, rateLimitData)
      
      // Check for burst conditions
      if (options.burstThreshold && rateLimitData.count > options.burstThreshold) {
        const now = Date.now()
        const burstWindow = options.burstWindowMs || 10000
        
        // If burst detected, apply burst penalty
        if (rateLimitData.firstRequestTime && (now - rateLimitData.firstRequestTime) < burstWindow) {
          rateLimitData.penaltyUntil = now + (options.maxPenaltyMs || 3600000)
          
          // Optionally, call onBurstDetected callback
          if (options.onBurstDetected) {
            options.onBurstDetected(req, res, options)
          }
        }
      }
      
      next()
    }
  }
}

// Export the createRateLimit function at module level for backwards compatibility
export const createRateLimit = CacheService.createRateLimit
export { InMemoryStore, RedisStore };
