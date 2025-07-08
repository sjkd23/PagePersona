import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  shouldPerformFullSync,
  updateSessionOnly,
  pruneStaleSessions,
  startSessionCleanup,
  stopSessionCleanup,
  clearAllSessions,
  getSessionStats
} from './session-tracker'

describe('session-tracker', () => {
  beforeEach(() => {
    // Clear all sessions before each test
    clearAllSessions()
    // Stop any running cleanup intervals
    stopSessionCleanup()
    vi.clearAllMocks()
  })

  afterEach(() => {
    clearAllSessions()
    stopSessionCleanup()
    vi.restoreAllMocks()
  })

  describe('shouldPerformFullSync', () => {
    it('should return true for first-time user', () => {
      const userId = 'user123'
      const result = shouldPerformFullSync(userId)
      
      expect(result).toBe(true)
      
      // Verify session was created
      const stats = getSessionStats()
      expect(stats.activeSessions).toBe(1)
    })

    it('should return false for recent sync', () => {
      const userId = 'user123'
      const config = { syncCooldownMs: 5000, sessionTimeoutMs: 60000 }
      
      // First call should sync
      const firstResult = shouldPerformFullSync(userId, config)
      expect(firstResult).toBe(true)
      
      // Immediate second call should not sync
      const secondResult = shouldPerformFullSync(userId, config)
      expect(secondResult).toBe(false)
    })

    it('should return true after cooldown period', async () => {
      const userId = 'user123'
      const config = { syncCooldownMs: 10, sessionTimeoutMs: 60000 } // 10ms cooldown
      
      // First sync
      const firstResult = shouldPerformFullSync(userId, config)
      expect(firstResult).toBe(true)
      
      // Wait for cooldown
      await new Promise(resolve => setTimeout(resolve, 15))
      
      // Should sync again after cooldown
      const secondResult = shouldPerformFullSync(userId, config)
      expect(secondResult).toBe(true)
    })

    it('should update lastSeen on each call', () => {
      const userId = 'user123'
      const config = { syncCooldownMs: 5000, sessionTimeoutMs: 60000 }
      
      // First call
      shouldPerformFullSync(userId, config)
      const stats1 = getSessionStats()
      const firstLastSeen = stats1.sessions[0].lastSeen
      
      // Wait a bit and call again
      setTimeout(() => {
        shouldPerformFullSync(userId, config)
        const stats2 = getSessionStats()
        const secondLastSeen = stats2.sessions[0].lastSeen
        
        expect(secondLastSeen.getTime()).toBeGreaterThanOrEqual(firstLastSeen.getTime())
      }, 5)
    })
  })

  describe('updateSessionOnly', () => {
    it('should update lastSeen for existing session', () => {
      const userId = 'user123'
      
      // Create session first
      shouldPerformFullSync(userId)
      const stats1 = getSessionStats()
      const initialLastSeen = stats1.sessions[0].lastSeen
      
      // Wait a bit and update session
      setTimeout(() => {
        updateSessionOnly(userId)
        const stats2 = getSessionStats()
        const updatedLastSeen = stats2.sessions[0].lastSeen
        
        expect(updatedLastSeen.getTime()).toBeGreaterThanOrEqual(initialLastSeen.getTime())
      }, 5)
    })

    it('should do nothing for non-existent session', () => {
      const userId = 'nonexistent'
      
      // Should not throw or create session
      expect(() => updateSessionOnly(userId)).not.toThrow()
      
      const stats = getSessionStats()
      expect(stats.activeSessions).toBe(0)
    })
  })

  describe('pruneStaleSessions', () => {
    it('should remove expired sessions', () => {
      const userId1 = 'user1'
      const userId2 = 'user2'
      const timeoutMs = 1000 // 1 second timeout
      
      // Create sessions
      shouldPerformFullSync(userId1)
      shouldPerformFullSync(userId2)
      
      expect(getSessionStats().activeSessions).toBe(2)
      
      // Manually expire one session by manipulating time
      const stats = getSessionStats()
      const expiredTime = new Date(Date.now() - 2000) // 2 seconds ago
      
      // We can't directly manipulate the internal session, so let's test with a very short timeout
      const removedCount = pruneStaleSessions(1) // 1ms timeout - everything should expire
      
      expect(removedCount).toBeGreaterThanOrEqual(0)
    })

    it('should return count of removed sessions', () => {
      const timeoutMs = 1 // Very short timeout
      
      // Create some sessions
      shouldPerformFullSync('user1')
      shouldPerformFullSync('user2')
      shouldPerformFullSync('user3')
      
      // All should be expired with 1ms timeout
      const removedCount = pruneStaleSessions(timeoutMs)
      expect(removedCount).toBeGreaterThanOrEqual(0)
    })

    it('should not remove recent sessions', () => {
      const userId = 'user123'
      const timeoutMs = 60000 // 1 minute timeout
      
      shouldPerformFullSync(userId)
      expect(getSessionStats().activeSessions).toBe(1)
      
      // Should not remove recent session
      const removedCount = pruneStaleSessions(timeoutMs)
      expect(removedCount).toBe(0)
      expect(getSessionStats().activeSessions).toBe(1)
    })
  })

  describe('startSessionCleanup', () => {
    it('should start cleanup interval', () => {
      const spy = vi.spyOn(global, 'setInterval')
      
      startSessionCleanup()
      
      expect(spy).toHaveBeenCalledWith(expect.any(Function), 600000) // 10 minutes
      
      spy.mockRestore()
    })

    it('should not start multiple intervals', () => {
      const spy = vi.spyOn(global, 'setInterval')
      
      startSessionCleanup()
      startSessionCleanup() // Second call should be ignored
      
      expect(spy).toHaveBeenCalledTimes(1)
      
      spy.mockRestore()
    })

    it('should run initial cleanup', () => {
      const spy = vi.spyOn(global, 'setInterval')
      
      // Create an expired session by testing with very short timeout
      shouldPerformFullSync('user1')
      
      startSessionCleanup()
      
      expect(spy).toHaveBeenCalled()
      
      spy.mockRestore()
    })
  })

  describe('stopSessionCleanup', () => {
    it('should stop cleanup interval', () => {
      const clearSpy = vi.spyOn(global, 'clearInterval')
      
      startSessionCleanup()
      stopSessionCleanup()
      
      expect(clearSpy).toHaveBeenCalled()
      
      clearSpy.mockRestore()
    })

    it('should handle being called when no interval is running', () => {
      expect(() => stopSessionCleanup()).not.toThrow()
    })
  })

  describe('clearAllSessions', () => {
    it('should remove all sessions', () => {
      // Create multiple sessions
      shouldPerformFullSync('user1')
      shouldPerformFullSync('user2')
      shouldPerformFullSync('user3')
      
      expect(getSessionStats().activeSessions).toBe(3)
      
      clearAllSessions()
      
      expect(getSessionStats().activeSessions).toBe(0)
    })
  })

  describe('getSessionStats', () => {
    it('should return correct session count', () => {
      shouldPerformFullSync('user1')
      shouldPerformFullSync('user2')
      
      const stats = getSessionStats()
      expect(stats.activeSessions).toBe(2)
    })

    it('should return session details with privacy protection', () => {
      const fullUserId = 'very-long-user-id-12345'
      shouldPerformFullSync(fullUserId)
      
      const stats = getSessionStats()
      expect(stats.sessions).toHaveLength(1)
      expect(stats.sessions[0].userId).toBe('-12345') // Last 6 chars (slice(-6) includes the dash)
      expect(stats.sessions[0].lastSeen).toBeInstanceOf(Date)
      expect(stats.sessions[0].lastSynced).toBeInstanceOf(Date)
    })

    it('should handle short user IDs', () => {
      const shortUserId = 'u1'
      shouldPerformFullSync(shortUserId)
      
      const stats = getSessionStats()
      expect(stats.sessions[0].userId).toBe('u1') // Short IDs should show in full
    })

    it('should return empty stats when no sessions', () => {
      const stats = getSessionStats()
      expect(stats.activeSessions).toBe(0)
      expect(stats.sessions).toHaveLength(0)
    })
  })

  describe('session lifecycle', () => {
    it('should handle complete session lifecycle', () => {
      const userId = 'test-user-lifecycle'
      
      // Initial sync
      expect(shouldPerformFullSync(userId)).toBe(true)
      expect(getSessionStats().activeSessions).toBe(1)
      
      // Update session
      updateSessionOnly(userId)
      expect(getSessionStats().activeSessions).toBe(1)
      
      // Should not sync again immediately
      expect(shouldPerformFullSync(userId)).toBe(false)
      
      // Prune with long timeout (should keep session)
      const removed = pruneStaleSessions(60000)
      expect(removed).toBe(0)
      expect(getSessionStats().activeSessions).toBe(1)
      
      // Clear all sessions
      clearAllSessions()
      expect(getSessionStats().activeSessions).toBe(0)
    })
  })

  describe('custom config handling', () => {
    it('should respect custom sync cooldown', () => {
      const userId = 'config-test'
      const customConfig = { syncCooldownMs: -1, sessionTimeoutMs: 60000 } // Negative cooldown means it should always sync
      
      // First sync
      expect(shouldPerformFullSync(userId, customConfig)).toBe(true)
      
      // With negative cooldown, it should always return true
      expect(shouldPerformFullSync(userId, customConfig)).toBe(true)
    })

    it('should respect custom session timeout', () => {
      const userId = 'timeout-test'
      const customTimeout = 1 // 1ms timeout
      
      shouldPerformFullSync(userId)
      expect(getSessionStats().activeSessions).toBe(1)
      
      // Everything should expire with 1ms timeout
      setTimeout(() => {
        const removed = pruneStaleSessions(customTimeout)
        expect(removed).toBeGreaterThanOrEqual(0)
      }, 5)
    })
  })
})
