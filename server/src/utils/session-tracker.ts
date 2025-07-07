// Session tracking to reduce redundant database writes

import { logger } from './logger';

// Simple in-memory session tracker (use Redis in production)
const userSessions = new Map<string, {
  lastSeen: Date;
  lastSynced: Date;
}>();

interface SessionConfig {
  syncCooldownMs: number; // Minimum time between full syncs
  sessionTimeoutMs: number; // Session expiry time
}

const defaultConfig: SessionConfig = {
  syncCooldownMs: 5 * 60 * 1000, // 5 minutes between full syncs
  sessionTimeoutMs: 60 * 60 * 1000 // 1 hour session timeout (was 30 minutes)
};

// Track cleanup interval to prevent multiple intervals in tests
let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Check if user needs full sync or just session update
 */
export function shouldPerformFullSync(userId: string, config = defaultConfig): boolean {
  const now = new Date();
  const session = userSessions.get(userId);
  
  if (!session) {
    // First time seeing this user - definitely sync
    userSessions.set(userId, {
      lastSeen: now,
      lastSynced: now
    });
    return true;
  }
  
  // Update last seen time
  session.lastSeen = now;
  
  // Check if enough time has passed for full sync
  const timeSinceLastSync = now.getTime() - session.lastSynced.getTime();
  
  if (timeSinceLastSync > config.syncCooldownMs) {
    session.lastSynced = now;
    return true;
  }
  
  // Recent sync - skip full sync but still update lastLoginAt if needed
  return false;
}

/**
 * Update only session-related fields (lightweight)
 */
export function updateSessionOnly(userId: string): void {
  const session = userSessions.get(userId);
  if (session) {
    session.lastSeen = new Date();
  }
}

/**
 * Clean up expired sessions to prevent memory leaks
 * @param timeoutMs - Session timeout in milliseconds (defaults to config value)
 * @returns Number of sessions removed
 */
export function pruneStaleSessions(timeoutMs: number = defaultConfig.sessionTimeoutMs): number {
  const now = new Date();
  const expiredUsers: string[] = [];
  
  for (const [userId, session] of userSessions.entries()) {
    const timeSinceLastSeen = now.getTime() - session.lastSeen.getTime();
    if (timeSinceLastSeen > timeoutMs) {
      expiredUsers.push(userId);
    }
  }
  
  for (const userId of expiredUsers) {
    userSessions.delete(userId);
  }
  
  if (expiredUsers.length > 0) {
    logger.session.info(`Cleaned up ${expiredUsers.length} expired user sessions`, {
      removedSessions: expiredUsers.length,
      activeSessions: userSessions.size,
      sessionTimeoutHours: timeoutMs / (60 * 60 * 1000)
    });
  }
  
  return expiredUsers.length;
}

/**
 * Start automatic session cleanup
 * Runs every 10 minutes to remove stale sessions (older than 1 hour)
 */
export function startSessionCleanup(): void {
  // Prevent multiple cleanup intervals
  if (cleanupInterval) {
    logger.session.warn('Session cleanup is already running, skipping initialization');
    return;
  }
  
  const cleanupIntervalMs = 10 * 60 * 1000; // 10 minutes
  
  logger.session.info('Starting automatic session cleanup', {
    cleanupIntervalMinutes: cleanupIntervalMs / (60 * 1000),
    sessionTimeoutHours: defaultConfig.sessionTimeoutMs / (60 * 60 * 1000)
  });
  
  // Run cleanup immediately on startup
  pruneStaleSessions();
  
  // Set up periodic cleanup
  cleanupInterval = setInterval(() => {
    pruneStaleSessions();
  }, cleanupIntervalMs);
}

/**
 * Stop automatic session cleanup (useful for tests)
 */
export function stopSessionCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    logger.session.info('Stopped automatic session cleanup');
  }
}

/**
 * Clear all sessions (for testing purposes only)
 */
export function clearAllSessions(): void {
  userSessions.clear();
}

/**
 * Clean up expired sessions to prevent memory leaks
 * @deprecated Use pruneStaleSessions() instead
 */
function cleanExpiredSessions(timeoutMs: number): void {
  pruneStaleSessions(timeoutMs);
}

/**
 * Get session statistics for monitoring
 */
export function getSessionStats() {
  return {
    activeSessions: userSessions.size,
    sessions: Array.from(userSessions.entries()).map(([userId, session]) => ({
      userId: userId.slice(-6), // Only show last 6 chars for privacy
      lastSeen: session.lastSeen,
      lastSynced: session.lastSynced
    }))
  };
}
