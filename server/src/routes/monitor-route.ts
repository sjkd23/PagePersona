/**
 * System Monitoring and Diagnostics Route Handler
 *
 * Provides endpoints for monitoring application health, authentication status,
 * session statistics, and comprehensive system diagnostics. Critical for
 * production monitoring and development debugging.
 *
 * Routes:
 * - GET /health: Basic health check (production-safe)
 * - GET /auth0: Auth0 configuration status (dev/staging only)
 * - GET /sessions: Active session statistics (dev/staging only)
 * - GET /full: Comprehensive system status (dev/staging only)
 */

import { Router } from 'express';
import { getEnvironmentInfo } from '../utils/env-validation';
import { getJwtInfo } from '../middleware/jwt-verification';
import { getSessionStats } from '../utils/session-tracker';

const router = Router();

/**
 * Basic application health check endpoint
 *
 * Provides essential system metrics for load balancers and monitoring
 * systems. Always available regardless of environment configuration.
 *
 * @route GET /health
 * @returns {object} Health status with uptime, memory usage, and system info
 * @access Public
 */
router.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version,
  });
});

// Advanced monitoring endpoints (development and staging environments only)
if (process.env.NODE_ENV !== 'production') {
  /**
   * Auth0 configuration and JWT verification status
   *
   * @route GET /auth0
   * @returns {object} Current Auth0 environment configuration and JWT settings
   * @access Development/staging environments only
   */
  router.get('/auth0', (_req, res) => {
    const envInfo = getEnvironmentInfo();
    const jwtInfo = getJwtInfo();

    res.json({
      environment: envInfo,
      jwt: jwtInfo,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Active session statistics and user tracking
   *
   * @route GET /sessions
   * @returns {object} Current session counts and user activity metrics
   * @access Development/staging environments only
   */
  router.get('/sessions', (_req, res) => {
    const sessionStats = getSessionStats();

    res.json({
      ...sessionStats,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Comprehensive system status and diagnostics
   *
   * Combines health, authentication, session, and migration status
   * information for complete system overview during development.
   *
   * @route GET /full
   * @returns {object} Complete system status including all subsystems
   * @access Development/staging environments only
   */
  router.get('/full', (_req, res) => {
    const envInfo = getEnvironmentInfo();
    const jwtInfo = getJwtInfo();
    const sessionStats = getSessionStats();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version,
        platform: process.platform,
      },
      auth0: {
        environment: envInfo,
        jwt: jwtInfo,
      },
      sessions: sessionStats,
      migration: {
        status: 'complete',
        message: 'All authentication has been migrated to userContext pattern',
      },
    });
  });
}

export default router;
