import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

class RedisManager {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;
  private connectionAttempted: boolean = false;
  private connectionFailed: boolean = false;

  constructor() {
    this.client = null;
  }

  private async initializeClient(): Promise<void> {
    if (this.connectionAttempted) {
      return;
    }

    this.connectionAttempted = true;

    // Check if Redis is disabled
    if (process.env.REDIS_DISABLED === 'true') {
      logger.info('Redis is disabled by environment variable');
      this.connectionFailed = true;
      return;
    }

    // Check if Redis URL is provided
    if (!process.env.REDIS_URL) {
      logger.info('Redis URL not provided, using in-memory fallback');
      this.connectionFailed = true;
      return;
    }

    try {
      this.client = createClient({
        url: process.env.REDIS_URL,
      });

      this.client.on('error', (err) => {
        logger.error('Redis client error:', err);
        this.isConnected = false;
        this.connectionFailed = true;
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.isConnected = true;
        this.connectionFailed = false;
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Failed to initialize Redis client:', error);
      this.connectionFailed = true;
      this.client = null;
    }
  }

  public getClient(): RedisClientType | null {
    // For sync usage, return client directly if available
    if (this.connectionFailed || !this.client) {
      return null;
    }
    return this.client;
  }

  public async getClientAsync(): Promise<RedisClientType | null> {
    if (!this.connectionAttempted) {
      await this.initializeClient();
    }
    return this.client;
  }

  public isAvailable(): boolean {
    return this.isConnected && !this.connectionFailed;
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
      this.isConnected = false;
    }
  }
}

const redisManager = new RedisManager();

export const getRedisClient = () => redisManager.getClient();
export const getRedisClientAsync = () => redisManager.getClientAsync();
export const isRedisAvailable = () => redisManager.isAvailable();
export const disconnectRedis = () => redisManager.disconnect();

export const safeRedisOperation = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  fallback: T,
): Promise<T> => {
  try {
    if (!redisManager.isAvailable()) {
      return fallback;
    }
    return await operation();
  } catch (error) {
    logger.error(`Redis operation ${operationName} failed:`, error);
    return fallback;
  }
};
