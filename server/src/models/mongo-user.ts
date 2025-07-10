/**
 * MongoDB User Model
 * 
 * Defines the user data structure and operations for MongoDB storage,
 * synchronized with Auth0 authentication system. Includes comprehensive
 * user management features, usage tracking, and role-based access control.
 * 
 * Features:
 * - Auth0 integration and synchronization
 * - Usage tracking and monthly limits
 * - Role and membership management
 * - User preferences and settings
 * - Performance-optimized indexing
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { logger } from '../utils/logger';

/**
 * MongoDB User Document Interface
 * 
 * Defines the structure and instance methods for user documents
 * stored in MongoDB with comprehensive tracking and management fields.
 */
export interface IMongoUser extends Document, Record<string, unknown> {
  auth0Id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isEmailVerified: boolean;
  role: string;
  membership: string; // 'free', 'premium', 'admin'
  preferences: {
    theme: string;
    language: string;
    notifications: boolean;
  };
  usage: {
    totalTransformations: number;
    monthlyUsage: number;
    monthlyFailed?: number;
    lastTransformation?: Date;
    usageResetDate: Date;
    failedAttempts?: number;
  };
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  
  // Instance methods for user operations
  incrementUsage(): Promise<void>;
  incrementFailedAttempt(): Promise<void>;
  resetMonthlyUsage(): Promise<void>;
  checkUsageLimit(limit: number): boolean;
}

/**
 * MongoDB User Model Interface
 * 
 * Defines static methods available on the User model for
 * database operations and administrative functions.
 */
export interface IMongoUserModel extends Model<IMongoUser> {
  findByAuth0Id(auth0Id: string): Promise<IMongoUser | null>;
  getUsageStats(): Promise<{
    totalUsers: number;
    activeUsersThisMonth: number;
    totalTransformations: number;
  }>;
  incrementUsageById(userId: string): Promise<boolean>;
  incrementFailedAttemptById(userId: string): Promise<boolean>;
  bulkIncrementUsage(userIds: string[]): Promise<number>;
}

/**
 * MongoDB User Schema Definition
 * 
 * Defines the complete user document structure with validation rules,
 * default values, indexes, and data constraints for optimal performance
 * and data integrity in MongoDB storage.
 */
const MongoUserSchema = new Schema<IMongoUser>({
  auth0Id: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  email: { 
    type: String, 
    required: true,
    index: true
  },
  username: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  avatar: { type: String, default: '' },
  isEmailVerified: { type: Boolean, default: false },
  role: { type: String, default: 'user', enum: ['user', 'admin', 'moderator'] },
  membership: { type: String, default: 'free', enum: ['free', 'premium', 'admin'] },
  preferences: {
    theme: { type: String, default: 'light', enum: ['light', 'dark'] },
    language: { type: String, default: 'en' },
    notifications: { type: Boolean, default: true }
  },
  usage: {
    totalTransformations: { type: Number, default: 0 },
    monthlyUsage: { type: Number, default: 0 },
    monthlyFailed: { type: Number, default: 0 },
    failedAttempts: { type: Number, default: 0 },
    lastTransformation: { type: Date },
    usageResetDate: { type: Date, default: Date.now }
  },
  lastLoginAt: { type: Date }
}, { 
  timestamps: true,
  collection: 'users'
});

// Performance optimization indexes for common query patterns
MongoUserSchema.index({ auth0Id: 1, email: 1 });
MongoUserSchema.index({ createdAt: -1 });

/**
 * Instance method: Increment user transformation usage
 * 
 * Atomically increments both total and monthly usage counters with
 * automatic monthly reset handling to prevent race conditions.
 * Uses UTC time calculations to avoid timezone-related issues.
 */
MongoUserSchema.methods.incrementUsage = async function(this: IMongoUser): Promise<void> {
  const now = new Date();
  // Use UTC to prevent timezone-related issues
  const currentMonthUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const resetDate = new Date(this.usage.usageResetDate);
  
  // Check if we need to reset monthly usage (new month) - timezone safe
  const needsReset = now.getUTCMonth() !== resetDate.getUTCMonth() || now.getUTCFullYear() !== resetDate.getUTCFullYear();
  
  if (needsReset) {
    // Use atomic operation to prevent race conditions
    await (this.constructor as IMongoUserModel).updateOne(
      { _id: this._id },
      {
        $set: {
          'usage.monthlyUsage': 1,
          'usage.usageResetDate': currentMonthUTC,
          'usage.lastTransformation': now
        },
        $inc: {
          'usage.totalTransformations': 1
        }
      }
    );
    
    // Update local instance to reflect changes
    this.usage.monthlyUsage = 1;
    this.usage.usageResetDate = currentMonthUTC;
    this.usage.totalTransformations += 1;
    this.usage.lastTransformation = now;
  } else {
    // Use atomic increment to prevent race conditions
    await (this.constructor as IMongoUserModel).updateOne(
      { _id: this._id },
      {
        $inc: {
          'usage.totalTransformations': 1,
          'usage.monthlyUsage': 1
        },
        $set: {
          'usage.lastTransformation': now
        }
      }
    );
    
    // Update local instance to reflect changes
    this.usage.totalTransformations += 1;
    this.usage.monthlyUsage += 1;
    this.usage.lastTransformation = now;
  }
};

MongoUserSchema.methods.incrementFailedAttempt = async function(this: IMongoUser): Promise<void> {
  const now = new Date();
  // Use UTC to prevent timezone-related issues
  const currentMonthUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const resetDate = new Date(this.usage.usageResetDate);
  
  // Check if we need to reset monthly usage (new month) - timezone safe
  const needsReset = now.getUTCMonth() !== resetDate.getUTCMonth() || now.getUTCFullYear() !== resetDate.getUTCFullYear();
  
  if (needsReset) {
    // Use atomic operation to prevent race conditions
    await (this.constructor as IMongoUserModel).updateOne(
      { _id: this._id },
      {
        $set: {
          'usage.monthlyFailed': 1,
          'usage.usageResetDate': currentMonthUTC
        },
        $inc: {
          'usage.failedAttempts': 1
        }
      }
    );
    
    // Update local instance to reflect changes
    this.usage.monthlyFailed = 1;
    this.usage.usageResetDate = currentMonthUTC;
    this.usage.failedAttempts = (this.usage.failedAttempts || 0) + 1;
  } else {
    // Use atomic increment to prevent race conditions
    await (this.constructor as IMongoUserModel).updateOne(
      { _id: this._id },
      {
        $inc: {
          'usage.failedAttempts': 1,
          'usage.monthlyFailed': 1
        }
      }
    );
    
    // Update local instance to reflect changes
    this.usage.failedAttempts = (this.usage.failedAttempts || 0) + 1;
    this.usage.monthlyFailed = (this.usage.monthlyFailed || 0) + 1;
  }
};

MongoUserSchema.methods.resetMonthlyUsage = async function(this: IMongoUser): Promise<void> {
  const now = new Date();
  // Use UTC to prevent timezone-related issues
  const currentMonthUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  this.usage.monthlyUsage = 0;
  this.usage.usageResetDate = currentMonthUTC;
  await this.save();
};

MongoUserSchema.methods.checkUsageLimit = function(this: IMongoUser, limit: number): boolean {
  return this.usage.monthlyUsage < limit;
};

// Static methods
MongoUserSchema.statics.findByAuth0Id = function(auth0Id: string) {
  return this.findOne({ auth0Id });
};

MongoUserSchema.statics.getUsageStats = async function() {
  const now = new Date();
  const currentMonthUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  
  const totalUsers = await this.countDocuments();
  const activeUsersThisMonth = await this.countDocuments({
    'usage.lastTransformation': {
      $gte: currentMonthUTC
    }
  });
  
  const totalTransformations = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: '$usage.totalTransformations' }
      }
    }
  ]);
  
  return {
    totalUsers,
    activeUsersThisMonth,
    totalTransformations: totalTransformations[0]?.total || 0
  };
};

// Static method for atomic usage increment by ID (race-condition safe)
MongoUserSchema.statics.incrementUsageById = async function(userId: string): Promise<boolean> {
  const now = new Date();
  const currentMonthUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  
  try {
    // First, try to increment usage for users whose monthly usage doesn't need reset
    const normalUpdate = await this.updateOne(
      { 
        _id: userId,
        $or: [
          { 'usage.usageResetDate': { $gte: currentMonthUTC } },
          { 'usage.usageResetDate': { $exists: false } }
        ]
      },
      {
        $inc: {
          'usage.totalTransformations': 1,
          'usage.monthlyUsage': 1
        },
        $set: {
          'usage.lastTransformation': now
        }
      }
    );
    
    if (normalUpdate.modifiedCount > 0) {
      return true;
    }
    
    // If no document was modified, user needs monthly reset
    const resetUpdate = await this.updateOne(
      { _id: userId },
      {
        $set: {
          'usage.monthlyUsage': 1,
          'usage.usageResetDate': currentMonthUTC,
          'usage.lastTransformation': now
        },
        $inc: {
          'usage.totalTransformations': 1
        }
      }
    );
    
    return resetUpdate.modifiedCount > 0;
  } catch (error) {
    logger.error('Failed to increment usage by ID:', error);
    return false;
  }
};

// Static method for atomic failed attempt increment by ID (race-condition safe)
MongoUserSchema.statics.incrementFailedAttemptById = async function(userId: string): Promise<boolean> {
  const now = new Date();
  const currentMonthUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  
  try {
    // First, try to increment failed attempts for users whose monthly usage doesn't need reset
    const normalUpdate = await this.updateOne(
      { 
        _id: userId,
        $or: [
          { 'usage.usageResetDate': { $gte: currentMonthUTC } },
          { 'usage.usageResetDate': { $exists: false } }
        ]
      },
      {
        $inc: {
          'usage.failedAttempts': 1,
          'usage.monthlyFailed': 1
        }
      }
    );
    
    if (normalUpdate.modifiedCount > 0) {
      return true;
    }
    
    // If no document was modified, user needs monthly reset
    const resetUpdate = await this.updateOne(
      { _id: userId },
      {
        $set: {
          'usage.monthlyFailed': 1,
          'usage.usageResetDate': currentMonthUTC
        },
        $inc: {
          'usage.failedAttempts': 1
        }
      }
    );
    
    return resetUpdate.modifiedCount > 0;
  } catch (error) {
    logger.error('Failed to increment failed attempt by ID:', error);
    return false;
  }
};

// Bulk usage increment for high-throughput scenarios
MongoUserSchema.statics.bulkIncrementUsage = async function(userIds: string[]): Promise<number> {
  const now = new Date();
  const currentMonthUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  
  try {
    // First pass: increment users who don't need monthly reset
    const normalUpdates = await this.updateMany(
      { 
        _id: { $in: userIds },
        $or: [
          { 'usage.usageResetDate': { $gte: currentMonthUTC } },
          { 'usage.usageResetDate': { $exists: false } }
        ]
      },
      {
        $inc: {
          'usage.totalTransformations': 1,
          'usage.monthlyUsage': 1
        },
        $set: {
          'usage.lastTransformation': now
        }
      }
    );
    
    // Second pass: handle users who need monthly reset
    const resetUpdates = await this.updateMany(
      { 
        _id: { $in: userIds },
        'usage.usageResetDate': { $lt: currentMonthUTC }
      },
      {
        $set: {
          'usage.monthlyUsage': 1,
          'usage.usageResetDate': currentMonthUTC,
          'usage.lastTransformation': now
        },
        $inc: {
          'usage.totalTransformations': 1
        }
      }
    );
    
    return normalUpdates.modifiedCount + resetUpdates.modifiedCount;
  } catch (error) {
    logger.error('Failed bulk usage increment:', error);
    return 0;
  }
};

export const MongoUser = mongoose.model<IMongoUser, IMongoUserModel>('MongoUser', MongoUserSchema);
