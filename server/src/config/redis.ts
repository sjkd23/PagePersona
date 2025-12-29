// This file provides backward compatibility for the old Redis interface
// while using the centralized redis-client from utils/redis-client.ts
import redisClient from "../utils/redis-client";

export { redisClient };

export const getRedisClient = () => {
  // Check if Redis is disabled or URL not configured
  if (process.env.REDIS_DISABLED === "true" || !process.env.REDIS_URL) {
    return null;
  }
  return redisClient;
};

export const getRedisClientAsync = async () => {
  // Check if Redis is disabled or URL not configured
  if (process.env.REDIS_DISABLED === "true" || !process.env.REDIS_URL) {
    return null;
  }
  return redisClient;
};

export const isRedisAvailable = () => {
  // Return false if Redis is explicitly disabled or URL not configured
  if (process.env.REDIS_DISABLED === "true" || !process.env.REDIS_URL) {
    return false;
  }
  return true;
};

export const disconnectRedis = async () => {
  await redisClient.disconnect();
};

export const safeRedisOperation = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  fallback: T,
): Promise<T> => {
  try {
    // Check if Redis is available first
    if (!isRedisAvailable()) {
      return fallback;
    }
    return await operation();
  } catch (error) {
    console.warn(`Redis operation ${operationName} failed:`, error);
    return fallback;
  }
};
