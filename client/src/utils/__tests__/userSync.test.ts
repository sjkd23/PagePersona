import { describe, it, expect, beforeEach, vi } from 'vitest';
import { syncUserWithBackend, type UserProfile, type UserSyncResponse } from '../userSync';
import { logger } from '../logger';

// Mock logger
vi.mock('../logger', () => ({
  logger: {
    sync: {
      info: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    },
  },
}));

// Mock fetch
global.fetch = vi.fn();
const mockFetch = vi.mocked(fetch);

// Mock environment variable
vi.mock('../../../env', () => ({
  VITE_API_URL: 'https://api.test.com/api',
}));

describe('userSync', () => {
  const validToken =
    'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHwxMjMiLCJhdWQiOiJ0ZXN0LWF1ZGllbmNlIiwiZXhwIjo5OTk5OTk5OTk5LCJzY29wZSI6InJlYWQ6cHJvZmlsZSJ9.fake-signature';

  const mockUserProfile: UserProfile = {
    id: 'user-123',
    auth0Id: 'auth0|123',
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    avatar: 'avatar.png',
    isEmailVerified: true,
    role: 'user',
    preferences: {
      theme: 'light',
      language: 'en',
      notifications: true,
    },
    usage: {
      dailyRequests: 5,
      monthlyRequests: 100,
      totalRequests: 500,
    },
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  const mockSuccessResponse: UserSyncResponse = {
    success: true,
    data: mockUserProfile,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('token validation', () => {
    it('should return null for empty token', async () => {
      const result = await syncUserWithBackend('');

      expect(result).toBeNull();
      expect(logger.sync.error).toHaveBeenCalledWith('Invalid JWT token format');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return null for invalid JWT format', async () => {
      const result = await syncUserWithBackend('invalid.token');

      expect(result).toBeNull();
      expect(logger.sync.error).toHaveBeenCalledWith('Invalid JWT token format');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return null for expired token', async () => {
      const expiredToken =
        'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHwxMjMiLCJleHAiOjE2MDAwMDAwMDB9.fake-signature';

      const result = await syncUserWithBackend(expiredToken);

      expect(result).toBeNull();
      expect(logger.sync.error).toHaveBeenCalledWith('Token is expired');
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('successful profile retrieval', () => {
    it('should return user profile when profile exists', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockSuccessResponse),
      } as unknown as Response);

      const result = await syncUserWithBackend(validToken);

      expect(result).toEqual(mockUserProfile);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:5000/api/user/profile', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
      });
      expect(logger.sync.info).toHaveBeenCalledWith('Starting user sync with backend');
      expect(logger.sync.info).toHaveBeenCalledWith('Profile retrieved', {
        success: true,
      });
    });
  });

  describe('sync flow when profile not found', () => {
    it('should trigger sync when profile returns 404', async () => {
      // First call (profile) returns 404
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        } as unknown as Response)
        // Second call (sync) returns success
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue(mockSuccessResponse),
        } as unknown as Response);

      const result = await syncUserWithBackend(validToken);

      expect(result).toEqual(mockUserProfile);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        'http://localhost:5000/api/user/profile',
        expect.any(Object),
      );
      expect(mockFetch).toHaveBeenNthCalledWith(2, 'http://localhost:5000/api/user/sync', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
      });
    });

    it('should return null when sync fails', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: vi.fn().mockResolvedValue('Internal server error'),
        } as unknown as Response);

      const result = await syncUserWithBackend(validToken);

      expect(result).toBeNull();
      expect(logger.sync.error).toHaveBeenCalledWith('Sync request failed', undefined, {
        status: 500,
        errorText: 'Internal server error',
      });
    });
  });

  describe('error handling', () => {
    it('should handle profile fetch failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue('Server error'),
      } as unknown as Response);

      const result = await syncUserWithBackend(validToken);

      expect(result).toBeNull();
      expect(logger.sync.error).toHaveBeenCalledWith('Profile request failed', undefined, {
        status: 500,
        errorText: 'Server error',
      });
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValueOnce(networkError);

      const result = await syncUserWithBackend(validToken);

      expect(result).toBeNull();
      expect(logger.sync.error).toHaveBeenCalledWith('Error during user sync', networkError);
    });

    it('should handle malformed JWT payload', async () => {
      const malformedToken = 'header.invalid-base64.signature';

      const result = await syncUserWithBackend(malformedToken);

      expect(result).toBeNull();
      expect(logger.sync.error).toHaveBeenCalledWith('Cannot decode JWT payload');
    });
  });

  describe('API URL configuration', () => {
    it('should use default API URL when env var not set', async () => {
      // This test assumes the module uses fallback URL
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockSuccessResponse),
      } as unknown as Response);

      await syncUserWithBackend(validToken);

      // Test that it calls some API URL
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/user/profile'),
        expect.any(Object),
      );
    });
  });

  describe('response data handling', () => {
    it('should handle success response without data field', async () => {
      const responseWithoutData: UserSyncResponse = {
        success: true,
        profile: mockUserProfile,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(responseWithoutData),
      } as unknown as Response);

      const result = await syncUserWithBackend(validToken);

      expect(result).toBeNull(); // Since data field is undefined
    });

    it('should handle unsuccessful response', async () => {
      const unsuccessfulResponse: UserSyncResponse = {
        success: false,
        error: 'User not found',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(unsuccessfulResponse),
      } as unknown as Response);

      const result = await syncUserWithBackend(validToken);

      expect(result).toBeNull();
    });
  });
});
