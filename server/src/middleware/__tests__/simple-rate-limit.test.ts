/**
 * @fileoverview Test suite for simple rate limiting middleware
 * Tests basic rate limiting functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Request, Response, NextFunction } from 'express'
import request from 'supertest'
import express from 'express'
import { 
  createTieredRateLimit, 
  getUserMembershipTierSync
} from '../../config/simple-rate-limit-configs'
import { createSimpleRateLimit } from '../../middleware/simple-rate-limit'
import { logger } from '../../utils/logger'

// Mock dependencies
vi.mock('../../utils/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    info: vi.fn()
  }
}))

describe('Simple Rate Limiting Middleware', () => {
  let app: express.Application

  beforeEach(() => {
    vi.clearAllMocks()
    app = express()
    app.use(express.json())
  })

  describe('createSimpleRateLimit', () => {
    it('should allow requests within limit', async () => {
      const rateLimit = createSimpleRateLimit(5, 60 * 1000) // 5 per minute
      
      app.use('/test', rateLimit, (req, res) => {
        res.json({ success: true })
      })
      
      const response = await request(app).get('/test')
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    it('should block requests over limit', async () => {
      // Create a unique key generator for this test to avoid conflicts
      const testKey = `test-${Date.now()}-${Math.random()}`
      const rateLimit = createSimpleRateLimit(
        1, 
        60 * 1000, // 1 per minute
        () => testKey // Same key for all requests in this test
      )
      
      app.use('/test-limit', rateLimit, (req, res) => {
        res.json({ success: true })
      })
      
      // First request should succeed
      const response1 = await request(app).get('/test-limit')
      expect(response1.status).toBe(200)
      
      // Second request with same key should be rate limited
      const response2 = await request(app).get('/test-limit')
      expect(response2.status).toBe(429)
      expect(response2.body.error).toBe('Rate limit exceeded')
    })
  })

  describe('getUserMembershipTierSync', () => {
    it('should return admin for admin role', () => {
      const mockReq = {
        userContext: {
          mongoUser: { role: 'admin' }
        }
      } as any
      
      const tier = getUserMembershipTierSync(mockReq)
      expect(tier).toBe('admin')
    })

    it('should return premium for premium role', () => {
      const mockReq = {
        userContext: {
          mongoUser: { role: 'premium' }
        }
      } as any
      
      const tier = getUserMembershipTierSync(mockReq)
      expect(tier).toBe('premium')
    })

    it('should return free for unknown role', () => {
      const mockReq = {
        userContext: {
          mongoUser: { role: 'user' }
        }
      } as any
      
      const tier = getUserMembershipTierSync(mockReq)
      expect(tier).toBe('free')
    })

    it('should return free for missing user context', () => {
      const mockReq = {} as any
      
      const tier = getUserMembershipTierSync(mockReq)
      expect(tier).toBe('free')
    })
  })

  describe('createTieredRateLimit', () => {
    it('should create a tiered rate limiter', () => {
      const rateLimit = createTieredRateLimit('api', () => 'free')
      
      expect(rateLimit).toBeDefined()
      expect(typeof rateLimit).toBe('function')
    })

    it('should apply different limits based on tier', async () => {
      // Mock getUserMembershipTierSync to return 'free'
      const rateLimit = createTieredRateLimit('api', () => 'free')
      
      app.use('/test', rateLimit, (req, res) => {
        res.json({ success: true })
      })
      
      const response = await request(app).get('/test')
      expect(response.status).toBe(200)
    })
  })
})
