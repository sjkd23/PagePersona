/**
 * PagePersonAI Express Application Setup
 *
 * This file contains the Express application configuration and middleware setup.
 * It's separated from the main entry point to enable clustering and better
 * testing capabilities.
 */

// Load type declarations for ts-node-dev
import './types/loader';

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import { ensureSafeAuth0Config } from './utils/env-validation';
import { connectToDatabase } from './config/database';
import { errorHandler } from './utils/response-helpers';
import gptRoutes from './routes/gpt-route';
import transformRoutes from './routes/transform-route';
import adminRoutes from './routes/admin-route';
import { HttpStatus } from './constants/http-status';
import userRoutes from './routes/user-route';
import monitorRoutes from './routes/monitor-route';
import debugRoutes from './routes/debug-route';
import { verifyAuth0Token, syncAuth0User } from './middleware/auth0-middleware';
import { trackUsage } from './middleware/usage-middleware';
import { startSessionCleanup } from './utils/session-tracker';
import { redisClient } from './utils/redis-client';
import { logger } from './utils/logger';
import { setupSwagger } from './swagger';
import { createRateLimiter } from './config/rateLimiter';
import { rateLimitConfigs } from './config/rate-limit-configs';

// Validate critical Auth0 configuration on startup
ensureSafeAuth0Config();

// Initialize Express application
const app = express();
app.disable('x-powered-by'); // Security: Hide Express.js version information

// Security headers with Helmet
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", process.env.API_URL || 'http://localhost:3000'],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  }),
);
app.use(
  helmet.hsts({
    maxAge: 15552000, // 180 days in seconds
    includeSubDomains: true,
  }),
);
app.use(helmet.noSniff());
app.use(helmet.frameguard({ action: 'deny' }));
app.use(helmet.referrerPolicy({ policy: 'no-referrer' }));

// Establish database connections
connectToDatabase();

/**
 * Tests Redis connection and sets up graceful fallback to in-memory storage.
 *
 * Redis is used for:
 * - Session storage and management
 * - Rate limiting counters
 * - Caching frequently accessed data
 *
 * If Redis is unavailable, the application continues with in-memory alternatives,
 * though this limits horizontal scaling and persistence across restarts.
 */
const testRedisConnection = async () => {
  try {
    const testKey = 'health:check';
    const testValue = 'pong';

    // Test set and get operations
    const setResult = await redisClient.set(testKey, testValue, 10); // 10 second TTL
    if (setResult) {
      const getValue = await redisClient.get(testKey);
      if (getValue === testValue) {
        logger.info('Redis connected and operational');
        // Clean up test key
        await redisClient.del(testKey);
      } else {
        logger.warn(
          'Redis connection issue - falling back to in-memory storage. Caching and rate limiting will be local to this server instance.',
          {
            issue: 'redis_get_mismatch',
            impact: 'limited_caching_and_scaling',
            fallback: 'in_memory_storage',
          },
        );
      }
    } else {
      logger.warn(
        'Redis not available - falling back to in-memory storage. This limits scaling and session persistence.',
        {
          issue: 'redis_set_failed',
          impact: 'limited_scaling_and_persistence',
          fallback: 'in_memory_storage',
          recommendation: 'check_redis_service',
        },
      );
    }
  } catch (error) {
    logger.warn(
      'Redis not available - falling back to in-memory storage. Caching and rate limiting will not persist across server restarts.',
      {
        error: error instanceof Error ? error.message : 'unknown_error',
        impact: 'no_persistence_across_restarts',
        fallback: 'in_memory_storage',
        recommendation: 'verify_redis_connection',
      },
    );
  }
};

// Test Redis connection
testRedisConnection();

// Initialize session cleanup
startSessionCleanup();

// CORS Configuration
const allowedOrigins: string[] = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0)
  : ['http://localhost:3000', 'http://localhost:5173']; // Default for development

// Middleware
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.options('*', cors({ origin: allowedOrigins, credentials: true }));

// Limit JSON bodies to 50 KB
app.use(express.json({ limit: '50kb' }));

// Limit URL-encoded bodies to 50 KB
app.use(express.urlencoded({ limit: '50kb', extended: true }));

// Response compression with gzip and Brotli support
// This middleware compresses responses larger than 1KB to reduce bandwidth usage
// and improve performance for API responses, especially for large persona lists
// and transformation results.
app.use(
  compression({
    // compress responses larger than 1KB
    threshold: '1kb',
    // compression level (1-9, 6 is default)
    level: 6,
    // enable gzip compression
    filter: (req, res) => {
      // Don't compress responses with this request header
      if (req.headers['x-no-compression']) {
        return false;
      }
      // fallback to standard filter function
      return compression.filter(req, res);
    },
  }),
);

// Setup Swagger documentation
setupSwagger(app);

// Global rate limiting middleware
app.use(createRateLimiter(rateLimitConfigs.free));

// Stricter rate limiting for transform endpoint
app.use('/api/transform', createRateLimiter(rateLimitConfigs.premium));

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Monitor]
 *     responses:
 *       '200':
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 */
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * @openapi
 * /:
 *   get:
 *     summary: Root endpoint - API information
 *     tags: [Monitor]
 *     responses:
 *       '200':
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: PagePersonAI API
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get('/', (_req, res) => {
  res.json({
    message: 'PagePersonAI API',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// Apply rate limiting to all API routes
app.use(createRateLimiter(rateLimitConfigs.free));

// API Routes
app.use('/api/monitor', monitorRoutes);
app.use('/api/transform', createRateLimiter(rateLimitConfigs.premium), transformRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

// Debug routes only available in development
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/debug', debugRoutes);
}

app.use('/api/gpt', verifyAuth0Token, syncAuth0User, trackUsage as any, gptRoutes);

// Error handling middleware
app.use(errorHandler as any);

// Protected route example
app.get('/api/protected', verifyAuth0Token, syncAuth0User, (req, res) => {
  // Use type guard for better type safety
  if (!req.userContext) {
    res.status(HttpStatus.UNAUTHORIZED).json({
      success: false,
      error: 'User context not found',
    });
    return;
  }

  res.json({
    message: 'Authentication successful',
    user: req.userContext.jwtPayload,
  });
});

// 404 handler
app.use('*', (_req, res) => {
  res.status(HttpStatus.NOT_FOUND).json({
    success: false,
    error: 'Route not found',
  });
});

export default app;
