/**
 * PagePersonAI Server Application
 *
 * Main entry point for the PagePersonAI backend API server with clustering support.
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
 * - Multi-process clustering for improved performance
 *
 * @module ServerApp
 */

// Load type declarations for ts-node-dev
import './types/loader';

import dotenv from 'dotenv';
import cluster from 'cluster';
import os from 'os';
import app from './app';
import { validateEnvironment } from './utils/env-validation';
import { logger } from './utils/logger';
import { redisClient } from './utils/redis-client';

// Load environment variables from .env file with production support
dotenv.config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
});

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

// Only use clustering in production, not during development
const useCluster = process.env.NODE_ENV === 'production';

if (useCluster && cluster.isPrimary) {
  const cpuCount = os.cpus().length;
  logger.info(`Master ${process.pid} is running — forking ${cpuCount} workers`);

  for (let i = 0; i < cpuCount; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died (${signal || code}). Starting a new one.`);
    cluster.fork();
  });
} else {
  // Load and validate environment variables
  validateEnvironment();

  // Start the server
  app
    .listen(port, () => {
      logger.info(`Worker ${process.pid} listening on port ${port}`);
      logger.info('Available endpoints:');
      logger.info('  GET  /docs - API Documentation (Swagger UI)');
      logger.info('  GET  /docs.json - OpenAPI Specification');
      logger.info('  GET  /api/health - Health check');
      logger.info('  GET  /api/transform/personas - Available personas');
      logger.info('  POST /api/transform - Transform content from URL');
      logger.info('  POST /api/transform/text - Transform text content directly');
      logger.info('  GET  /api/user/profile - User profile (protected)');
      logger.info('  PUT  /api/user/profile - Update profile (protected)');
      if (process.env.NODE_ENV !== 'production') {
        logger.info('  GET  /api/debug/redis - Redis connectivity test');
      }
    })
    .on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${port} is already in use`);
        logger.error('Try: netstat -ano | findstr :' + port + ' to find the process');
        process.exit(1);
      } else {
        logger.error('Server error:', err);
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
        action: 'forced_exit',
      });
      process.exit(1);
    }
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}
