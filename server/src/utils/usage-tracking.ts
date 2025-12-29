import { MongoUser, IMongoUser } from "../models/mongo-user";
import { logger } from "./logger";

export interface UsageTrackingOptions {
  suppressErrors?: boolean;
  logSuccess?: boolean;
  logErrors?: boolean;
}

/**
 * Safely increment usage for a user by ID
 */
export async function incrementUserUsage(
  userId: string,
  options: UsageTrackingOptions = {},
): Promise<boolean> {
  const {
    suppressErrors = true,
    logSuccess = false,
    logErrors = true,
  } = options;

  try {
    const success = await MongoUser.incrementUsageById(userId);

    if (!success) {
      if (logErrors) {
        logger.usage.warn(
          `User not found or update failed for usage tracking: ${userId}`,
        );
      }
      return false;
    }

    if (logSuccess) {
      const userStats = await getUserUsageStats(userId);
      logger.usage.info(
        `Usage tracked for user: ${userId} (${userStats?.monthlyUsage || 0} this month)`,
      );
    }

    return true;
  } catch (error) {
    if (logErrors) {
      logger.usage.error("Failed to track usage", error);
    }

    if (!suppressErrors) {
      throw error;
    }

    return false;
  }
}

/**
 * Safely increment usage for a user by Auth0 ID
 */
export async function incrementUserUsageByAuth0Id(
  auth0Id: string,
  options: UsageTrackingOptions = {},
): Promise<boolean> {
  const {
    suppressErrors = true,
    logSuccess = false,
    logErrors = true,
  } = options;

  try {
    const mongoUser = await MongoUser.findByAuth0Id(auth0Id);
    if (!mongoUser) {
      if (logErrors) {
        logger.usage.warn(`User not found for usage tracking: ${auth0Id}`);
      }
      return false;
    }

    await mongoUser.incrementUsage();

    if (logSuccess) {
      logger.usage.info(
        `Usage tracked for user: ${auth0Id} (${mongoUser.usage.monthlyUsage} this month)`,
      );
    }

    return true;
  } catch (error) {
    if (logErrors) {
      logger.usage.error("Failed to track usage", error);
    }

    if (!suppressErrors) {
      throw error;
    }

    return false;
  }
}

/**
 * Check if user has exceeded usage limit
 */
export async function checkUserUsageLimit(
  userId: string,
  limit: number,
): Promise<{ allowed: boolean; currentUsage: number; limit: number }> {
  try {
    const mongoUser = await MongoUser.findById(userId);
    if (!mongoUser) {
      return { allowed: true, currentUsage: 0, limit };
    }

    const allowed = mongoUser.checkUsageLimit(limit);
    return {
      allowed,
      currentUsage: mongoUser.usage.monthlyUsage,
      limit,
    };
  } catch (error) {
    logger.usage.error("Failed to check usage limit", error);
    // Fail open - allow usage if check fails
    return { allowed: true, currentUsage: 0, limit };
  }
}

/**
 * Get usage statistics for a user
 */
export async function getUserUsageStats(userId: string): Promise<{
  totalTransformations: number;
  monthlyUsage: number;
  lastTransformation?: Date;
  usageResetDate: Date;
} | null> {
  try {
    const mongoUser = await MongoUser.findById(userId);
    if (!mongoUser) {
      return null;
    }

    return {
      totalTransformations: mongoUser.usage.totalTransformations,
      monthlyUsage: mongoUser.usage.monthlyUsage,
      lastTransformation: mongoUser.usage.lastTransformation,
      usageResetDate: mongoUser.usage.usageResetDate,
    };
  } catch (error) {
    logger.usage.error("Failed to get user usage stats", error);
    return null;
  }
}

/**
 * Get system-wide usage statistics
 */
export async function getSystemUsageStats(): Promise<{
  totalUsers: number;
  activeUsersThisMonth: number;
  totalTransformations: number;
} | null> {
  try {
    return await MongoUser.getUsageStats();
  } catch (error) {
    logger.usage.error("Failed to get system usage stats", error);
    return {
      totalUsers: 0,
      activeUsersThisMonth: 0,
      totalTransformations: 0,
    };
  }
}

/**
 * Usage limits by user role/tier
 */
export const USAGE_LIMITS = {
  free: 50, // 50 transformations per month
  premium: 500, // 500 transformations per month
  admin: 10000, // 10,000 transformations per month
} as const;

/**
 * Get usage limit for a user based on their membership
 */
export function getUserUsageLimit(user: IMongoUser): number {
  switch (user.membership) {
    case "admin":
      return USAGE_LIMITS.admin;
    case "premium":
      return USAGE_LIMITS.premium;
    default:
      return USAGE_LIMITS.free;
  }
}

/**
 * Bulk increment usage for multiple users (high-throughput scenarios)
 */
export async function bulkIncrementUsage(
  userIds: string[],
  options: UsageTrackingOptions = {},
): Promise<{ success: boolean; updated: number; total: number }> {
  const {
    suppressErrors = true,
    logSuccess = false,
    logErrors = true,
  } = options;

  try {
    const updated = await MongoUser.bulkIncrementUsage(userIds);

    if (logSuccess) {
      logger.usage.info(
        `Bulk usage tracked: ${updated}/${userIds.length} users updated`,
      );
    }

    return { success: true, updated, total: userIds.length };
  } catch (error) {
    if (logErrors) {
      logger.usage.error("Failed bulk usage tracking", error);
    }

    if (!suppressErrors) {
      throw error;
    }

    return { success: false, updated: 0, total: userIds.length };
  }
}

/**
 * Increment usage with automatic retry for high-concurrency scenarios
 */
export async function incrementUserUsageWithRetry(
  userId: string,
  maxRetries: number = 3,
  options: UsageTrackingOptions = {},
): Promise<boolean> {
  const { suppressErrors = true, logErrors = true } = options;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const success = await incrementUserUsage(userId, {
        ...options,
        logErrors: false,
      });
      if (success) {
        return true;
      }

      // Wait with exponential backoff before retry
      if (attempt < maxRetries) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 100),
        );
      }
    } catch (error) {
      if (attempt === maxRetries) {
        if (logErrors) {
          logger.usage.error(
            `Failed to track usage after ${maxRetries} attempts`,
            error,
          );
        }

        if (!suppressErrors) {
          throw error;
        }
      }
    }
  }

  return false;
}

/**
 * Safely increment failed attempt count for a user by ID
 */
export async function incrementUserFailedAttempt(
  userId: string,
  options: UsageTrackingOptions = {},
): Promise<boolean> {
  const {
    suppressErrors = true,
    logSuccess = false,
    logErrors = true,
  } = options;

  try {
    const success = await MongoUser.incrementFailedAttemptById(userId);

    if (!success) {
      if (logErrors) {
        logger.usage.warn(
          `User not found or update failed for failed attempt tracking: ${userId}`,
        );
      }
      return false;
    }

    if (logSuccess) {
      logger.usage.info(`Failed attempt tracked for user: ${userId}`);
    }

    return true;
  } catch (error) {
    if (logErrors) {
      logger.usage.error("Failed to track failed attempt", error);
    }

    if (!suppressErrors) {
      throw error;
    }

    return false;
  }
}
