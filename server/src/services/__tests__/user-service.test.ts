import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { UserService, userService } from '../user-service';
import { MongoUser } from '../../models/mongo-user';
import { logger } from '../../utils/logger';
import { serializeMongoUser, serializeUserUsage } from '../../utils/userSerializer';

// Mock dependencies
vi.mock('../../models/mongo-user');
vi.mock('../../utils/logger');
vi.mock('../../utils/userSerializer');

describe('UserService', () => {
  let service: UserService;
  let mockUser: any;

  beforeEach(() => {
    service = new UserService();
    
    // Mock user object
    mockUser = {
      _id: 'test-user-id',
      auth0Id: 'auth0|123456',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      preferences: { theme: 'dark' },
      usage: { transformCount: 5, lastUsed: new Date() },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getUserProfile', () => {
    it('should successfully get user profile', async () => {
      // Arrange
      const userId = 'test-user-id';
      const serializedUser: any = {
        id: userId,
        auth0Id: 'auth0|123456',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'John',
        lastName: 'Doe',
        isEmailVerified: true,
        role: 'user',
        preferences: {
          theme: 'light',
          language: 'en',
          notifications: true
        },
        usage: {
          totalTransformations: 5,
          monthlyUsage: 3,
          lastTransformation: '2024-01-01T00:00:00.000Z',
          usageResetDate: '2024-01-01T00:00:00.000Z'
        },
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };
      
      vi.mocked(MongoUser.findById).mockResolvedValue(mockUser);
      vi.mocked(serializeMongoUser).mockReturnValue(serializedUser);

      // Act
      const result = await service.getUserProfile(userId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(serializedUser);
      expect(MongoUser.findById).toHaveBeenCalledWith(userId);
      expect(serializeMongoUser).toHaveBeenCalledWith(mockUser);
    });

    it('should handle user not found', async () => {
      // Arrange
      const userId = 'non-existent-id';
      vi.mocked(MongoUser.findById).mockResolvedValue(null);

      // Act
      const result = await service.getUserProfile(userId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('User profile not found');
      expect(MongoUser.findById).toHaveBeenCalledWith(userId);
    });

    it('should handle database errors', async () => {
      // Arrange
      const userId = 'test-user-id';
      const error = new Error('Database connection failed');
      vi.mocked(MongoUser.findById).mockRejectedValue(error);

      // Act
      const result = await service.getUserProfile(userId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch user profile');
      expect(logger.transform.error).toHaveBeenCalledWith('Error fetching user profile', error);
    });
  });

  describe('updateUserProfile', () => {
    it('should successfully update user profile', async () => {
      // Arrange
      const updates = { firstName: 'Jane', lastName: 'Smith' };
      const updatedUser = { ...mockUser, ...updates };
      const serializedUser: any = {
        id: mockUser._id,
        auth0Id: mockUser.auth0Id,
        email: mockUser.email,
        username: 'testuser',
        firstName: 'Jane',
        lastName: 'Smith',
        isEmailVerified: true,
        role: 'user',
        preferences: {
          theme: 'light',
          language: 'en',
          notifications: true
        },
        usage: {
          totalTransformations: 5,
          monthlyUsage: 3,
          lastTransformation: '2024-01-01T00:00:00.000Z',
          usageResetDate: '2024-01-01T00:00:00.000Z'
        },
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      vi.mocked(MongoUser.findByIdAndUpdate).mockResolvedValue(updatedUser);
      vi.mocked(serializeMongoUser).mockReturnValue(serializedUser);

      // Act
      const result = await service.updateUserProfile(mockUser, updates);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(serializedUser);
      expect(result.message).toBe('Profile updated successfully');
      expect(MongoUser.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUser._id,
        updates,
        { new: true, runValidators: true }
      );
    });

    it('should merge preferences instead of replacing them', async () => {
      // Arrange
      const existingPreferences = { theme: 'dark', language: 'en' };
      const newPreferences = { theme: 'light', notifications: true };
      const userWithPrefs = { ...mockUser, preferences: existingPreferences };
      const updates = { preferences: newPreferences };

      const expectedMergedUpdate = {
        preferences: {
          theme: 'light',      // Updated
          language: 'en',      // Preserved
          notifications: true  // Added
        }
      };

      const updatedUser = { ...userWithPrefs, ...expectedMergedUpdate };
      vi.mocked(MongoUser.findByIdAndUpdate).mockResolvedValue(updatedUser);
      vi.mocked(serializeMongoUser).mockReturnValue(updatedUser);

      // Act
      const result = await service.updateUserProfile(userWithPrefs, updates);

      // Assert
      expect(result.success).toBe(true);
      expect(MongoUser.findByIdAndUpdate).toHaveBeenCalledWith(
        userWithPrefs._id,
        expectedMergedUpdate,
        { new: true, runValidators: true }
      );
    });

    it('should only allow updating permitted fields', async () => {
      // Arrange
      const updates = {
        firstName: 'Jane',
        lastName: 'Smith',
        preferences: { theme: 'light' },
        auth0Id: 'malicious-change',  // Should be filtered out
        _id: 'malicious-id',          // Should be filtered out
        email: 'hacker@evil.com'      // Should be filtered out
      };

      const expectedFilteredUpdates = {
        firstName: 'Jane',
        lastName: 'Smith',
        preferences: {
          ...mockUser.preferences,
          theme: 'light'
        }
      };

      const updatedUser = { ...mockUser, ...expectedFilteredUpdates };
      vi.mocked(MongoUser.findByIdAndUpdate).mockResolvedValue(updatedUser);
      vi.mocked(serializeMongoUser).mockReturnValue(updatedUser);

      // Act
      const result = await service.updateUserProfile(mockUser, updates);

      // Assert
      expect(result.success).toBe(true);
      expect(MongoUser.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUser._id,
        expectedFilteredUpdates,
        { new: true, runValidators: true }
      );
    });

    it('should handle user not found during update', async () => {
      // Arrange
      const updates = { firstName: 'Jane' };
      vi.mocked(MongoUser.findByIdAndUpdate).mockResolvedValue(null);

      // Act
      const result = await service.updateUserProfile(mockUser, updates);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should handle update errors', async () => {
      // Arrange
      const updates = { firstName: 'Jane' };
      const error = new Error('Validation failed');
      vi.mocked(MongoUser.findByIdAndUpdate).mockRejectedValue(error);

      // Act
      const result = await service.updateUserProfile(mockUser, updates);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update user profile');
      expect(logger.transform.error).toHaveBeenCalledWith('Error updating user profile', error);
    });
  });

  describe('getUserUsage', () => {
    it('should successfully get user usage', async () => {
      // Arrange
      const usageData = {
        totalTransformations: 5,
        monthlyUsage: 3,
        lastTransformation: '2024-01-01T00:00:00.000Z',
        usageResetDate: '2024-01-01T00:00:00.000Z'
      };
      vi.mocked(serializeUserUsage).mockReturnValue(usageData);

      // Act
      const result = await service.getUserUsage(mockUser);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(usageData);
      expect(serializeUserUsage).toHaveBeenCalledWith(mockUser);
    });

    it('should handle null user', async () => {
      // Act
      const result = await service.getUserUsage(null);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should handle serialization errors', async () => {
      // Arrange
      const error = new Error('Serialization failed');
      vi.mocked(serializeUserUsage).mockImplementation(() => {
        throw error;
      });

      // Act
      const result = await service.getUserUsage(mockUser);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch user usage');
      expect(logger.transform.error).toHaveBeenCalledWith('Error fetching user usage', error);
    });
  });

  describe('syncUser', () => {
    it('should successfully sync user', async () => {
      // Arrange
      const serializedUser: any = {
        id: mockUser._id,
        auth0Id: mockUser.auth0Id,
        email: mockUser.email,
        username: 'testuser',
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        isEmailVerified: true,
        role: 'user',
        preferences: {
          theme: 'light',
          language: 'en',
          notifications: true
        },
        usage: {
          totalTransformations: 5,
          monthlyUsage: 3,
          lastTransformation: '2024-01-01T00:00:00.000Z',
          usageResetDate: '2024-01-01T00:00:00.000Z'
        },
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };
      vi.mocked(serializeMongoUser).mockReturnValue(serializedUser);

      // Act
      const result = await service.syncUser(mockUser);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(serializedUser);
      expect(result.message).toBe('User successfully synced with MongoDB');
      expect(serializeMongoUser).toHaveBeenCalledWith(mockUser);
      expect(logger.transform.info).toHaveBeenCalled();
    });

    it('should handle null user during sync', async () => {
      // Act
      const result = await service.syncUser(null);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('User sync failed - user not found');
    });

    it('should handle sync errors', async () => {
      // Arrange
      const error = new Error('Sync failed');
      vi.mocked(serializeMongoUser).mockImplementation(() => {
        throw error;
      });

      // Act
      const result = await service.syncUser(mockUser);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to sync user');
      expect(logger.transform.error).toHaveBeenCalledWith('Error syncing user', error);
    });
  });

  describe('Singleton pattern', () => {
    it('should export singleton instance', () => {
      expect(userService).toBeInstanceOf(UserService);
    });

    it('should always return the same instance', async () => {
      // Use dynamic import instead of require for ES modules
      const module1 = await import('../user-service');
      const module2 = await import('../user-service');
      expect(module1.userService).toBe(module2.userService);
    });
  });

  describe('Type safety', () => {
    it('should have proper return type structure', async () => {
      // Arrange
      vi.mocked(MongoUser.findById).mockResolvedValue(mockUser);
      vi.mocked(serializeMongoUser).mockReturnValue(mockUser);

      // Act
      const result = await service.getUserProfile('test-id');

      // Assert
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
      
      if (result.success) {
        expect(result).toHaveProperty('data');
      } else {
        expect(result).toHaveProperty('error');
        expect(typeof result.error).toBe('string');
      }
    });
  });
});
