/**
 * Usage Limit Enforcement Middleware
 *
 * This module provides middleware to enforce monthly usage limits based on
 * user membership tiers. It prevents users from exceeding their allocated
 * usage quotas and provides informative responses about current usage status.
 *
 * Features:
 * - Membership-based usage limit enforcement
 * - Configurable limit checking with override options
 * - Strict authentication variants for sensitive endpoints
 * - Detailed usage information attachment to requests
 * - Graceful fallback when limit checking fails
 * - Comprehensive logging for usage monitoring
 *
 * The middleware integrates with the user management system to provide
 * seamless usage tracking and limit enforcement across the application.
 */

import { Request, Response, NextFunction } from 'express';
import { getUserUsageLimit } from '../utils/usage-tracking';
import { createErrorResponse } from '../utils/userSerializer';
import { HttpStatus } from '../constants/http-status';
import { logger } from '../utils/logger';
import { ErrorMapper } from '../../../shared/types/errors';

/**
 * Configuration options for usage limit checking
 */
export interface UsageLimitOptions {
  /** Skip the usage limit check entirely */
  skipCheck?: boolean;
  /** Allow requests even when usage limit is exceeded */
  allowOverage?: boolean;
  /** Override the default usage limit with a custom value */
  customLimit?: number;
}

/**
 * Middleware to check if user has exceeded their monthly usage limit
 *
 * This middleware enforces usage limits based on user membership tiers:
 * - Checks current usage against membership-based limits
 * - Blocks requests when limits are exceeded (unless allowOverage is true)
 * - Attaches usage information to the request for downstream use
 * - Logs usage violations for monitoring
 * - Gracefully handles unauthenticated users and errors
 *
 * @param options Configuration options for limit checking behavior
 * @returns Express middleware function
 */
export const checkUsageLimit = (options: UsageLimitOptions = {}) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { skipCheck = false, allowOverage = false, customLimit } = options;

    // Skip limit enforcement if explicitly requested (for admin operations, etc.)
    if (skipCheck) {
      next();
      return;
    }

    try {
      const mongoUser = req.userContext?.mongoUser;

      // Allow unauthenticated users to proceed but log the attempt for monitoring
      if (!mongoUser) {
        logger.usage.warn('Usage limit check requested for unauthenticated user', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        });
        next();
        return;
      }

      // Determine usage limit from membership tier or custom override
      const usageLimit = customLimit || getUserUsageLimit(mongoUser);
      const currentUsage = mongoUser.usage?.monthlyUsage || 0;

      logger.usage.debug('Checking usage limit', {
        userId: mongoUser._id,
        membership: mongoUser.membership,
        currentUsage,
        usageLimit,
        allowOverage,
      });

      // Enforce usage limit unless overage is explicitly allowed
      if (currentUsage >= usageLimit && !allowOverage) {
        logger.usage.warn('User exceeded usage limit', {
          userId: mongoUser._id,
          membership: mongoUser.membership,
          currentUsage,
          usageLimit,
        });

        // Create user-friendly error with specific usage details
        const userFriendlyError = ErrorMapper.mapUsageLimitError({
          currentUsage,
          usageLimit,
          membership: mongoUser.membership,
        });

        res.status(HttpStatus.TOO_MANY_REQUESTS).json({
          success: false,
          error: userFriendlyError.message,
          errorCode: userFriendlyError.code,
          title: userFriendlyError.title,
          helpText: userFriendlyError.helpText,
          actionText: userFriendlyError.actionText,
          limitExceeded: true,
          upgradeUrl: userFriendlyError.upgradeUrl,
          currentUsage: userFriendlyError.currentUsage,
          usageLimit: userFriendlyError.usageLimit,
          membership: userFriendlyError.membership,
          timestamp: userFriendlyError.timestamp,
        });
        return;
      }

      // Attach comprehensive usage information to request for downstream middleware
      (req as Request & { usageInfo: unknown }).usageInfo = {
        currentUsage,
        usageLimit,
        membership: mongoUser.membership,
        remainingUsage: Math.max(0, usageLimit - currentUsage),
      };

      next();
    } catch (error) {
      logger.usage.error('Error checking usage limit', error);

      // Fail open - allow the request to continue if limit checking fails
      // This ensures system availability even when usage tracking has issues
      logger.usage.warn('Usage limit check failed, allowing request to continue');
      next();
    }
  };
};

/**
 * Strict usage limit middleware for authenticated users only
 *
 * This variant requires user authentication and rejects unauthenticated requests.
 * It's designed for sensitive endpoints that should only be accessed by
 * authenticated users with valid usage limits.
 *
 * @param options Configuration options for limit checking behavior
 * @returns Express middleware function that requires authentication
 */
export const checkUsageLimitStrict = (options: UsageLimitOptions = {}) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const mongoUser = req.userContext?.mongoUser;

    // Reject unauthenticated requests immediately
    if (!mongoUser) {
      res
        .status(HttpStatus.UNAUTHORIZED)
        .json(createErrorResponse('Authentication required for this operation'));
      return;
    }

    // Delegate to regular usage limit check for authenticated users
    return checkUsageLimit(options)(req, res, next);
  };
};

/**
 * Extract usage information from request object
 *
 * Retrieves usage information that was attached by the checkUsageLimit middleware.
 * This provides access to current usage statistics for downstream processing.
 *
 * @param req Express request object
 * @returns Usage information object or null if not available
 */
export const getUsageInfo = (
  req: Request,
): {
  currentUsage: number;
  usageLimit: number;
  membership: string;
  remainingUsage: number;
} | null => {
  return (
    (
      req as Request & {
        usageInfo?: {
          currentUsage: number;
          usageLimit: number;
          membership: string;
          remainingUsage: number;
        };
      }
    ).usageInfo || null
  );
};
