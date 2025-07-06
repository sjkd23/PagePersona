import { Request, Response } from 'express';
import { MongoUser } from '../models/MongoUser';

// Get current user info (Auth0 compatible)
export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user } = (req as any).user;
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        auth0Id: user.auth0Id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        role: user.role,
        preferences: user.preferences,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get current user's usage statistics
export const getUserUsage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user } = (req as any).user;
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      usage: {
        totalTransformations: user.usage.totalTransformations,
        monthlyUsage: user.usage.monthlyUsage,
        lastTransformation: user.usage.lastTransformation,
        usageResetDate: user.usage.usageResetDate
      }
    });
  } catch (error) {
    console.error('Error fetching user usage:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get current user's summary
export const getUserSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user } = (req as any).user;
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    const summary = {
      id: user._id,
      email: user.email,
      username: user.username,
      displayName: user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user.username || user.email.split('@')[0],
      avatar: user.avatar,
      role: user.role,
      memberSince: user.createdAt,
      lastActive: user.lastLoginAt,
      totalTransformations: user.usage.totalTransformations,
      monthlyUsage: user.usage.monthlyUsage,
      isEmailVerified: user.isEmailVerified
    };

    res.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Error fetching user summary:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
