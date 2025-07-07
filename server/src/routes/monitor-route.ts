// System monitoring and diagnostics route

import { Router } from 'express';
import { getEnvironmentInfo } from '../utils/env-validation';
import { getJwtInfo } from '../middleware/jwt-verification';
import { getSessionStats } from '../utils/session-tracker';

const router = Router();

/**
 * GET /api/monitor/health - Basic health check (always available)
 */
router.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version
  });
});

// Detailed monitoring endpoints (development/staging only)
if (process.env.NODE_ENV !== 'production') {
  /**
   * GET /api/monitor/auth0 - Auth0 configuration status
   */
  router.get('/auth0', (_req, res) => {
    const envInfo = getEnvironmentInfo();
    const jwtInfo = getJwtInfo();
    
    res.json({
      environment: envInfo,
      jwt: jwtInfo,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * GET /api/monitor/sessions - Active session statistics
   */
  router.get('/sessions', (_req, res) => {
    const sessionStats = getSessionStats();
    
    res.json({
      ...sessionStats,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * GET /api/monitor/full - Comprehensive system status
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
        platform: process.platform
      },
      auth0: {
        environment: envInfo,
        jwt: jwtInfo
      },
      sessions: sessionStats,
      migration: {
        status: 'complete',
        message: 'All authentication has been migrated to userContext pattern'
      }
    });
  });
}

export default router;
