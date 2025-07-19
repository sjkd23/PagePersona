/**
 * PagePersonAI Server Application
 *
 * Main entry point for the PagePersonAI backend API server.
 */

import dotenv from 'dotenv';
import createServer from './app';

// Load environment variables once
dotenv.config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
  debug: false,
  override: false,
});

// Start Express server (binds to process.env.PORT)
createServer();
