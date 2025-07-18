import { createClient } from 'redis';

const client = createClient({
  url: process.env.REDIS_URL,
});

let connectionFailed = false;
let warned = false;

client.on('error', (err) => {
  if (!warned) {
    console.warn('⚠️ Redis error—falling back to memory store:', err.message);
    warned = true;
  }
  connectionFailed = true;
});

client.on('connect', () => {
  console.info('✅ Connected to Redis');
  connectionFailed = false;
});

client.connect().catch((err) => {
  console.warn('⚠️ Redis connect failed:', err.message);
  connectionFailed = true;
});

// Backward compatibility wrapper
export const redisClient = {
  getClient() {
    return connectionFailed ? null : client;
  },

  async get(key: string): Promise<string | null> {
    if (connectionFailed) return null;

    try {
      return await client.get(key);
    } catch (error) {
      if (!warned) {
        console.warn(
          '⚠️ Redis GET error:',
          error instanceof Error ? error.message : 'Unknown error',
        );
        warned = true;
      }
      connectionFailed = true;
      return null;
    }
  },

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    if (connectionFailed) return false;

    try {
      if (ttlSeconds) {
        await client.setEx(key, ttlSeconds, value);
      } else {
        await client.set(key, value);
      }
      return true;
    } catch (error) {
      if (!warned) {
        console.warn(
          '⚠️ Redis SET error:',
          error instanceof Error ? error.message : 'Unknown error',
        );
        warned = true;
      }
      connectionFailed = true;
      return false;
    }
  },

  async del(key: string): Promise<boolean> {
    if (connectionFailed) return false;

    try {
      await client.del(key);
      return true;
    } catch (error) {
      if (!warned) {
        console.warn(
          '⚠️ Redis DEL error:',
          error instanceof Error ? error.message : 'Unknown error',
        );
        warned = true;
      }
      connectionFailed = true;
      return false;
    }
  },

  async disconnect(): Promise<void> {
    try {
      await client.disconnect();
    } catch (error) {
      console.warn(
        'Error disconnecting Redis:',
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  },
};

export default client;
