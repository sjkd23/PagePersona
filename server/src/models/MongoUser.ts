// src/models/MongoUser.ts
// MongoDB User model that syncs with Auth0 users

import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface for the document instance
export interface IMongoUser extends Document {
  auth0Id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isEmailVerified: boolean;
  role: string;
  preferences: {
    theme: string;
    language: string;
    notifications: boolean;
  };
  usage: {
    totalTransformations: number;
    monthlyUsage: number;
    lastTransformation?: Date;
    usageResetDate: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  
  // Instance methods
  incrementUsage(): Promise<void>;
  resetMonthlyUsage(): Promise<void>;
  checkUsageLimit(limit: number): boolean;
}

// Interface for the model (static methods)
export interface IMongoUserModel extends Model<IMongoUser> {
  findByAuth0Id(auth0Id: string): Promise<IMongoUser | null>;
  getUsageStats(): Promise<{
    totalUsers: number;
    activeUsersThisMonth: number;
    totalTransformations: number;
  }>;
  incrementUsageById(userId: string): Promise<boolean>;
  bulkIncrementUsage(userIds: string[]): Promise<number>;
}

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
  preferences: {
    theme: { type: String, default: 'light', enum: ['light', 'dark'] },
    language: { type: String, default: 'en' },
    notifications: { type: Boolean, default: true }
  },
  usage: {
    totalTransformations: { type: Number, default: 0 },
    monthlyUsage: { type: Number, default: 0 },
    lastTransformation: { type: Date },
    usageResetDate: { type: Date, default: Date.now }
  },
  lastLoginAt: { type: Date }
}, { 
  timestamps: true,
  collection: 'users'
});

// Compound indexes for better performance
MongoUserSchema.index({ auth0Id: 1, email: 1 });
MongoUserSchema.index({ createdAt: -1 });

// Instance methods
MongoUserSchema.methods.incrementUsage = async function(this: IMongoUser): Promise<void> {
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const resetDate = new Date(this.usage.usageResetDate);
  
  // Check if we need to reset monthly usage (new month)
  const needsReset = now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear();
  
  if (needsReset) {
    // Use atomic operation to prevent race conditions
    await (this.constructor as IMongoUserModel).updateOne(
      { _id: this._id },
      {
        $set: {
          'usage.monthlyUsage': 1,
          'usage.usageResetDate': currentMonth,
          'usage.lastTransformation': now
        },
        $inc: {
          'usage.totalTransformations': 1
        }
      }
    );
    
    // Update local instance to reflect changes
    this.usage.monthlyUsage = 1;
    this.usage.usageResetDate = currentMonth;
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

MongoUserSchema.methods.resetMonthlyUsage = async function(this: IMongoUser): Promise<void> {
  const now = new Date();
  this.usage.monthlyUsage = 0;
  this.usage.usageResetDate = new Date(now.getFullYear(), now.getMonth(), 1);
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
  const totalUsers = await this.countDocuments();
  const activeUsersThisMonth = await this.countDocuments({
    'usage.lastTransformation': {
      $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
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
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  try {
    // First, try to increment usage for users whose monthly usage doesn't need reset
    const normalUpdate = await this.updateOne(
      { 
        _id: userId,
        $or: [
          { 'usage.usageResetDate': { $gte: currentMonth } },
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
          'usage.usageResetDate': currentMonth,
          'usage.lastTransformation': now
        },
        $inc: {
          'usage.totalTransformations': 1
        }
      }
    );
    
    return resetUpdate.modifiedCount > 0;
  } catch (error) {
    console.error('Failed to increment usage by ID:', error);
    return false;
  }
};

// Bulk usage increment for high-throughput scenarios
MongoUserSchema.statics.bulkIncrementUsage = async function(userIds: string[]): Promise<number> {
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  try {
    // First pass: increment users who don't need monthly reset
    const normalUpdates = await this.updateMany(
      { 
        _id: { $in: userIds },
        $or: [
          { 'usage.usageResetDate': { $gte: currentMonth } },
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
        'usage.usageResetDate': { $lt: currentMonth }
      },
      {
        $set: {
          'usage.monthlyUsage': 1,
          'usage.usageResetDate': currentMonth,
          'usage.lastTransformation': now
        },
        $inc: {
          'usage.totalTransformations': 1
        }
      }
    );
    
    return normalUpdates.modifiedCount + resetUpdates.modifiedCount;
  } catch (error) {
    console.error('Failed bulk usage increment:', error);
    return 0;
  }
};

export const MongoUser = mongoose.model<IMongoUser, IMongoUserModel>('MongoUser', MongoUserSchema);
