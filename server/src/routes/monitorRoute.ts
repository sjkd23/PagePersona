// System monitoring and diagnostics route

import { Router } from 'express';
import { getEnvironmentInfo } from '../utils/envValidation';
import { getJwtInfo } from '../middleware/jwtVerification';
import { getSessionStats } from '../utils/sessionTracker';
import { getMigrationStats } from '../middleware/migrationTracker';

const router = Router();

/**
 * GET /api/monitor/health - Basic health check
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
 * GET /api/monitor/migration - User context migration progress
 */
router.get('/migration', (_req, res) => {
  const migrationStats = getMigrationStats();
  
  res.json({
    ...migrationStats,
    timestamp: new Date().toISOString(),
    advice: migrationStats.legacyUsage > 0 ? [
      "Replace 'req.user' with 'req.userContext!.mongoUser'",
      "Replace 'req.auth0User' with 'req.userContext!.auth0User'",
      "Replace 'req.userId' with 'req.userContext!.userId'",
      "Use 'getUserContext(req)' for safe access during migration"
    ] : ["✅ All requests using new userContext pattern!"]
  });
});

/**
 * GET /api/monitor/full - Comprehensive system status
 */
router.get('/full', (_req, res) => {
  const envInfo = getEnvironmentInfo();
  const jwtInfo = getJwtInfo();
  const sessionStats = getSessionStats();
  const migrationStats = getMigrationStats();
  
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
    migration: migrationStats
  });
});

export default router;
