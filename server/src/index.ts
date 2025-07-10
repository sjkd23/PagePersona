/**
 * PagePersonAI Server Application
 * 
 * Main entry point for the PagePersonAI backend API server.
 * This Express.js application provides content transformation services using AI personas,
 * user authentication via Auth0, and various supporting features like rate limiting,
 * usage tracking, and caching.
 * 
 * Key Features:
 * - AI-powered content transformation with multiple personas
 * - Auth0 integration for secure user authentication
 * - Redis-based caching and session management
 * - MongoDB for persistent data storage
 * - Rate limiting and usage tracking
 * - Comprehensive error handling and logging
 * 
 * @module ServerApp
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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
import trackUsage from './middleware/usage-middleware';
import { startSessionCleanup } from './utils/session-tracker';
import { redisClient } from './utils/redis-client';
import { logger } from './utils/logger';

// Load environment variables from .env file
dotenv.config();

// Validate critical Auth0 configuration on startup
ensureSafeAuth0Config();

// Initialize Express application
const app = express();
app.disable('x-powered-by'); // Security: Hide Express.js version information

const PORT = process.env.PORT || 5000;

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
        logger.warn('Redis connection issue - falling back to in-memory storage. Caching and rate limiting will be local to this server instance.', {
          issue: 'redis_get_mismatch',
          impact: 'limited_caching_and_scaling',
          fallback: 'in_memory_storage'
        });
      }
    } else {
      logger.warn('Redis not available - falling back to in-memory storage. This limits scaling and session persistence.', {
        issue: 'redis_set_failed',
        impact: 'limited_scaling_and_persistence',
        fallback: 'in_memory_storage',
        recommendation: 'check_redis_service'
      });
    }
  } catch (error) {
    logger.warn('Redis not available - falling back to in-memory storage. Caching and rate limiting will not persist across server restarts.', {
      error: error instanceof Error ? error.message : 'unknown_error',
      impact: 'no_persistence_across_restarts',
      fallback: 'in_memory_storage',
      recommendation: 'verify_redis_connection'
    });
  }
};

// Test Redis connection
testRedisConnection();

// Initialize session cleanup
startSessionCleanup();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoints
app.get('/', (_req, res) => {
    res.json({ 
        message: 'PagePersonAI API',
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/health', (_req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API Routes
app.use('/api/monitor', monitorRoutes);
app.use('/api/transform', transformRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/debug', debugRoutes);

app.use('/api/gpt', verifyAuth0Token, syncAuth0User, trackUsage, gptRoutes);

// Error handling middleware
app.use(errorHandler);

// Protected route example
app.get('/api/protected', verifyAuth0Token, syncAuth0User, (req, res) => {
    res.json({ 
        message: 'Authentication successful',
        user: req.user
    });
});

// 404 handler
app.use('*', (_req, res) => {
    res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        error: 'Route not found'
    });
});

// Start server
app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on http://localhost:${PORT}`);
    // eslint-disable-next-line no-console
    console.log('Available endpoints:');
    // eslint-disable-next-line no-console
    console.log('  GET  /api/health - Health check');
    // eslint-disable-next-line no-console
    console.log('  GET  /api/transform/personas - Available personas');
    // eslint-disable-next-line no-console
    console.log('  POST /api/transform - Transform content from URL');
    // eslint-disable-next-line no-console
    console.log('  POST /api/transform/text - Transform text content directly');
    // eslint-disable-next-line no-console
    console.log('  GET  /api/user/profile - User profile (protected)');
    // eslint-disable-next-line no-console
    console.log('  PUT  /api/user/profile - Update profile (protected)');
    // eslint-disable-next-line no-console
    console.log('  GET  /api/debug/redis - Redis connectivity test');
}).on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
        // eslint-disable-next-line no-console
        console.error(`Port ${PORT} is already in use`);
        // eslint-disable-next-line no-console
        console.error('Try: netstat -ano | findstr :' + PORT + ' to find the process');
        process.exit(1);
    } else {
        // eslint-disable-next-line no-console
        console.error('Server error:', err);
        process.exit(1);
    }
});

// Graceful shutdown handlers
const gracefulShutdown = async (signal: string) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);
    
    try {
        // Disconnect from Redis
        await redisClient.disconnect();
        logger.info('Redis connection closed successfully');
        
        // Add any other cleanup here (database, etc.)
        logger.info('Graceful shutdown completed');
        process.exit(0);
    } catch (error) {
        logger.error('Error during graceful shutdown', error, {
            signal,
            action: 'forced_exit'
        });
        process.exit(1);
    }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
