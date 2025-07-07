import { Request, Response, NextFunction } from 'express';
import { MongoUser } from '../models/mongo-user';
import { getUserUsageLimit } from '../utils/usage-tracking';
import { createErrorResponse } from '../utils/userSerializer';
import { HttpStatus } from '../constants/http-status';
import { logger } from '../utils/logger';

export interface UsageLimitOptions {
  skipCheck?: boolean;
  allowOverage?: boolean;
  customLimit?: number;
}

/**
 * Middleware to check if user has exceeded their monthly usage limit based on membership
 */
export const checkUsageLimit = (options: UsageLimitOptions = {}) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { skipCheck = false, allowOverage = false, customLimit } = options;

    // Skip check if requested (for admin operations, etc.)
    if (skipCheck) {
      next();
      return;
    }

    try {
      const mongoUser = req.userContext?.mongoUser;

      // Allow unauthenticated users but log the attempt
      if (!mongoUser) {
        logger.usage.warn('Usage limit check requested for unauthenticated user', {
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        next();
        return;
      }

      // Get user's usage limit based on membership
      const usageLimit = customLimit || getUserUsageLimit(mongoUser);
      const currentUsage = mongoUser.usage?.monthlyUsage || 0;

      logger.usage.debug('Checking usage limit', {
        userId: mongoUser._id,
        membership: mongoUser.membership,
        currentUsage,
        usageLimit,
        allowOverage
      });

      // Check if user has exceeded their limit
      if (currentUsage >= usageLimit && !allowOverage) {
        logger.usage.warn('User exceeded usage limit', {
          userId: mongoUser._id,
          membership: mongoUser.membership,
          currentUsage,
          usageLimit
        });

        res.status(HttpStatus.TOO_MANY_REQUESTS).json({
          success: false,
          message: "You've hit your monthly limit. Upgrade to continue.",
          limitExceeded: true,
          upgradeUrl: "/pricing",
          currentUsage,
          usageLimit,
          membership: mongoUser.membership
        });
        return;
      }

      // Add usage info to request for downstream middleware
      (req as any).usageInfo = {
        currentUsage,
        usageLimit,
        membership: mongoUser.membership,
        remainingUsage: Math.max(0, usageLimit - currentUsage)
      };

      next();
    } catch (error) {
      logger.usage.error('Error checking usage limit', error);
      
      // Fail open - allow the request to continue if we can't check limits
      logger.usage.warn('Usage limit check failed, allowing request to continue');
      next();
    }
  };
};

/**
 * Middleware to check usage limit specifically for authenticated users
 * Rejects unauthenticated requests
 */
export const checkUsageLimitStrict = (options: UsageLimitOptions = {}) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const mongoUser = req.userContext?.mongoUser;

    if (!mongoUser) {
      res.status(HttpStatus.UNAUTHORIZED).json(
        createErrorResponse('Authentication required for this operation')
      );
      return;
    }

    // Delegate to regular usage limit check
    return checkUsageLimit(options)(req, res, next);
  };
};

/**
 * Get usage information from request (set by checkUsageLimit middleware)
 */
export const getUsageInfo = (req: Request): {
  currentUsage: number;
  usageLimit: number;
  membership: string;
  remainingUsage: number;
} | null => {
  return (req as any).usageInfo || null;
};
