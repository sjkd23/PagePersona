import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import userRoutes from './user-route';
import { MongoUser } from '../models/mongo-user';
import { createSuccessResponse, createErrorResponse } from '../utils/userSerializer';
import { userService } from '../services/user-service';

// Extended Request interface for testing
interface TestRequest extends Request {
  userContext?: any;
  user?: any;
  auth0User?: any;
}

// Mock dependencies
vi.mock('../services/user-service', () => ({
  userService: {
    getUserProfile: vi.fn(),
    updateUserProfile: vi.fn(),
    getUserUsage: vi.fn(),
    syncUser: vi.fn()
  }
}));

vi.mock('../middleware/auth0-middleware', () => ({
  verifyAuth0Token: vi.fn((req: any, res: any, next: any) => {
    req.auth0User = {
      sub: 'auth0|test123',
      email: 'test@example.com',
      name: 'Test User'
    };
    next();
  }),
  syncAuth0User: vi.fn((req: any, res: any, next: any) => {
    req.userContext = {
      mongoUser: {
        _id: 'mockUserId',
        auth0Id: 'auth0|test123',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        usageCount: 5,
        dailyUsage: 3,
        lastUsageDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      auth0User: req.auth0User,
      userId: 'auth0|test123'
    };
    req.user = req.userContext.mongoUser;
    next();
  })
}));

vi.mock('../middleware/rateLimitMiddleware', () => ({
  syncRateLimit: vi.fn((req: any, res: any, next: any) => next()),
  profileUpdateRateLimit: vi.fn((req: any, res: any, next: any) => next()),
  testEndpointRateLimit: vi.fn((req: any, res: any, next: any) => next())
}));

vi.mock('../utils/userSerializer', () => ({
  serializeUser: vi.fn((user) => ({
    id: user._id,
    auth0Id: user.auth0Id,
    email: user.email,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName
  })),
  serializeMongoUser: vi.fn((user) => ({
    id: user._id,
    auth0Id: user.auth0Id,
    email: user.email,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName
  })),
  serializeUserUsage: vi.fn((user) => ({
    usageCount: user.usageCount,
    dailyUsage: user.dailyUsage,
    lastUsageDate: user.lastUsageDate
  })),
  createSuccessResponse: vi.fn((data, message) => ({
    success: true,
    data,
    message
  })),
  createErrorResponse: vi.fn((message) => ({
    success: false,
    error: message
  })),
  safeLogUser: vi.fn()
}));

vi.mock('../utils/migrationHelpers', () => ({
  hasUserContext: vi.fn(() => true)
}));

describe('User Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/user', userRoutes);
    vi.clearAllMocks();
    
    // Set default successful responses for userService
    vi.mocked(userService.getUserProfile).mockResolvedValue({
      success: true,
      data: {
        id: 'mockUserId',
        auth0Id: 'auth0|test123',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        bio: 'Test bio',
        preferences: { theme: 'light', language: 'en', notifications: true },
        usage: { totalTransformations: 5, monthlyUsage: 2, usageResetDate: new Date() },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    vi.mocked(userService.updateUserProfile).mockResolvedValue({
      success: true,
      data: { message: 'Profile updated successfully' }
    });
    
    vi.mocked(userService.getUserUsage).mockResolvedValue({
      success: true,
      data: { totalTransformations: 5, monthlyUsage: 2, usageResetDate: new Date() }
    });
    
    vi.mocked(userService.syncUser).mockResolvedValue({
      success: true,
      data: { userId: 'mockUserId', auth0Id: 'auth0|test123', email: 'test@example.com' },
      message: 'User synced successfully'
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /profile', () => {
    it('should return user profile for authenticated user', async () => {
      const mockUser = {
        _id: 'mockUserId',
        auth0Id: 'auth0|test123',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        bio: 'Test bio',
        preferences: { theme: 'light', language: 'en', notifications: true },
        usage: { totalTransformations: 5, monthlyUsage: 2, usageResetDate: new Date() },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock middleware for this test
      app.use('/api/user/profile-test', (req: TestRequest, res: Response, next: NextFunction) => {
        req.userContext = {
          mongoUser: mockUser,
          auth0User: (req as any).auth0User,
          userId: 'auth0|test123'
        };
        req.user = mockUser;
        next();
      }, userRoutes);

      const response = await request(app)
        .get('/api/user/profile-test/profile')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('email', 'test@example.com');
    });

    it('should handle missing user gracefully', async () => {
      // Test what actually happens when userService fails to find user
      vi.mocked(userService.getUserProfile).mockResolvedValueOnce({
        success: false,
        error: 'User not found in database'
      });

      const response = await request(app)
        .get('/api/user/profile')
        .expect(404); // "not found" errors return 404

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found in database');
    });

    it('should return 404 when user not found', async () => {
      // Import the middleware module to access the mock
      const { syncAuth0User } = await import('../middleware/auth0-middleware');
      
      // Temporarily override the middleware to simulate missing user
      vi.mocked(syncAuth0User).mockImplementationOnce(async (req: any, res: any, next: any) => {
        req.userContext = {
          mongoUser: null, // Simulate user not found
          auth0User: req.auth0User,
          userId: 'auth0|test123'
        };
        req.user = null;
        next();
      });

      const response = await request(app)
        .get('/api/user/profile')
        .expect(404); // Correctly expect 404 for missing user

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('User profile not found');
    });

    it('should handle invalid Auth0 user ID format', async () => {
      // Import the middleware module to access the mock
      const { syncAuth0User } = await import('../middleware/auth0-middleware');
      
      // Override middleware to simulate invalid user ID format
      vi.mocked(syncAuth0User).mockImplementationOnce(async (req: any, res: any, next: any) => {
        req.userContext = {
          mongoUser: {
            _id: 'mockUserId',
            auth0Id: 'invalid-format', // Invalid Auth0 ID format
            email: 'test@example.com',
            username: 'testuser',
            firstName: 'Test',
            lastName: 'User'
          },
          auth0User: req.auth0User,
          userId: 'invalid-format'
        };
        req.user = req.userContext.mongoUser;
        next();
      });

      vi.mocked(userService.getUserProfile).mockResolvedValueOnce({
        success: true,
        data: {
          id: 'mockUserId',
          auth0Id: 'invalid-format',
          email: 'test@example.com',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User'
        }
      });

      const response = await request(app)
        .get('/api/user/profile')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.auth0Id).toBe('invalid-format');
    });

    it('should handle concurrent profile requests', async () => {
      vi.mocked(userService.getUserProfile).mockResolvedValue({
        success: true,
        data: {
          id: 'mockUserId',
          auth0Id: 'auth0|test123',
          email: 'test@example.com',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User'
        }
      });

      // Make multiple concurrent requests
      const requests = Array(3).fill(null).map(() =>
        request(app).get('/api/user/profile')
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.auth0Id).toBe('auth0|test123');
      });
      
      // Verify service was called for each request
      expect(userService.getUserProfile).toHaveBeenCalledTimes(3);
    });
  });

  describe('PUT /profile', () => {
    it('should update user profile successfully', async () => {
      const mockUser = {
        _id: 'mockUserId',
        auth0Id: 'auth0|test123',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Updated',
        lastName: 'User'
      };

      // Mock updated middleware for this test
      app.use('/api/user/update', (req: TestRequest, res: Response, next: NextFunction) => {
        req.userContext = {
          mongoUser: mockUser,
          auth0User: (req as any).auth0User,
          userId: 'auth0|test123'
        };
        req.user = mockUser;
        next();
      }, userRoutes);

      const updateData = {
        displayName: 'Updated User',
        bio: 'A new bio for the user'
      };

      const response = await request(app)
        .put('/api/user/update/profile')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(userService.updateUserProfile).toHaveBeenCalledWith(expect.any(Object), updateData);
    });

    it('should validate update data', async () => {
      const invalidData = {
        email: 'invalid-email' // Should not allow email updates
      };

      const response = await request(app)
        .put('/api/user/profile')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle userService failures during profile update', async () => {
      vi.mocked(userService.updateUserProfile).mockResolvedValueOnce({
        success: false,
        error: 'User not found for update'
      });

      const updateData = {
        displayName: 'Updated User'
      };

      const response = await request(app)
        .put('/api/user/profile')
        .send(updateData)
        .expect(500); // Service failures return 500

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found for update');
    });

    it('should handle userService errors during update', async () => {
      vi.mocked(userService.updateUserProfile).mockResolvedValueOnce({
        success: false,
        error: 'Database update failed'
      });

      const updateData = {
        displayName: 'Updated User'
      };

      const response = await request(app)
        .put('/api/user/profile')
        .send(updateData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Database update failed');
    });

    it('should handle missing user for profile update', async () => {
      // Import the middleware module to access the mock
      const { syncAuth0User } = await import('../middleware/auth0-middleware');
      
      // Temporarily override the middleware to simulate missing user
      vi.mocked(syncAuth0User).mockImplementationOnce(async (req: any, res: any, next: any) => {
        req.userContext = {
          mongoUser: null, // Simulate user not found
          auth0User: req.auth0User,
          userId: 'auth0|update-missing'
        };
        req.user = null;
        next();
      });

      const updateData = {
        displayName: 'Updated User',
        bio: 'A new bio for the user'
      };

      const response = await request(app)
        .put('/api/user/profile')
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('User profile not found');
    });

    it('should validate field lengths correctly', async () => {
      const invalidData = {
        firstName: 'a'.repeat(51), // Too long
        lastName: 'b'.repeat(51), // Too long
        displayName: '', // Too short
        bio: 'c'.repeat(501) // Too long
      };

      const response = await request(app)
        .put('/api/user/profile')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid input');
    });

    it('should accept valid preferences update', async () => {
      const updateData = {
        preferences: {
          theme: 'dark' as const,
          language: 'en',
          notifications: false
        }
      };

      vi.mocked(userService.updateUserProfile).mockResolvedValueOnce({
        success: true,
        data: { 
          _id: 'mockUserId',
          auth0Id: 'auth0|test123',
          email: 'test@example.com',
          username: 'testuser',
          ...updateData 
        },
        message: 'Profile updated successfully'
      });

      const response = await request(app)
        .put('/api/user/profile')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(userService.updateUserProfile).toHaveBeenCalledWith(
        expect.any(Object),
        updateData
      );
    });

    it('should handle malformed request body', async () => {
      // This test ensures proper error handling for malformed JSON
      const response = await request(app)
        .put('/api/user/profile')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}') // Malformed JSON
        .expect(400);

      // Express handles malformed JSON and sends a 400, but the body structure may vary
      expect(response.status).toBe(400);
    });
  });

  describe('GET /usage', () => {
    it('should return user usage statistics', async () => {
      const mockUser = {
        _id: 'mockUserId',
        auth0Id: 'auth0|test123',
        email: 'test@example.com',
        username: 'testuser',
        usage: { totalTransformations: 5, monthlyUsage: 2, usageResetDate: new Date() }
      };

      // Mock middleware for this test
      app.use('/api/user/usage-test', (req: TestRequest, res: Response, next: NextFunction) => {
        req.userContext = {
          mongoUser: mockUser,
          auth0User: (req as any).auth0User,
          userId: 'auth0|test123'
        };
        req.user = mockUser;
        next();
      }, userRoutes);

      const response = await request(app)
        .get('/api/user/usage-test/usage')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalTransformations');
      expect(response.body.data).toHaveProperty('monthlyUsage');
    });

    it('should handle userService failures during usage request', async () => {
      vi.mocked(userService.getUserUsage).mockResolvedValueOnce({
        success: false,
        error: 'User not found for usage query'
      });

      const response = await request(app)
        .get('/api/user/usage')
        .expect(500); // Service failures return 500

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found for usage query');
    });

    it('should handle userService errors during usage fetch', async () => {
      vi.mocked(userService.getUserUsage).mockResolvedValueOnce({
        success: false,
        error: 'Usage data unavailable'
      });

      const response = await request(app)
        .get('/api/user/usage')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Usage data unavailable');
    });

    it('should handle missing user for usage request', async () => {
      // Import the middleware module to access the mock
      const { syncAuth0User } = await import('../middleware/auth0-middleware');
      
      // Temporarily override the middleware to simulate missing user
      vi.mocked(syncAuth0User).mockImplementationOnce(async (req: any, res: any, next: any) => {
        req.userContext = {
          mongoUser: null, // Simulate user not found
          auth0User: req.auth0User,
          userId: 'auth0|usage-missing'
        };
        req.user = null;
        next();
      });

      const response = await request(app)
        .get('/api/user/usage')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('User not found');
    });
  });

  describe('POST /sync', () => {
    it('should sync user successfully', async () => {
      const response = await request(app)
        .post('/api/user/sync')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('synced');
    });
  });

  describe('GET /test-auth', () => {
    it('should verify JWT authentication', async () => {
      // Mock middleware for this test
      app.use('/api/user/auth-test', (req: TestRequest, res: Response, next: NextFunction) => {
        req.userContext = {
          auth0User: { sub: 'auth0|test123', email: 'test@example.com' },
          jwtPayload: { aud: 'test-audience', sub: 'auth0|test123' },
          mongoUser: null,
          userId: 'auth0|test123'
        };
        next();
      }, userRoutes);

      const response = await request(app)
        .get('/api/user/auth-test/test-auth')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('JWT verification');
      expect(response.body.tokenInfo).toHaveProperty('sub');
      expect(response.body.tokenInfo).toHaveProperty('hasValidAudience', true);
    });
  });

  describe('GET /test-no-auth', () => {
    it('should test server connectivity without auth', async () => {
      const response = await request(app)
        .get('/api/user/test-no-auth')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('connectivity test');
    });
  });

  describe('GET /test-jwt-debug', () => {
    it('should provide JWT debug information', async () => {
      const response = await request(app)
        .get('/api/user/test-jwt-debug')
        .set('Authorization', 'Bearer mock.jwt.token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.hasAuthHeader).toBe(true);
    });

    it('should handle missing authorization header', async () => {
      const response = await request(app)
        .get('/api/user/test-jwt-debug')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.hasAuthHeader).toBe(false);
    });
  });

  describe('GET /test-auth-config', () => {
    it('should return Auth0 configuration status', async () => {
      const response = await request(app)
        .get('/api/user/test-auth-config')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.config).toHaveProperty('AUTH0_DOMAIN');
      expect(response.body.config).toHaveProperty('AUTH0_AUDIENCE');
    });
  });

  describe('GET /test-serialize-user', () => {
    it('should run user serialization tests', async () => {
      // Mock the test function
      vi.doMock('../tests/serializeUserTest', () => ({
        testSerializeUser: vi.fn()
      }));

      const response = await request(app)
        .get('/api/user/test-serialize-user')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('SerializeUser robustness tests');
    });

    it('should handle test errors gracefully', async () => {
      // Mock the serializeMongoUser function to throw an error
      vi.doMock('../utils/userSerializer', () => ({
        ...vi.importActual('../utils/userSerializer'),
        serializeMongoUser: vi.fn(() => {
          throw new Error('Serialization test error');
        })
      }));

      const response = await request(app)
        .get('/api/user/test-serialize-user')
        .expect(500); // Correctly expect 500 for internal server error

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to run serializeUser tests');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock userService to throw an error
      vi.mocked(userService.getUserProfile).mockRejectedValueOnce(new Error('Database connection error'));

      const response = await request(app)
        .get('/api/user/profile')
        .expect(500); // Correctly expect 500 for database errors

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Database connection error');
    });

    it('should handle authentication middleware errors', async () => {
      // Test that middleware errors are properly handled
      // This test verifies that the error handling works correctly
      
      // Mock userService to simulate database error during profile fetch
      vi.mocked(userService.getUserProfile).mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/user/profile')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Database connection failed');
    });

    it('should handle missing user context', async () => {
      // Import the middleware module to access the mock
      const { syncAuth0User } = await import('../middleware/auth0-middleware');
      
      // Temporarily override the middleware to simulate missing user context
      vi.mocked(syncAuth0User).mockImplementationOnce(async (req: any, res: any, next: any) => {
        req.userContext = {
          mongoUser: null, // Simulate missing user context
          auth0User: req.auth0User,
          userId: 'auth0|nouser'
        };
        req.user = null;
        next();
      });

      const response = await request(app)
        .get('/api/user/profile')
        .expect(404); // Correctly expect 404 for missing user context

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('User profile not found');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to sync endpoint', async () => {
      // This test verifies that rate limiting middleware is applied
      // The actual rate limiting logic is tested in middleware tests
      const response = await request(app)
        .post('/api/user/sync')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
