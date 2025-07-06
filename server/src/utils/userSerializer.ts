// User serialization utilities to avoid response duplication

import { IMongoUser } from '../models/MongoUser';

export interface SerializedUser {
  id: string;
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
    lastTransformation?: string;
    usageResetDate: string;
  };
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

/**
 * Serialize a MongoDB user for API responses
 * Provides consistent user data structure across all endpoints
 */
export function serializeUser(user: IMongoUser): SerializedUser {
  // Safety check: Log the user object if any critical fields are missing for debugging
  if (!user?._id || !user?.auth0Id || !user?.email || !user?.username) {
    console.warn('serializeUser: Incomplete user object detected:', {
      hasId: !!user?._id,
      hasAuth0Id: !!user?.auth0Id,
      hasEmail: !!user?.email,
      hasUsername: !!user?.username,
      userKeys: user ? Object.keys(user) : 'user is null/undefined'
    });
  }

  // Safely handle user ID conversion
  const userId = user?._id?.toString() || 'unknown';

  // Safely handle dates with fallbacks using safe conversion utilities
  const now = new Date();
  const safeCreatedAt = safeDate(user?.createdAt, now);
  const safeUpdatedAt = safeDate(user?.updatedAt, now);

  // Safely handle usage object
  const usage = user?.usage || {};
  const safeUsageResetDate = safeDate(usage.usageResetDate, now);

  // Safely handle preferences with defaults
  const preferences = user?.preferences || {
    theme: 'light',
    language: 'en',
    notifications: true
  };

  return {
    id: userId,
    auth0Id: user?.auth0Id || '',
    email: user?.email || '',
    username: user?.username || '',
    firstName: user?.firstName || undefined,
    lastName: user?.lastName || undefined,
    avatar: user?.avatar || undefined,
    isEmailVerified: user?.isEmailVerified || false,
    role: user?.role || 'user',
    preferences: {
      theme: preferences.theme || 'light',
      language: preferences.language || 'en',
      notifications: preferences.notifications !== false // default to true
    },
    usage: {
      totalTransformations: usage.totalTransformations || 0,
      monthlyUsage: usage.monthlyUsage || 0,
      lastTransformation: usage.lastTransformation ? safeToISOString(usage.lastTransformation) : undefined,
      usageResetDate: safeUsageResetDate.toISOString()
    },
    createdAt: safeCreatedAt.toISOString(),
    updatedAt: safeUpdatedAt.toISOString(),
    lastLoginAt: user?.lastLoginAt ? safeToISOString(user.lastLoginAt) : undefined
  };
}

/**
 * Serialize user usage data only
 */
export function serializeUserUsage(user: IMongoUser) {
  // Safely handle usage object
  const usage = user?.usage || {};
  const now = new Date();
  const safeUsageResetDate = safeDate(usage.usageResetDate, now);

  return {
    totalTransformations: usage.totalTransformations || 0,
    monthlyUsage: usage.monthlyUsage || 0,
    lastTransformation: usage.lastTransformation ? safeToISOString(usage.lastTransformation) : undefined,
    usageResetDate: safeUsageResetDate.toISOString()
  };
}

/**
 * Standard success response wrapper
 */
export function createSuccessResponse<T>(data: T, message?: string) {
  return {
    success: true,
    ...(message && { message }),
    data
  };
}

/**
 * Standard error response wrapper
 */
export function createErrorResponse(error: string, statusCode?: number) {
  return {
    success: false,
    error,
    ...(statusCode && { statusCode })
  };
}

/**
 * Safely log user objects to avoid circular reference issues
 */
export function safeLogUser(user: any, label: string = 'User object'): void {
  try {
    const safeUser = {
      _id: user?._id?.toString(),
      auth0Id: user?.auth0Id,
      email: user?.email,
      username: user?.username,
      hasUsage: !!user?.usage,
      hasPreferences: !!user?.preferences,
      createdAt: user?.createdAt,
      updatedAt: user?.updatedAt,
      lastLoginAt: user?.lastLoginAt,
      // Add any other critical fields for debugging
      type: user?.constructor?.name || typeof user
    };
    console.log(`${label}:`, JSON.stringify(safeUser, null, 2));
  } catch (error) {
    console.log(`${label}: [Error serializing user object]`, error);
  }
}

/**
 * Safely convert a value to a valid ISO string date
 * Returns fallback date if input is invalid, null, or undefined
 */
export function safeToISOString(dateValue: any, fallback: Date = new Date()): string {
  try {
    // Handle null, undefined, or empty values
    if (dateValue == null || dateValue === '') {
      return fallback.toISOString();
    }

    // Create Date object
    const date = new Date(dateValue);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn('safeToISOString: Invalid date detected:', dateValue, 'using fallback');
      return fallback.toISOString();
    }
    
    return date.toISOString();
  } catch (error) {
    console.warn('safeToISOString: Error converting date:', dateValue, error);
    return fallback.toISOString();
  }
}

/**
 * Safely create a Date object with fallback
 */
export function safeDate(dateValue: any, fallback: Date = new Date()): Date {
  try {
    if (dateValue == null || dateValue === '') {
      return fallback;
    }

    const date = new Date(dateValue);
    
    if (isNaN(date.getTime())) {
      console.warn('safeDate: Invalid date detected:', dateValue, 'using fallback');
      return fallback;
    }
    
    return date;
  } catch (error) {
    console.warn('safeDate: Error creating date:', dateValue, error);
    return fallback;
  }
}
