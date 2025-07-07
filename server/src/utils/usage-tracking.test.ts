import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  incrementUserUsage,
  incrementUserUsageByAuth0Id,
  checkUserUsageLimit,
  getUserUsageStats,
  getSystemUsageStats,
  USAGE_LIMITS,
  getUserUsageLimit,
  bulkIncrementUsage,
  incrementUserUsageWithRetry,
  incrementUserFailedAttempt
} from './usage-tracking'
import { MongoUser } from '../models/mongo-user'

// Mock the MongoUser model
vi.mock('../models/mongo-user', () => ({
  MongoUser: {
    incrementUsageById: vi.fn(),
    findByAuth0Id: vi.fn(),
    findById: vi.fn(),
    getUsageStats: vi.fn(),
    bulkIncrementUsage: vi.fn(),
    incrementFailedAttemptById: vi.fn()
  }
}))

describe('usage-tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('incrementUserUsage', () => {
    it('should successfully increment usage', async () => {
      vi.mocked(MongoUser.incrementUsageById).mockResolvedValue(true)

      const result = await incrementUserUsage('user123')

      expect(result).toBe(true)
      expect(MongoUser.incrementUsageById).toHaveBeenCalledWith('user123')
    })

    it('should return false when user not found', async () => {
      vi.mocked(MongoUser.incrementUsageById).mockResolvedValue(false)

      const result = await incrementUserUsage('nonexistent')

      expect(result).toBe(false)
    })

    it('should handle errors with suppressErrors=true', async () => {
      vi.mocked(MongoUser.incrementUsageById).mockRejectedValue(new Error('Database error'))

      const result = await incrementUserUsage('user123', { suppressErrors: true })

      expect(result).toBe(false)
    })

    it('should throw errors with suppressErrors=false', async () => {
      const error = new Error('Database error')
      vi.mocked(MongoUser.incrementUsageById).mockRejectedValue(error)

      await expect(incrementUserUsage('user123', { suppressErrors: false })).rejects.toThrow(error)
    })

    it('should log success when logSuccess=true', async () => {
      vi.mocked(MongoUser.incrementUsageById).mockResolvedValue(true)

      const result = await incrementUserUsage('user123', { logSuccess: true })

      expect(result).toBe(true)
    })
  })

  describe('incrementUserUsageByAuth0Id', () => {
    it('should successfully increment usage by Auth0 ID', async () => {
      const mockUser = {
        incrementUsage: vi.fn(),
        usage: { monthlyUsage: 5 }
      }
      vi.mocked(MongoUser.findByAuth0Id).mockResolvedValue(mockUser as any)

      const result = await incrementUserUsageByAuth0Id('auth0|123')

      expect(result).toBe(true)
      expect(MongoUser.findByAuth0Id).toHaveBeenCalledWith('auth0|123')
      expect(mockUser.incrementUsage).toHaveBeenCalled()
    })

    it('should return false when user not found', async () => {
      vi.mocked(MongoUser.findByAuth0Id).mockResolvedValue(null)

      const result = await incrementUserUsageByAuth0Id('auth0|nonexistent')

      expect(result).toBe(false)
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(MongoUser.findByAuth0Id).mockRejectedValue(new Error('Database error'))

      const result = await incrementUserUsageByAuth0Id('auth0|123', { suppressErrors: true })

      expect(result).toBe(false)
    })
  })

  describe('checkUserUsageLimit', () => {
    it('should return usage check for existing user', async () => {
      const mockUser = {
        checkUsageLimit: vi.fn().mockReturnValue(true),
        usage: { monthlyUsage: 25 }
      }
      vi.mocked(MongoUser.findById).mockResolvedValue(mockUser as any)

      const result = await checkUserUsageLimit('user123', 50)

      expect(result).toEqual({
        allowed: true,
        currentUsage: 25,
        limit: 50
      })
      expect(mockUser.checkUsageLimit).toHaveBeenCalledWith(50)
    })

    it('should allow usage for non-existent user', async () => {
      vi.mocked(MongoUser.findById).mockResolvedValue(null)

      const result = await checkUserUsageLimit('nonexistent', 50)

      expect(result).toEqual({
        allowed: true,
        currentUsage: 0,
        limit: 50
      })
    })

    it('should fail open on database errors', async () => {
      vi.mocked(MongoUser.findById).mockRejectedValue(new Error('Database error'))

      const result = await checkUserUsageLimit('user123', 50)

      expect(result).toEqual({
        allowed: true,
        currentUsage: 0,
        limit: 50
      })
    })

    it('should return false when limit exceeded', async () => {
      const mockUser = {
        checkUsageLimit: vi.fn().mockReturnValue(false),
        usage: { monthlyUsage: 75 }
      }
      vi.mocked(MongoUser.findById).mockResolvedValue(mockUser as any)

      const result = await checkUserUsageLimit('user123', 50)

      expect(result).toEqual({
        allowed: false,
        currentUsage: 75,
        limit: 50
      })
    })
  })

  describe('getUserUsageStats', () => {
    it('should return user usage stats', async () => {
      const mockUser = {
        usage: {
          totalTransformations: 100,
          monthlyUsage: 25,
          lastTransformation: new Date('2023-01-01'),
          usageResetDate: new Date('2023-01-01')
        }
      }
      vi.mocked(MongoUser.findById).mockResolvedValue(mockUser as any)

      const result = await getUserUsageStats('user123')

      expect(result).toEqual({
        totalTransformations: 100,
        monthlyUsage: 25,
        lastTransformation: new Date('2023-01-01'),
        usageResetDate: new Date('2023-01-01')
      })
    })

    it('should return null for non-existent user', async () => {
      vi.mocked(MongoUser.findById).mockResolvedValue(null)

      const result = await getUserUsageStats('nonexistent')

      expect(result).toBe(null)
    })

    it('should return null on database errors', async () => {
      vi.mocked(MongoUser.findById).mockRejectedValue(new Error('Database error'))

      const result = await getUserUsageStats('user123')

      expect(result).toBe(null)
    })
  })

  describe('getSystemUsageStats', () => {
    it('should return system usage stats', async () => {
      const mockStats = {
        totalUsers: 1000,
        activeUsersThisMonth: 250,
        totalTransformations: 5000
      }
      vi.mocked(MongoUser.getUsageStats).mockResolvedValue(mockStats)

      const result = await getSystemUsageStats()

      expect(result).toEqual(mockStats)
    })

    it('should return default stats on database errors', async () => {
      vi.mocked(MongoUser.getUsageStats).mockRejectedValue(new Error('Database error'))

      const result = await getSystemUsageStats()

      expect(result).toEqual({
        totalUsers: 0,
        activeUsersThisMonth: 0,
        totalTransformations: 0
      })
    })
  })

  describe('USAGE_LIMITS', () => {
    it('should have correct usage limits', () => {
      expect(USAGE_LIMITS.free).toBe(50)
      expect(USAGE_LIMITS.premium).toBe(500)
      expect(USAGE_LIMITS.admin).toBe(10000)
    })
  })

  describe('getUserUsageLimit', () => {
    it('should return admin limit for admin users', () => {
      const adminUser = { membership: 'admin' } as any
      expect(getUserUsageLimit(adminUser)).toBe(USAGE_LIMITS.admin)
    })

    it('should return premium limit for premium users', () => {
      const premiumUser = { membership: 'premium' } as any
      expect(getUserUsageLimit(premiumUser)).toBe(USAGE_LIMITS.premium)
    })

    it('should return free limit for free users', () => {
      const freeUser = { membership: 'free' } as any
      expect(getUserUsageLimit(freeUser)).toBe(USAGE_LIMITS.free)
    })

    it('should return free limit for users without membership', () => {
      const userWithoutMembership = {} as any
      expect(getUserUsageLimit(userWithoutMembership)).toBe(USAGE_LIMITS.free)
    })

    it('should return free limit for unknown membership types', () => {
      const unknownUser = { membership: 'unknown' } as any
      expect(getUserUsageLimit(unknownUser)).toBe(USAGE_LIMITS.free)
    })
  })

  describe('bulkIncrementUsage', () => {
    it('should successfully bulk increment usage', async () => {
      const userIds = ['user1', 'user2', 'user3']
      vi.mocked(MongoUser.bulkIncrementUsage).mockResolvedValue(3)

      const result = await bulkIncrementUsage(userIds)

      expect(result).toEqual({
        success: true,
        updated: 3,
        total: 3
      })
      expect(MongoUser.bulkIncrementUsage).toHaveBeenCalledWith(userIds)
    })

    it('should handle partial success', async () => {
      const userIds = ['user1', 'user2', 'user3']
      vi.mocked(MongoUser.bulkIncrementUsage).mockResolvedValue(2) // Only 2 updated

      const result = await bulkIncrementUsage(userIds)

      expect(result).toEqual({
        success: true,
        updated: 2,
        total: 3
      })
    })

    it('should handle errors gracefully', async () => {
      const userIds = ['user1', 'user2']
      vi.mocked(MongoUser.bulkIncrementUsage).mockRejectedValue(new Error('Database error'))

      const result = await bulkIncrementUsage(userIds, { suppressErrors: true })

      expect(result).toEqual({
        success: false,
        updated: 0,
        total: 2
      })
    })

    it('should throw errors when suppressErrors=false', async () => {
      const userIds = ['user1']
      const error = new Error('Database error')
      vi.mocked(MongoUser.bulkIncrementUsage).mockRejectedValue(error)

      await expect(bulkIncrementUsage(userIds, { suppressErrors: false })).rejects.toThrow(error)
    })
  })

  describe('incrementUserUsageWithRetry', () => {
    it('should succeed on first attempt', async () => {
      vi.mocked(MongoUser.incrementUsageById).mockResolvedValue(true)

      const result = await incrementUserUsageWithRetry('user123')

      expect(result).toBe(true)
      expect(MongoUser.incrementUsageById).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure and eventually succeed', async () => {
      vi.mocked(MongoUser.incrementUsageById)
        .mockResolvedValueOnce(false) // First attempt fails
        .mockResolvedValueOnce(true)  // Second attempt succeeds

      const result = await incrementUserUsageWithRetry('user123', 3)

      expect(result).toBe(true)
      expect(MongoUser.incrementUsageById).toHaveBeenCalledTimes(2)
    })

    it('should fail after max retries', async () => {
      vi.mocked(MongoUser.incrementUsageById).mockResolvedValue(false)

      const result = await incrementUserUsageWithRetry('user123', 2)

      expect(result).toBe(false)
      expect(MongoUser.incrementUsageById).toHaveBeenCalledTimes(2)
    })

    it('should handle exceptions during retry', async () => {
      vi.mocked(MongoUser.incrementUsageById).mockRejectedValue(new Error('Database error'))

      const result = await incrementUserUsageWithRetry('user123', 2, { suppressErrors: true })

      expect(result).toBe(false)
      expect(MongoUser.incrementUsageById).toHaveBeenCalledTimes(2)
    })
  })

  describe('incrementUserFailedAttempt', () => {
    it('should successfully increment failed attempt', async () => {
      vi.mocked(MongoUser.incrementFailedAttemptById).mockResolvedValue(true)

      const result = await incrementUserFailedAttempt('user123')

      expect(result).toBe(true)
      expect(MongoUser.incrementFailedAttemptById).toHaveBeenCalledWith('user123')
    })

    it('should return false when user not found', async () => {
      vi.mocked(MongoUser.incrementFailedAttemptById).mockResolvedValue(false)

      const result = await incrementUserFailedAttempt('nonexistent')

      expect(result).toBe(false)
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(MongoUser.incrementFailedAttemptById).mockRejectedValue(new Error('Database error'))

      const result = await incrementUserFailedAttempt('user123', { suppressErrors: true })

      expect(result).toBe(false)
    })

    it('should throw errors when suppressErrors=false', async () => {
      const error = new Error('Database error')
      vi.mocked(MongoUser.incrementFailedAttemptById).mockRejectedValue(error)

      await expect(incrementUserFailedAttempt('user123', { suppressErrors: false })).rejects.toThrow(error)
    })
  })

  describe('integration scenarios', () => {
    it('should handle complete usage tracking flow', async () => {
      const userId = 'integration-test-user'
      
      // Mock successful increment
      vi.mocked(MongoUser.incrementUsageById).mockResolvedValue(true)
      
      // Mock usage stats
      const mockUser = {
        usage: {
          totalTransformations: 1,
          monthlyUsage: 1,
          lastTransformation: new Date(),
          usageResetDate: new Date()
        },
        checkUsageLimit: vi.fn().mockReturnValue(true)
      }
      vi.mocked(MongoUser.findById).mockResolvedValue(mockUser as any)
      
      // Increment usage
      const incrementResult = await incrementUserUsage(userId)
      expect(incrementResult).toBe(true)
      
      // Check usage stats
      const stats = await getUserUsageStats(userId)
      expect(stats?.monthlyUsage).toBe(1)
      
      // Check usage limit
      const limitCheck = await checkUserUsageLimit(userId, 50)
      expect(limitCheck.allowed).toBe(true)
      expect(limitCheck.currentUsage).toBe(1)
    })
  })
})
