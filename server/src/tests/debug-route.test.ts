import request from 'supertest';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import express from 'express';
import { redisClient } from '../utils/redis-client';
import debugRoutes from '../routes/debug-route';

// Mock the Redis client to simulate both available and unavailable states
vi.mock('../utils/redis-client', () => ({
  redisClient: {
    set: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
    getClient: vi.fn()
  }
}));

const mockRedisClient = redisClient as any;

describe('Debug Route - Redis Integration', () => {
  let app: express.Application;

  beforeEach(() => {
    // Create a fresh Express app for each test
    app = express();
    app.use(express.json());
    app.use('/api/debug', debugRoutes);
    
    vi.clearAllMocks();
  });

  describe('GET /api/debug/redis', () => {
    it('should return success when Redis is working', async () => {
      mockRedisClient.set.mockResolvedValue(true);
      mockRedisClient.get.mockResolvedValue('pong');
      mockRedisClient.del.mockResolvedValue(true);

      const response = await request(app)
        .get('/api/debug/redis')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        value: 'pong',
        redisAvailable: true,
        message: 'Redis connectivity test successful'
      });

      expect(mockRedisClient.set).toHaveBeenCalledWith('debug:test', 'pong', 10);
      expect(mockRedisClient.get).toHaveBeenCalledWith('debug:test');
      expect(mockRedisClient.del).toHaveBeenCalledWith('debug:test');
    });

    it('should return error when Redis SET fails', async () => {
      mockRedisClient.set.mockResolvedValue(false);

      const response = await request(app)
        .get('/api/debug/redis')
        .expect(503);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Redis SET operation failed',
        redisAvailable: false
      });
    });

    it('should return error when Redis GET returns wrong value', async () => {
      mockRedisClient.set.mockResolvedValue(true);
      mockRedisClient.get.mockResolvedValue('wrong-value');

      const response = await request(app)
        .get('/api/debug/redis')
        .expect(503);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Redis GET operation failed or returned unexpected value',
        expected: 'pong',
        received: 'wrong-value',
        redisAvailable: false
      });
    });

    it('should handle Redis exceptions gracefully', async () => {
      mockRedisClient.set.mockRejectedValue(new Error('Connection failed'));

      const response = await request(app)
        .get('/api/debug/redis')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Redis debug test failed',
        details: 'Connection failed',
        redisAvailable: false
      });
    });
  });
});
