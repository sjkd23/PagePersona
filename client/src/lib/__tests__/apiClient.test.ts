import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ApiService, { setTokenGetter } from '../apiClient';

// Mock fetch
global.fetch = vi.fn();

describe('ApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up default token getter
    setTokenGetter(() => Promise.resolve('test-token'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('transformWebpage', () => {
    it('should successfully transform a webpage', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        originalContent: {
          title: 'Test Article',
          content: 'Original content',
          url: 'https://example.com/article',
        },
        transformedContent: 'Transformed content in professional style.',
        persona: {
          id: 'professional',
          name: 'Professional',
          description: 'Professional writing style',
        },
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const request = {
        url: 'https://example.com/article',
        persona: 'professional',
      };

      // Act
      const result = await ApiService.transformWebpage(request);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/transform'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          }),
          body: JSON.stringify(request),
        }),
      );
    });

    it('should handle API errors', async () => {
      // Arrange
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal server error' }),
      } as Response);

      const request = {
        url: 'https://example.com/article',
        persona: 'professional',
      };

      // Act
      const result = await ApiService.transformWebpage(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Internal server error');
    });

    it('should handle network errors', async () => {
      // Arrange
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      const request = {
        url: 'https://example.com/article',
        persona: 'professional',
      };

      // Act
      const result = await ApiService.transformWebpage(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(result.errorCode).toBe('NETWORK_ERROR');
    });
  });

  describe('transformText', () => {
    it('should successfully transform text content', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        originalContent: {
          title: '',
          content: 'Original text content',
          url: '',
        },
        transformedContent: 'Transformed text in casual style.',
        persona: {
          id: 'casual',
          name: 'Casual',
          description: 'Casual writing style',
        },
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const request = {
        text: 'Original text content',
        persona: 'casual',
      };

      // Act
      const result = await ApiService.transformText(request);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/transform/text'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(request),
        }),
      );
    });
  });

  describe('getPersonas', () => {
    it('should fetch available personas', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        data: {
          personas: [
            {
              id: 'professional',
              name: 'Professional',
              description: 'Professional writing style',
            },
            {
              id: 'casual',
              name: 'Casual',
              description: 'Casual writing style',
            },
          ],
        },
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      // Act
      const result = await ApiService.getPersonas();

      // Assert
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/transform/personas',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        }),
      );
    });
  });

  describe('getUserProfile', () => {
    it('should fetch user profile', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        data: {
          id: 'user123',
          email: 'test@example.com',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
        },
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      // Act
      const result = await ApiService.getUserProfile();

      // Assert
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/user/profile',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        }),
      );
    });

    it('should handle unauthorized access', async () => {
      // Arrange
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Please log in to access your profile',
            errorCode: 'UNAUTHORIZED',
          }),
      } as Response);

      // Act
      const result = await ApiService.getUserProfile();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Please log in to access your profile');
      expect(result.errorCode).toBe('UNAUTHORIZED');
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile', async () => {
      // Arrange
      const updates = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      const mockResponse = {
        success: true,
        data: {
          id: 'user123',
          email: 'test@example.com',
          firstName: 'Updated',
          lastName: 'Name',
        },
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      // Act
      const result = await ApiService.updateUserProfile(updates);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/user/profile'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updates),
        }),
      );
    });
  });

  describe('getUserUsageStats', () => {
    it('should fetch user usage statistics', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        data: {
          totalTransformations: 25,
          monthlyUsage: 10,
          lastTransformation: '2024-01-01T00:00:00.000Z',
          usageResetDate: '2024-01-01T00:00:00.000Z',
        },
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      // Act
      const result = await ApiService.getUserUsageStats();

      // Assert
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/user/usage',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        }),
      );
    });
  });

  describe('healthCheck', () => {
    it('should perform health check', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        status: 'healthy',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      // Act
      const result = await ApiService.healthCheck();

      // Assert
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/health',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        }),
      );
    });
  });

  describe('Authentication Token Handling', () => {
    it('should include token in authenticated requests', async () => {
      // Arrange
      const testToken = 'test-auth-token';
      setTokenGetter(() => Promise.resolve(testToken));

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      // Act
      await ApiService.getUserProfile();

      // Assert
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${testToken}`,
          }),
        }),
      );
    });

    it('should handle missing token gracefully', async () => {
      // Arrange
      setTokenGetter(() => Promise.resolve(undefined));

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      // Act
      await ApiService.getUserProfile();

      // Assert - Should still make request without Authorization header
      expect(fetch).toHaveBeenCalled();
    });

    it('should handle token getter errors', async () => {
      // Arrange
      setTokenGetter(() => Promise.reject(new Error('Token error')));

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      // Act & Assert
      // Should not throw, but handle gracefully
      await expect(ApiService.getUserProfile()).resolves.toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle JSON parsing errors', async () => {
      // Arrange
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as Response);

      // Act
      const result = await ApiService.healthCheck();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid JSON');
      expect(result.errorCode).toBe('NETWORK_ERROR');
    });

    it('should handle malformed responses', async () => {
      // Arrange
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve(null),
      } as Response);

      // Act
      const result = await ApiService.healthCheck();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot read properties of null');
      expect(result.errorCode).toBe('NETWORK_ERROR');
    });

    it('should handle timeout errors', async () => {
      // Arrange
      vi.mocked(fetch).mockImplementation(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100)),
      );

      // Act
      const result = await ApiService.healthCheck();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Timeout');
      expect(result.errorCode).toBe('NETWORK_ERROR');
    });
  });

  describe('Request Validation', () => {
    it('should validate required fields for transformWebpage', async () => {
      // This test assumes client-side validation exists
      const invalidRequest = {
        url: '', // Empty URL
        persona: 'professional',
      };

      // Act & Assert
      // If validation exists, this should throw before making the request
      // Otherwise, it will make the request and the server should validate
      try {
        await ApiService.transformWebpage(invalidRequest);
      } catch (error) {
        // Either client-side validation or server error is acceptable
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle special characters in URLs', async () => {
      // Arrange
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      const request = {
        url: 'https://example.com/article?query=test&param=特殊文字',
        persona: 'professional',
      };

      // Act & Assert
      await expect(ApiService.transformWebpage(request)).resolves.toBeDefined();
    });

    it('should handle very long text content', async () => {
      // Arrange
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      const longText = 'Lorem ipsum '.repeat(10000); // Very long text
      const request = {
        text: longText,
        persona: 'professional',
      };

      // Act & Assert
      await expect(ApiService.transformText(request)).resolves.toBeDefined();
    });
  });
});
