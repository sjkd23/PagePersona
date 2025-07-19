import { createClient, type RedisClientType } from 'redis';

const baseRedisClient: RedisClientType = createClient({
  url: process.env.REDIS_URL,
});

// Connect immediately and log success or failure
baseRedisClient
  .connect()
  .then(() => console.log('✅ Redis client connected'))
  .catch((err) => console.error('❌ Redis connection error:', err));

// Create a wrapper that maintains backward compatibility and proper typing
const redisClient = {
  // Expose the native Redis client methods with proper typing
  get: baseRedisClient.get.bind(baseRedisClient),
  set: baseRedisClient.set.bind(baseRedisClient),
  setEx: baseRedisClient.setEx.bind(baseRedisClient),
  del: baseRedisClient.del.bind(baseRedisClient),

  // Maintain backward compatibility for disconnect (return Promise)
  async disconnect() {
    return await baseRedisClient.disconnect();
  },

  // Expose other methods and properties for compatibility
  isReady: baseRedisClient.isReady,
  isOpen: baseRedisClient.isOpen,
  connect: baseRedisClient.connect.bind(baseRedisClient),
  sendCommand: baseRedisClient.sendCommand.bind(baseRedisClient),
};

export default redisClient;
