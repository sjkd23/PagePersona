import { createClient } from 'redis';

const baseRedisClient = createClient({
  url: process.env.REDIS_URL,
});

// connect immediately
baseRedisClient.connect().catch((err) => {
  console.warn('⚠️ Redis connect failed:', err.message);
});

// Create a wrapper that handles unavailability gracefully
const redisClient = {
  async get(key: string) {
    try {
      const result = await baseRedisClient.get(key);
      return result;
    } catch (error) {
      console.warn('Redis get operation failed:', error);
      return null;
    }
  },

  async set(key: string, value: string) {
    try {
      const result = await baseRedisClient.set(key, value);
      return result;
    } catch (error) {
      console.warn('Redis set operation failed:', error);
      return false;
    }
  },

  async setEx(key: string, seconds: number, value: string) {
    try {
      const result = await baseRedisClient.setEx(key, seconds, value);
      return result;
    } catch (error) {
      console.warn('Redis setEx operation failed:', error);
      return false;
    }
  },

  async del(key: string) {
    try {
      const result = await baseRedisClient.del(key);
      return result;
    } catch (error) {
      console.warn('Redis del operation failed:', error);
      return false;
    }
  },

  async disconnect() {
    try {
      const result = await baseRedisClient.disconnect();
      return result;
    } catch (error) {
      console.warn('Redis disconnect operation failed:', error);
      return undefined;
    }
  },

  // Expose other methods for compatibility
  isReady: baseRedisClient.isReady,
  isOpen: baseRedisClient.isOpen,
  connect: baseRedisClient.connect.bind(baseRedisClient),
};

export default redisClient;
