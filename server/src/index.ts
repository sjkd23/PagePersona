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

import dotenv from 'dotenv';
import cluster from 'cluster';
import os from 'os';
import { validateEnv } from './utils/env-validation';
import createServer from './app';

// Load env once, silently
dotenv.config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
  debug: false,
  override: false,
});

if (cluster.isPrimary) {
  validateEnv(); // single env check
  const cpus = os.cpus().length;
  for (let i = 0; i < cpus; i++) cluster.fork();

  cluster.on('exit', (worker, code, signal) => {
    console.warn(`Worker ${worker.process.pid} died (${signal || code}). Starting a new one.`);
    cluster.fork();
  });
} else {
  createServer(); // start express app
}
