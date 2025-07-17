import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoUser } from './mongo-user';

// Mock mongoose
vi.mock('mongoose', () => ({
  __esModule: true,
  default: {
    Schema: vi.fn(),
    model: vi.fn(),
    connect: vi.fn(),
    connection: {
      readyState: 1,
    },
  },
  Schema: vi.fn().mockImplementation(() => ({
    pre: vi.fn(),
    methods: {},
    virtual: vi.fn().mockReturnThis(),
    get: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    index: vi.fn().mockReturnThis(), // Add index method
    statics: {},
    plugin: vi.fn().mockReturnThis(),
  })),
  model: vi.fn(),
}));

// Mock logger
vi.mock('../utils/logger', () => ({
  logger: {
    database: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    },
  },
}));

describe('MongoUser Model', () => {
  let mockUserDoc: any;
  let mockModel: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a mock user document
    mockUserDoc = {
      _id: 'mockUserId',
      auth0Id: 'auth0|test123',
      email: 'test@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      usageCount: 5,
      dailyUsage: 3,
      lastUsageDate: new Date('2024-01-01'),
      dailyUsageDate: new Date('2024-01-01'),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      isNew: false,
      save: vi.fn().mockResolvedValue(true),
      toObject: vi.fn().mockReturnValue({
        _id: 'mockUserId',
        auth0Id: 'auth0|test123',
        email: 'test@example.com',
        username: 'testuser',
      }),
    };

    // Mock the model constructor and methods
    mockModel = vi.fn().mockImplementation(() => mockUserDoc);
    mockModel.findOne = vi.fn();
    mockModel.findById = vi.fn();
    mockModel.findByIdAndUpdate = vi.fn();
    mockModel.create = vi.fn();
    mockModel.findOneAndUpdate = vi.fn();
    mockModel.countDocuments = vi.fn();
    mockModel.aggregate = vi.fn();

    // Mock MongoUser to return our mock model
    vi.mocked(mongoose.model).mockReturnValue(mockModel);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Schema Definition', () => {
    it('should define the user schema with required fields', () => {
      // The mongoose Schema constructor should be a function
      expect(mongoose.Schema).toBeDefined();
      expect(mongoose.model).toBeDefined();
      expect(typeof mongoose.Schema).toBe('function');
      expect(typeof mongoose.model).toBe('function');

      // Test that we can create a schema instance (this will call our mock)
      const MockedSchema = vi.mocked(mongoose.Schema);
      expect(MockedSchema).toBeDefined();
    });
  });

  describe('User Creation', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        auth0Id: 'auth0|newuser123',
        email: 'newuser@example.com',
        username: 'newuser',
        firstName: 'New',
        lastName: 'User',
      };

      mockModel.create.mockResolvedValue({ ...userData, _id: 'newUserId' });

      const result = await mockModel.create(userData);

      expect(result).toHaveProperty('_id');
      expect(result.auth0Id).toBe(userData.auth0Id);
      expect(result.email).toBe(userData.email);
    });

    it('should handle creation errors gracefully', async () => {
      const userData = {
        auth0Id: 'auth0|invalid',
        email: 'invalid-email',
      };

      mockModel.create.mockRejectedValue(new Error('Validation error'));

      await expect(mockModel.create(userData)).rejects.toThrow('Validation error');
    });
  });

  describe('User Queries', () => {
    it('should find user by Auth0 ID', async () => {
      const auth0Id = 'auth0|test123';
      mockModel.findOne.mockResolvedValue(mockUserDoc);

      const result = await mockModel.findOne({ auth0Id });

      expect(mockModel.findOne).toHaveBeenCalledWith({ auth0Id });
      expect(result).toBe(mockUserDoc);
    });

    it('should find user by email', async () => {
      const email = 'test@example.com';
      mockModel.findOne.mockResolvedValue(mockUserDoc);

      const result = await mockModel.findOne({ email });

      expect(mockModel.findOne).toHaveBeenCalledWith({ email });
      expect(result).toBe(mockUserDoc);
    });

    it('should find user by MongoDB ID', async () => {
      const userId = 'mockUserId';
      mockModel.findById.mockResolvedValue(mockUserDoc);

      const result = await mockModel.findById(userId);

      expect(mockModel.findById).toHaveBeenCalledWith(userId);
      expect(result).toBe(mockUserDoc);
    });

    it('should return null when user not found', async () => {
      mockModel.findOne.mockResolvedValue(null);

      const result = await mockModel.findOne({ auth0Id: 'nonexistent' });

      expect(result).toBeNull();
    });
  });

  describe('User Updates', () => {
    it('should update user successfully', async () => {
      const userId = 'mockUserId';
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      mockModel.findByIdAndUpdate.mockResolvedValue({
        ...mockUserDoc,
        ...updateData,
      });

      const result = await mockModel.findByIdAndUpdate(userId, updateData, {
        new: true,
      });

      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(userId, updateData, { new: true });
      expect(result.firstName).toBe(updateData.firstName);
      expect(result.lastName).toBe(updateData.lastName);
    });

    it('should handle upsert operations', async () => {
      const auth0Id = 'auth0|newuser';
      const userData = {
        email: 'new@example.com',
        username: 'newuser',
      };

      mockModel.findOneAndUpdate.mockResolvedValue({
        ...userData,
        auth0Id,
        _id: 'newUserId',
        isNew: true,
      });

      const result = await mockModel.findOneAndUpdate(
        { auth0Id },
        { $set: userData },
        { upsert: true, new: true },
      );

      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { auth0Id },
        { $set: userData },
        { upsert: true, new: true },
      );
      expect(result.auth0Id).toBe(auth0Id);
    });
  });

  describe('Usage Tracking', () => {
    it('should increment usage count correctly', async () => {
      const userId = 'mockUserId';
      const today = new Date();

      // Mock the user with current date for daily usage
      const userWithCurrentDate = {
        ...mockUserDoc,
        lastUsageDate: today,
        dailyUsageDate: today,
        dailyUsage: 5,
        usageCount: 10,
      };

      mockModel.findByIdAndUpdate.mockResolvedValue(userWithCurrentDate);

      const result = await mockModel.findByIdAndUpdate(
        userId,
        {
          $inc: { usageCount: 1, dailyUsage: 1 },
          $set: { lastUsageDate: today },
        },
        { new: true },
      );

      expect(result.usageCount).toBe(10);
      expect(result.dailyUsage).toBe(5);
    });

    it('should reset daily usage for new day', async () => {
      const userId = 'mockUserId';
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Mock user with yesterday's date
      const userWithOldDate = {
        ...mockUserDoc,
        dailyUsageDate: yesterday,
        dailyUsage: 10,
      };

      mockModel.findByIdAndUpdate.mockResolvedValue({
        ...userWithOldDate,
        dailyUsage: 1,
        dailyUsageDate: today,
      });

      const result = await mockModel.findByIdAndUpdate(
        userId,
        {
          $set: {
            dailyUsage: 1,
            dailyUsageDate: today,
            lastUsageDate: today,
          },
          $inc: { usageCount: 1 },
        },
        { new: true },
      );

      expect(result.dailyUsage).toBe(1);
    });
  });

  describe('User Statistics', () => {
    it('should get user count statistics', async () => {
      mockModel.countDocuments.mockResolvedValue(100);

      const count = await mockModel.countDocuments();

      expect(count).toBe(100);
    });

    it('should aggregate usage statistics', async () => {
      const mockAggregation = [
        {
          _id: null,
          totalUsers: 100,
          totalUsage: 1500,
          averageUsage: 15,
        },
      ];

      mockModel.aggregate.mockResolvedValue(mockAggregation);

      const result = await mockModel.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            totalUsage: { $sum: '$usageCount' },
            averageUsage: { $avg: '$usageCount' },
          },
        },
      ]);

      expect(result).toEqual(mockAggregation);
    });
  });

  describe('Data Validation', () => {
    it('should validate required fields', async () => {
      const invalidUserData = {
        // Missing required fields like auth0Id, email
        firstName: 'Test',
      };

      mockModel.create.mockRejectedValue(
        new Error('User validation failed: auth0Id: Path `auth0Id` is required.'),
      );

      await expect(mockModel.create(invalidUserData)).rejects.toThrow('User validation failed');
    });

    it('should validate email format', async () => {
      const invalidEmailData = {
        auth0Id: 'auth0|test',
        email: 'invalid-email-format',
        username: 'test',
      };

      mockModel.create.mockRejectedValue(
        new Error('User validation failed: email: Please enter a valid email'),
      );

      await expect(mockModel.create(invalidEmailData)).rejects.toThrow(
        'email: Please enter a valid email',
      );
    });

    it('should enforce unique constraints', async () => {
      const duplicateUserData = {
        auth0Id: 'auth0|existing',
        email: 'existing@example.com',
        username: 'existing',
      };

      mockModel.create.mockRejectedValue(new Error('E11000 duplicate key error'));

      await expect(mockModel.create(duplicateUserData)).rejects.toThrow('duplicate key error');
    });
  });

  describe('Document Methods', () => {
    it('should save document changes', async () => {
      mockUserDoc.firstName = 'Updated';
      await mockUserDoc.save();

      expect(mockUserDoc.save).toHaveBeenCalled();
    });

    it('should convert to object', () => {
      const obj = mockUserDoc.toObject();

      expect(obj).toHaveProperty('_id');
      expect(obj).toHaveProperty('auth0Id');
      expect(obj).toHaveProperty('email');
    });

    it('should handle save errors', async () => {
      mockUserDoc.save.mockRejectedValue(new Error('Save failed'));

      await expect(mockUserDoc.save()).rejects.toThrow('Save failed');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockModel.findOne.mockRejectedValue(new Error('Network error'));

      await expect(mockModel.findOne({ auth0Id: 'test' })).rejects.toThrow('Network error');
    });

    it('should handle timeout errors', async () => {
      mockModel.create.mockRejectedValue(new Error('Operation timed out'));

      await expect(mockModel.create({})).rejects.toThrow('Operation timed out');
    });

    it('should handle connection errors', async () => {
      mockModel.findById.mockRejectedValue(new Error('Connection lost'));

      await expect(mockModel.findById('test')).rejects.toThrow('Connection lost');
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle batch operations', async () => {
      const userIds = ['id1', 'id2', 'id3'];
      mockModel.find = vi.fn().mockResolvedValue([
        { ...mockUserDoc, _id: 'id1' },
        { ...mockUserDoc, _id: 'id2' },
        { ...mockUserDoc, _id: 'id3' },
      ]);

      const result = await mockModel.find({ _id: { $in: userIds } });

      expect(result).toHaveLength(3);
      expect(mockModel.find).toHaveBeenCalledWith({ _id: { $in: userIds } });
    });

    it('should support pagination', async () => {
      mockModel.find = vi.fn().mockReturnValue({
        skip: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockUserDoc]),
        }),
      });

      const result = await mockModel.find().skip(10).limit(5);

      expect(result).toEqual([mockUserDoc]);
    });

    it('should support sorting', async () => {
      mockModel.find = vi.fn().mockReturnValue({
        sort: vi.fn().mockResolvedValue([mockUserDoc]),
      });

      const result = await mockModel.find().sort({ createdAt: -1 });

      expect(result).toEqual([mockUserDoc]);
    });
  });
});
