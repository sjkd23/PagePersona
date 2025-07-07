import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import adminRoutes from './admin-route';

// Mock dependencies
vi.mock('../models/mongo-user', () => ({
  MongoUser: {
    find: vi.fn(),
    countDocuments: vi.fn(),
    aggregate: vi.fn(),
    findById: vi.fn(),
    findByIdAndDelete: vi.fn()
  }
}));

vi.mock('../utils/redis-client', () => ({
  redisClient: {
    del: vi.fn().mockResolvedValue(1),
    get: vi.fn(),
    set: vi.fn(),
    disconnect: vi.fn()
  }
}));

vi.mock('../middleware/auth0-middleware', () => ({
  verifyAuth0Token: vi.fn((req: any, res: any, next: any) => {
    req.auth0User = {
      sub: 'auth0|admin123',
      email: 'admin@example.com',
      'https://pagepersona.ai/roles': ['admin']
    };
    next();
  }),
  syncAuth0User: vi.fn((req: any, res: any, next: any) => {
    req.userContext = {
      mongoUser: {
        _id: 'admin123',
        email: 'admin@example.com',
        role: 'admin',
        membership: 'admin'
      }
    };
    next();
  })
}));

vi.mock('../utils/userSerializer', () => ({
  createSuccessResponse: vi.fn((data: any) => ({ success: true, data })),
  createErrorResponse: vi.fn((message: string) => ({ success: false, error: message })),
  serializeMongoUser: vi.fn((user: any) => ({
    id: user._id,
    email: user.email,
    username: user.username,
    role: user.role,
    membership: user.membership,
    usageCount: user.usageCount,
    createdAt: user.createdAt
  }))
}));

vi.mock('../utils/logger', () => ({
  logger: {
    auth: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    }
  }
}));

describe('Admin Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/admin', adminRoutes);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /stats', () => {
    it('should return system statistics for admin', async () => {
      const { MongoUser } = await import('../models/mongo-user');

      // Mock the various count queries
      vi.mocked(MongoUser.countDocuments)
        .mockResolvedValueOnce(100) // total users
        .mockResolvedValueOnce(80)  // free users
        .mockResolvedValueOnce(15)  // premium users
        .mockResolvedValueOnce(5)   // admin users
        .mockResolvedValueOnce(25)  // active users this month
        .mockResolvedValueOnce(12); // new users this month

      // Mock the aggregation for total transformations
      vi.mocked(MongoUser.aggregate).mockResolvedValue([
        { _id: null, total: 1500 }
      ]);

      const response = await request(app)
        .get('/api/admin/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('users');
      expect(response.body.data).toHaveProperty('transformations');
      expect(response.body.data.users.total).toBe(100);
      expect(response.body.data.users.free).toBe(80);
      expect(response.body.data.users.premium).toBe(15);
      expect(response.body.data.users.admin).toBe(5);
      expect(response.body.data.transformations.total).toBe(1500);
    });

    it('should handle database errors gracefully', async () => {
      const { MongoUser } = await import('../models/mongo-user');
      
      vi.mocked(MongoUser.countDocuments).mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .get('/api/admin/stats')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to fetch system statistics');
    });

    it('should require admin role', async () => {
      // Mock non-admin user
      const { syncAuth0User } = await import('../middleware/auth0-middleware');
      vi.mocked(syncAuth0User).mockImplementationOnce(async (req: any, res: any, next: any) => {
        req.userContext = {
          mongoUser: {
            _id: 'user123',
            email: 'user@example.com',
            role: 'user',
            membership: 'free'
          }
        };
        next();
      });

      const response = await request(app)
        .get('/api/admin/stats')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Admin role required');
    });
  });

  describe('GET /users', () => {
    it('should return paginated user list', async () => {
      const { MongoUser } = await import('../models/mongo-user');
      
      const mockUsers = [
        {
          _id: 'user1',
          email: 'user1@example.com',
          username: 'user1',
          usageCount: 10,
          createdAt: new Date()
        },
        {
          _id: 'user2',
          email: 'user2@example.com',
          username: 'user2',
          usageCount: 5,
          createdAt: new Date()
        }
      ];

      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockUsers)
      };

      vi.mocked(MongoUser.find).mockReturnValue(mockQuery as any);
      vi.mocked(MongoUser.countDocuments).mockResolvedValue(100);

      const response = await request(app)
        .get('/api/admin/users?page=1&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(2);
      expect(response.body.data.pagination).toHaveProperty('totalUsers', 100);
      expect(response.body.data.pagination).toHaveProperty('page', 1);
    });

    it('should handle pagination parameters correctly', async () => {
      const { MongoUser } = await import('../models/mongo-user');
      
      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([])
      };

      vi.mocked(MongoUser.find).mockReturnValue(mockQuery as any);
      vi.mocked(MongoUser.countDocuments).mockResolvedValue(50);

      await request(app)
        .get('/api/admin/users?page=3&limit=5')
        .expect(200);

      expect(mockQuery.skip).toHaveBeenCalledWith(10); // (3-1) * 5 = 10
      expect(mockQuery.limit).toHaveBeenCalledWith(5);
    });

    it('should require admin role', async () => {
      // Mock non-admin user
      const { syncAuth0User } = await import('../middleware/auth0-middleware');
      vi.mocked(syncAuth0User).mockImplementationOnce(async (req: any, res: any, next: any) => {
        req.userContext = {
          mongoUser: {
            _id: 'user123',
            email: 'user@example.com',
            role: 'user',
            membership: 'free'
          }
        };
        next();
      });

      const response = await request(app)
        .get('/api/admin/users')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Admin role required');
    });
  });
});
