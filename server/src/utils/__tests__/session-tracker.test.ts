import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  shouldPerformFullSync,
  updateSessionOnly,
  pruneStaleSessions,
  startSessionCleanup,
  stopSessionCleanup,
  clearAllSessions,
  getSessionStats,
} from '../session-tracker';
import { logger } from '../logger';

// Mock logger
vi.mock('../logger', () => ({
  logger: {
    session: {
      info: vi.fn(),
      warn: vi.fn(),
    },
  },
}));

describe('session-tracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAllSessions();
    stopSessionCleanup();
  });

  afterEach(() => {
    clearAllSessions();
    stopSessionCleanup();
  });

  describe('shouldPerformFullSync', () => {
    it('should return true for first-time user', () => {
      const userId = 'user-123';
      const result = shouldPerformFullSync(userId);

      expect(result).toBe(true);
    });

    it('should return false for recent sync within cooldown', () => {
      const userId = 'user-123';
      const config = {
        syncCooldownMs: 5 * 60 * 1000,
        sessionTimeoutMs: 60 * 60 * 1000,
      };

      // First call should sync
      expect(shouldPerformFullSync(userId, config)).toBe(true);

      // Immediate second call should not sync
      expect(shouldPerformFullSync(userId, config)).toBe(false);
    });

    it('should return true after cooldown period', () => {
      const userId = 'user-123';
      const config = { syncCooldownMs: 100, sessionTimeoutMs: 60 * 60 * 1000 }; // 100ms cooldown

      // First sync
      expect(shouldPerformFullSync(userId, config)).toBe(true);

      // Wait for cooldown to pass
      vi.useFakeTimers();
      vi.advanceTimersByTime(150); // More than 100ms

      // Should sync again
      expect(shouldPerformFullSync(userId, config)).toBe(true);

      vi.useRealTimers();
    });

    it('should always sync when cooldown is negative', () => {
      const userId = 'user-123';
      const config = { syncCooldownMs: -1, sessionTimeoutMs: 60 * 60 * 1000 };

      expect(shouldPerformFullSync(userId, config)).toBe(true);
      expect(shouldPerformFullSync(userId, config)).toBe(true);
      expect(shouldPerformFullSync(userId, config)).toBe(true);
    });

    it('should update lastSeen time on each call', () => {
      const userId = 'user-123';

      // Make first call
      shouldPerformFullSync(userId);

      const stats1 = getSessionStats();
      const initialLastSeen = stats1.sessions[0].lastSeen;

      // Wait a bit and make second call
      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);

      shouldPerformFullSync(userId);

      const stats2 = getSessionStats();
      const updatedLastSeen = stats2.sessions[0].lastSeen;

      expect(updatedLastSeen.getTime()).toBeGreaterThan(initialLastSeen.getTime());

      vi.useRealTimers();
    });
  });

  describe('updateSessionOnly', () => {
    it('should update lastSeen for existing session', () => {
      const userId = 'user-123';

      // Create session first
      shouldPerformFullSync(userId);
      const stats1 = getSessionStats();
      const initialLastSeen = stats1.sessions[0].lastSeen;

      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);

      updateSessionOnly(userId);

      const stats2 = getSessionStats();
      const updatedLastSeen = stats2.sessions[0].lastSeen;

      expect(updatedLastSeen.getTime()).toBeGreaterThan(initialLastSeen.getTime());

      vi.useRealTimers();
    });

    it('should do nothing for non-existent session', () => {
      expect(() => updateSessionOnly('non-existent-user')).not.toThrow();

      const stats = getSessionStats();
      expect(stats.activeSessions).toBe(0);
    });
  });

  describe('pruneStaleSessions', () => {
    it('should remove expired sessions', () => {
      const userId1 = 'user-1';
      const userId2 = 'user-2';

      // Create sessions
      shouldPerformFullSync(userId1);
      shouldPerformFullSync(userId2);

      expect(getSessionStats().activeSessions).toBe(2);

      // Advance time to expire sessions
      vi.useFakeTimers();
      vi.advanceTimersByTime(2 * 60 * 60 * 1000); // 2 hours (more than 1 hour timeout)

      const removedCount = pruneStaleSessions(60 * 60 * 1000); // 1 hour timeout

      expect(removedCount).toBe(2);
      expect(getSessionStats().activeSessions).toBe(0);
      expect(logger.session.info).toHaveBeenCalledWith(
        'Cleaned up 2 expired user sessions',
        expect.objectContaining({
          removedSessions: 2,
          activeSessions: 0,
        }),
      );

      vi.useRealTimers();
    });

    it('should not remove active sessions', () => {
      const userId = 'user-123';

      shouldPerformFullSync(userId);
      expect(getSessionStats().activeSessions).toBe(1);

      const removedCount = pruneStaleSessions(60 * 60 * 1000); // 1 hour timeout

      expect(removedCount).toBe(0);
      expect(getSessionStats().activeSessions).toBe(1);
    });

    it('should use custom timeout', () => {
      const userId = 'user-123';

      shouldPerformFullSync(userId);

      vi.useFakeTimers();
      vi.advanceTimersByTime(500); // 500ms

      const removedCount = pruneStaleSessions(100); // 100ms timeout

      expect(removedCount).toBe(1);
      expect(getSessionStats().activeSessions).toBe(0);

      vi.useRealTimers();
    });
  });

  describe('session cleanup automation', () => {
    it('should start automatic cleanup', () => {
      vi.useFakeTimers();

      startSessionCleanup();

      expect(logger.session.info).toHaveBeenCalledWith(
        'Starting automatic session cleanup',
        expect.objectContaining({
          cleanupIntervalMinutes: 10,
          sessionTimeoutHours: 1,
        }),
      );

      vi.useRealTimers();
    });

    it('should prevent multiple cleanup intervals', () => {
      startSessionCleanup();
      startSessionCleanup(); // Try to start again

      expect(logger.session.warn).toHaveBeenCalledWith(
        'Session cleanup is already running, skipping initialization',
      );
    });

    it('should stop cleanup', () => {
      startSessionCleanup();
      stopSessionCleanup();

      expect(logger.session.info).toHaveBeenCalledWith('Stopped automatic session cleanup');
    });

    it('should handle stopping when not running', () => {
      expect(() => stopSessionCleanup()).not.toThrow();
    });
  });

  describe('getSessionStats', () => {
    it('should return empty stats when no sessions', () => {
      const stats = getSessionStats();

      expect(stats).toEqual({
        activeSessions: 0,
        sessions: [],
      });
    });

    it('should return session stats with privacy protection', () => {
      const userId = 'user-very-long-id-123456789';

      shouldPerformFullSync(userId);

      const stats = getSessionStats();

      expect(stats.activeSessions).toBe(1);
      expect(stats.sessions).toHaveLength(1);
      expect(stats.sessions[0].userId).toBe('456789'); // Last 6 chars for privacy
      expect(stats.sessions[0].lastSeen).toBeInstanceOf(Date);
      expect(stats.sessions[0].lastSynced).toBeInstanceOf(Date);
    });

    it('should handle short user IDs', () => {
      const userId = 'usr1';

      shouldPerformFullSync(userId);

      const stats = getSessionStats();

      expect(stats.sessions[0].userId).toBe('usr1'); // Entire ID when less than 6 chars
    });
  });

  describe('clearAllSessions', () => {
    it('should clear all sessions', () => {
      shouldPerformFullSync('user-1');
      shouldPerformFullSync('user-2');

      expect(getSessionStats().activeSessions).toBe(2);

      clearAllSessions();

      expect(getSessionStats().activeSessions).toBe(0);
    });
  });
});
