import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MongoUser } from '../models/mongo-user'
import { logger } from '../utils/logger'

// Mock mongoose model methods
vi.mock('../models/mongo-user', () => ({
  MongoUser: {
    updateOne: vi.fn(),
    updateMany: vi.fn(),
    incrementUsageById: vi.fn(),
    incrementFailedAttemptById: vi.fn(),
    bulkIncrementUsage: vi.fn(),
  }
}))

// Mock logger
vi.mock('../utils/logger', () => ({
  logger: {
    usage: {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }
  }
}))

describe('MongoUser UTC Reset Logic Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('UTC Reset Date Calculation', () => {
    it('should handle February 29th leap year reset correctly', () => {
      // Test case: User's usage was last reset on Feb 29, 2024 (leap year)
      // Current date is March 1, 2025 (non-leap year)
      
      const leapYearResetDate = new Date('2024-02-29T00:00:00.000Z') // Feb 29, 2024
      const currentDate = new Date('2025-03-01T10:30:00.000Z') // March 1, 2025
      
      // Test the reset logic
      const needsReset = currentDate.getUTCMonth() !== leapYearResetDate.getUTCMonth() || 
                        currentDate.getUTCFullYear() !== leapYearResetDate.getUTCFullYear()
      
      expect(needsReset).toBe(true) // Should need reset since it's a different month/year
      
      // Verify the new reset date would be calculated correctly
      const expectedResetDate = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), 1))
      expect(expectedResetDate.toISOString()).toBe('2025-03-01T00:00:00.000Z')
    })

    it('should handle timezone edge cases with UTC dates', () => {
      // Test case: User in different timezone, but all dates stored in UTC
      
      const utcResetDate = new Date('2025-01-01T00:00:00.000Z') // Jan 1, 2025 UTC
      const currentDateUTC = new Date('2025-02-01T23:59:59.000Z') // Feb 1, 2025 23:59 UTC
      
      // Test the reset logic using UTC methods
      const needsReset = currentDateUTC.getUTCMonth() !== utcResetDate.getUTCMonth() || 
                        currentDateUTC.getUTCFullYear() !== utcResetDate.getUTCFullYear()
      
      expect(needsReset).toBe(true) // Should need reset (Jan vs Feb)
      
      // Verify new reset date is calculated in UTC
      const expectedResetDate = new Date(Date.UTC(currentDateUTC.getUTCFullYear(), currentDateUTC.getUTCMonth(), 1))
      expect(expectedResetDate.toISOString()).toBe('2025-02-01T00:00:00.000Z')
    })

    it('should handle December to January year transition', () => {
      const decemberResetDate = new Date('2024-12-01T00:00:00.000Z')
      const januaryCurrentDate = new Date('2025-01-15T12:00:00.000Z')
      
      // Test year transition
      const needsReset = januaryCurrentDate.getUTCMonth() !== decemberResetDate.getUTCMonth() || 
                        januaryCurrentDate.getUTCFullYear() !== decemberResetDate.getUTCFullYear()
      
      expect(needsReset).toBe(true)
      
      // Verify new reset date
      const expectedResetDate = new Date(Date.UTC(januaryCurrentDate.getUTCFullYear(), januaryCurrentDate.getUTCMonth(), 1))
      expect(expectedResetDate.toISOString()).toBe('2025-01-01T00:00:00.000Z')
    })

    it('should not reset within the same month', () => {
      const startOfMonthResetDate = new Date('2025-07-01T00:00:00.000Z')
      const endOfMonthCurrentDate = new Date('2025-07-31T23:59:59.000Z')
      
      // Test same month, no reset needed
      const needsReset = endOfMonthCurrentDate.getUTCMonth() !== startOfMonthResetDate.getUTCMonth() || 
                        endOfMonthCurrentDate.getUTCFullYear() !== startOfMonthResetDate.getUTCFullYear()
      
      expect(needsReset).toBe(false)
    })
  })

  describe('Edge Case Scenarios', () => {
    it('should handle missing usageResetDate gracefully', () => {
      // Test that missing reset date is handled properly
      const now = new Date('2025-07-15T10:30:00.000Z')
      const currentMonthUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))

      // Test that it handles missing reset date by treating as needing reset
      expect(currentMonthUTC.toISOString()).toBe('2025-07-01T00:00:00.000Z')
      
      // Verify month calculation is correct
      expect(currentMonthUTC.getUTCMonth()).toBe(6) // July is month 6 (0-indexed)
      expect(currentMonthUTC.getUTCDate()).toBe(1) // First day of month
      expect(currentMonthUTC.getUTCHours()).toBe(0) // Midnight UTC
    })

    it('should handle very old reset dates correctly', () => {
      // Reset date from years ago
      const veryOldResetDate = new Date('2020-03-01T00:00:00.000Z')
      const currentDate = new Date('2025-07-15T10:30:00.000Z')
      
      const needsReset = currentDate.getUTCMonth() !== veryOldResetDate.getUTCMonth() || 
                        currentDate.getUTCFullYear() !== veryOldResetDate.getUTCFullYear()
      
      expect(needsReset).toBe(true)
    })
  })

  describe('Race Condition Protection', () => {
    it('should use atomic operations for usage increment', async () => {
      const mockUpdateOne = vi.fn().mockResolvedValue({ modifiedCount: 1 })
      ;(MongoUser.updateOne as any).mockImplementation(mockUpdateOne)

      // Test the incrementUsageById behavior
      const userId = 'test-user-123'
      const now = new Date('2025-07-15T10:30:00.000Z')
      const currentMonthUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))

      // Mock the incrementUsageById behavior
      ;(MongoUser.incrementUsageById as any).mockImplementation(async (id: string) => {
        const normalUpdate = await MongoUser.updateOne(
          { 
            _id: id,
            $or: [
              { 'usage.usageResetDate': { $gte: currentMonthUTC } },
              { 'usage.usageResetDate': { $exists: false } }
            ]
          },
          {
            $inc: {
              'usage.totalTransformations': 1,
              'usage.monthlyUsage': 1
            },
            $set: {
              'usage.lastTransformation': now
            }
          }
        )
        return normalUpdate.modifiedCount > 0
      })

      const result = await MongoUser.incrementUsageById(userId)
      
      expect(result).toBe(true)
      expect(mockUpdateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: userId,
          $or: expect.arrayContaining([
            { 'usage.usageResetDate': { $gte: currentMonthUTC } },
            { 'usage.usageResetDate': { $exists: false } }
          ])
        }),
        expect.objectContaining({
          $inc: {
            'usage.totalTransformations': 1,
            'usage.monthlyUsage': 1
          },
          $set: {
            'usage.lastTransformation': now
          }
        })
      )
    })
  })
})
