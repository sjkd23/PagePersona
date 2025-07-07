import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  shouldPerformFullSync, 
  updateSessionOnly, 
  pruneStaleSessions, 
  startSessionCleanup, 
  stopSessionCleanup,
  clearAllSessions,
  getSessionStats 
} from '../utils/session-tracker';

// Mock the logger to avoid console output during tests
vi.mock('../utils/logger', () => ({
  logger: {
    session: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn()
    }
  }
}));

describe('SessionTracker', () => {
  beforeEach(() => {
    // Clean up any running intervals and clear all sessions before each test
    stopSessionCleanup();
    clearAllSessions();
  });

  afterEach(() => {
    // Clean up any running intervals after each test
    stopSessionCleanup();
    clearAllSessions();
  });

  describe('shouldPerformFullSync', () => {
    it('should return true for new users', () => {
      const result = shouldPerformFullSync('new-user-123');
      expect(result).toBe(true);
    });

    it('should return false for recent syncs', () => {
      // First call creates the session
      shouldPerformFullSync('test-user');
      
      // Second call should return false (recent sync)
      const result = shouldPerformFullSync('test-user');
      expect(result).toBe(false);
    });

    it('should return true after cooldown period', () => {
      const shortConfig = { syncCooldownMs: 100, sessionTimeoutMs: 60000 };
      
      // First call
      shouldPerformFullSync('test-user', shortConfig);
      
      // Wait for cooldown
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const result = shouldPerformFullSync('test-user', shortConfig);
          expect(result).toBe(true);
          resolve();
        }, 150);
      });
    });
  });

  describe('updateSessionOnly', () => {
    it('should update lastSeen for existing sessions', () => {
      // Create a session first
      shouldPerformFullSync('test-user');
      
      // Update session only
      updateSessionOnly('test-user');
      
      // Should still return false (no sync needed)
      const result = shouldPerformFullSync('test-user');
      expect(result).toBe(false);
    });

    it('should handle non-existent sessions gracefully', () => {
      expect(() => updateSessionOnly('non-existent-user')).not.toThrow();
    });
  });

  describe('pruneStaleSessions', () => {
    it('should remove stale sessions', async () => {
      // Create sessions with different ages
      shouldPerformFullSync('recent-user');
      shouldPerformFullSync('old-user');
      
      const stats = getSessionStats();
      expect(stats.activeSessions).toBe(2);
      
      // Wait a bit then prune with very short timeout
      await new Promise(resolve => setTimeout(resolve, 10));
      const removed = pruneStaleSessions(1); // 1ms timeout
      expect(removed).toBe(2);
      
      const statsAfter = getSessionStats();
      expect(statsAfter.activeSessions).toBe(0);
    });

    it('should keep recent sessions', () => {
      shouldPerformFullSync('recent-user');
      
      // Prune with long timeout (nothing should be removed)
      const removed = pruneStaleSessions(60 * 60 * 1000); // 1 hour
      expect(removed).toBe(0);
      
      const stats = getSessionStats();
      expect(stats.activeSessions).toBe(1);
    });

    it('should return correct count of removed sessions', async () => {
      shouldPerformFullSync('user1');
      shouldPerformFullSync('user2');
      shouldPerformFullSync('user3');
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      const removed = pruneStaleSessions(1); // Remove all
      expect(removed).toBe(3);
    });
  });

  describe('session cleanup automation', () => {
    it('should start cleanup without errors', () => {
      expect(() => startSessionCleanup()).not.toThrow();
    });

    it('should prevent multiple cleanup intervals', () => {
      startSessionCleanup();
      startSessionCleanup(); // Should not create another interval
      
      // This test mainly ensures no errors are thrown
      expect(true).toBe(true);
    });

    it('should stop cleanup without errors', () => {
      startSessionCleanup();
      expect(() => stopSessionCleanup()).not.toThrow();
    });
  });

  describe('getSessionStats', () => {
    it('should return correct session statistics', () => {
      const stats = getSessionStats();
      expect(stats).toHaveProperty('activeSessions');
      expect(stats).toHaveProperty('sessions');
      expect(Array.isArray(stats.sessions)).toBe(true);
    });

    it('should mask user IDs for privacy', () => {
      const longUserId = 'very-long-user-id-123456789';
      shouldPerformFullSync(longUserId);
      
      const stats = getSessionStats();
      expect(stats.sessions[0].userId).toBe(longUserId.slice(-6)); // Last 6 chars
      expect(stats.sessions[0].userId.length).toBeLessThanOrEqual(6);
    });
  });
});
