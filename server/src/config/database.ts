/**
 * Database Configuration and Connection Management
 *
 * This module handles MongoDB database connections using Mongoose ODM.
 * It provides connection establishment, event handling, and graceful shutdown
 * functionality for the PagePersonAI application.
 *
 * Features:
 * - Automatic MongoDB connection with connection string from environment
 * - Connection event monitoring (errors, disconnections)
 * - Graceful shutdown handling on application termination
 * - Connection lifecycle management
 * - Development and production environment support
 *
 * Environment Variables:
 * - MONGODB_URI: MongoDB connection string (defaults to localhost for development)
 */

import mongoose from 'mongoose';
import { logger } from '../utils/logger';

// MongoDB connection string with development fallback
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pagepersona';

/**
 * Establish connection to MongoDB database
 *
 * This function connects to MongoDB using Mongoose and sets up proper
 * event handlers for connection monitoring and graceful shutdown.
 *
 * Connection Features:
 * - Automatic retry and connection management
 * - Error handling and logging
 * - Process termination signal handling
 * - Connection state monitoring
 *
 * @throws Will exit the process if initial connection fails
 */
export const connectToDatabase = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(MONGODB_URI);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Set up connection event handlers for monitoring
    mongoose.connection.on('error', (err: Error) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.info('MongoDB disconnected');
    });

    // Handle graceful shutdown on process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};

/**
 * Gracefully disconnect from MongoDB database
 *
 * This function properly closes the MongoDB connection and handles
 * any errors that occur during the disconnection process.
 *
 * Used for:
 * - Application shutdown procedures
 * - Test cleanup
 * - Connection reset scenarios
 */
export const disconnectFromDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }
};

/**
 * Default export of configured mongoose instance
 */
export default mongoose;
