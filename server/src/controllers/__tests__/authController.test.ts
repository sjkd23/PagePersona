import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { getUser, getUserUsage, getUserSummary } from '../authController';
import { HttpStatus } from '../../constants/http-status';
import type { AuthenticatedRequest, AuthenticatedUserContext } from '../../types/common';
import type { IMongoUser } from '../../models/mongo-user';

// Mock dependencies
vi.mock('../../utils/logger', () => ({
  logger: {
    auth: {
      error: vi.fn(),
    },
  },
}));

vi.mock('../../utils/userSerializer', () => ({
  serializeMongoUser: vi.fn((user) => ({ id: user._id, email: user.email })),
  serializeUserUsage: vi.fn((user) => ({
    totalTransformations: user.usage?.totalTransformations || 0,
    remainingTransformations: 100 - (user.usage?.totalTransformations || 0),
  })),
  serializeUserSummary: vi.fn((user) => ({
    id: user._id,
    email: user.email,
    isActive: true,
  })),
  createSuccessResponse: vi.fn((data) => ({ success: true, data })),
  createErrorResponse: vi.fn((message) => ({ success: false, error: message })),
}));

const createMockUser = (overrides: Partial<IMongoUser> = {}): IMongoUser =>
  ({
    _id: 'user123',
    auth0Id: 'auth0|123',
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    isEmailVerified: true,
    role: 'user',
    membership: 'free',
    preferences: {
      theme: 'light',
      language: 'en',
      notifications: true,
    },
    usage: {
      totalTransformations: 0,
      monthlyUsage: 0,
      usageResetDate: new Date(),
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    incrementUsage: vi.fn(),
    incrementFailedAttempt: vi.fn(),
    resetMonthlyUsage: vi.fn(),
    checkUsageLimit: vi.fn(),
    ...overrides,
  }) as IMongoUser;

const createMockUserContext = (mongoUser: IMongoUser | null): AuthenticatedUserContext => {
  return {
    jwtPayload: {
      sub: 'auth0|123',
      aud: 'test-audience',
      iss: 'test-issuer',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    auth0User: {
      id: 'auth0|123',
      sub: 'auth0|123',
      email: 'test@example.com',
      name: 'Test User',
      givenName: 'Test',
      familyName: 'User',
      nickname: 'testuser',
    },
    mongoUser: mongoUser || undefined,
  };
};

describe('controllers/authController', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockJson: ReturnType<typeof vi.fn>;
  let mockStatus: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });

    mockRes = {
      json: mockJson,
      status: mockStatus,
    };
  });

  describe('getUser', () => {
    it('should return user data when user exists', async () => {
      const mockUser = createMockUser();

      mockReq = {
        userContext: createMockUserContext(mockUser),
      };

      await getUser(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          user: {
            id: 'user123',
            email: 'test@example.com',
          },
        },
      });
    });

    it('should return 404 when user not found', async () => {
      mockReq = {
        userContext: createMockUserContext(null),
      };

      await getUser(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'User not found',
      });
    });

    it('should return 404 when userContext is missing', async () => {
      mockReq = {};

      await getUser(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'User not found',
      });
    });

    it('should handle errors gracefully', async () => {
      const { serializeMongoUser } = await import('../../utils/userSerializer');
      vi.mocked(serializeMongoUser).mockImplementation(() => {
        throw new Error('Serialization error');
      });

      mockReq = {
        userContext: createMockUserContext(createMockUser()),
      };

      await getUser(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
      });
    });
  });

  describe('getUserUsage', () => {
    it('should return user usage data when user exists', async () => {
      const mockUser = createMockUser({
        usage: {
          totalTransformations: 5,
          monthlyUsage: 5,
          usageResetDate: new Date(),
        },
      });

      mockReq = {
        userContext: createMockUserContext(mockUser),
      };

      await getUserUsage(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          totalTransformations: 5,
          remainingTransformations: 95,
        },
      });
    });

    it('should return 404 when user not found', async () => {
      mockReq = {
        userContext: createMockUserContext(null),
      };

      await getUserUsage(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'User not found',
      });
    });

    it('should handle errors gracefully', async () => {
      const { serializeUserUsage } = await import('../../utils/userSerializer');
      vi.mocked(serializeUserUsage).mockImplementation(() => {
        throw new Error('Usage serialization error');
      });

      mockReq = {
        userContext: createMockUserContext(createMockUser()),
      };

      await getUserUsage(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
      });
    });
  });

  describe('getUserSummary', () => {
    it('should return user summary when user exists', async () => {
      const mockUser = createMockUser();

      mockReq = {
        userContext: createMockUserContext(mockUser),
      };

      await getUserSummary(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          id: 'user123',
          email: 'test@example.com',
          isActive: true,
        },
      });
    });

    it('should return 404 when user not found', async () => {
      mockReq = {
        userContext: createMockUserContext(null),
      };

      await getUserSummary(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'User not found',
      });
    });

    it('should handle errors gracefully', async () => {
      const { serializeUserSummary } = await import('../../utils/userSerializer');
      vi.mocked(serializeUserSummary).mockImplementation(() => {
        throw new Error('Summary serialization error');
      });

      mockReq = {
        userContext: createMockUserContext(createMockUser()),
      };

      await getUserSummary(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
      });
    });
  });
});
