import { createClient } from 'redis';

const client = createClient({ url: process.env.REDIS_URL });
let warned = false;

client.on('error', (err) => {
  if (!warned) {
    console.warn('⚠️ Redis error—falling back to memory store:', err.message);
    warned = true;
  }
});

client.on('connect', () => console.info('✅ Connected to Redis'));

export default client;
