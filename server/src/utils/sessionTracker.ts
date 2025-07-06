// Session tracking to reduce redundant database writes

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
  sessionTimeoutMs: 30 * 60 * 1000 // 30 minute session timeout
};

/**
 * Check if user needs full sync or just session update
 */
export function shouldPerformFullSync(userId: string, config = defaultConfig): boolean {
  const now = new Date();
  const session = userSessions.get(userId);
  
  // Clean up expired sessions periodically
  if (Math.random() < 0.01) { // 1% chance
    cleanExpiredSessions(config.sessionTimeoutMs);
  }
  
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
 */
function cleanExpiredSessions(timeoutMs: number): void {
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
    console.log(`🧹 Cleaned up ${expiredUsers.length} expired user sessions`);
  }
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
