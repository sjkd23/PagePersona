// Development middleware to track migration from legacy user fields to userContext

import { Request, Response, NextFunction } from 'express';
import { validateUserContextConsistency, hasUserContext } from '../utils/migrationHelpers';

interface MigrationStats {
  totalRequests: number;
  userContextUsage: number;
  legacyUsage: number;
  inconsistencies: number;
  routes: Map<string, { total: number; userContext: number; legacy: number }>;
}

const migrationStats: MigrationStats = {
  totalRequests: 0,
  userContextUsage: 0,
  legacyUsage: 0,
  inconsistencies: 0,
  routes: new Map()
};

/**
 * Development-only middleware to track userContext migration progress
 * Only active in development environment
 */
export function trackMigrationProgress(req: Request, res: Response, next: NextFunction): void {
  // Only run in development
  if (process.env.NODE_ENV === 'production') {
    next();
    return;
  }

  // Skip non-authenticated routes
  if (!req.user && !req.userContext) {
    next();
    return;
  }

  migrationStats.totalRequests++;
  
  const route = `${req.method} ${req.route?.path || req.path}`;
  const routeStats = migrationStats.routes.get(route) || { total: 0, userContext: 0, legacy: 0 };
  routeStats.total++;

  // Check usage pattern
  if (hasUserContext(req)) {
    migrationStats.userContextUsage++;
    routeStats.userContext++;
  } else if (req.user || req.auth0User || req.userId) {
    migrationStats.legacyUsage++;
    routeStats.legacy++;
  }

  // Check for inconsistencies
  const validation = validateUserContextConsistency(req);
  if (!validation.isConsistent) {
    migrationStats.inconsistencies++;
    console.warn(`⚠️  User context inconsistency on ${route}:`, validation.issues);
  }

  migrationStats.routes.set(route, routeStats);

  // Log progress periodically (every 10 requests)
  if (migrationStats.totalRequests % 10 === 0) {
    logMigrationProgress();
  }

  next();
}

/**
 * Log current migration progress
 */
export function logMigrationProgress(): void {
  const { totalRequests, userContextUsage, legacyUsage, inconsistencies } = migrationStats;
  
  if (totalRequests === 0) return;

  const userContextPercentage = ((userContextUsage / totalRequests) * 100).toFixed(1);
  const legacyPercentage = ((legacyUsage / totalRequests) * 100).toFixed(1);

  console.log(`\n📊 User Context Migration Progress:`);
  console.log(`   Total Requests: ${totalRequests}`);
  console.log(`   Using userContext: ${userContextUsage} (${userContextPercentage}%)`);
  console.log(`   Using legacy fields: ${legacyUsage} (${legacyPercentage}%)`);
  console.log(`   Inconsistencies: ${inconsistencies}`);

  if (migrationStats.routes.size > 0) {
    console.log(`\n📍 Route breakdown:`);
    for (const [route, stats] of migrationStats.routes.entries()) {
      const contextPct = ((stats.userContext / stats.total) * 100).toFixed(0);
      console.log(`   ${route}: ${stats.userContext}/${stats.total} (${contextPct}%) using userContext`);
    }
  }

  // Migration advice
  if (legacyUsage > 0) {
    console.log(`\n💡 Migration tips:`);
    console.log(`   - Replace 'req.user' with 'req.userContext!.mongoUser'`);
    console.log(`   - Replace 'req.auth0User' with 'req.userContext!.auth0User'`);
    console.log(`   - Replace 'req.userId' with 'req.userContext!.userId'`);
    console.log(`   - Use 'getUserContext(req)' for safe access during migration`);
  }
}

/**
 * Get current migration statistics
 */
export function getMigrationStats() {
  return {
    ...migrationStats,
    routes: Object.fromEntries(migrationStats.routes)
  };
}

/**
 * Reset migration statistics (useful for testing)
 */
export function resetMigrationStats(): void {
  migrationStats.totalRequests = 0;
  migrationStats.userContextUsage = 0;
  migrationStats.legacyUsage = 0;
  migrationStats.inconsistencies = 0;
  migrationStats.routes.clear();
}
