// ==========================================
// 🧠 CONSOLIDATED USER SERIALIZATION UTILITIES  
// ==========================================
//
// This module consolidates all user serialization logic to avoid duplication
// and provide consistent, type-safe serializers across the application.
// 
// MAIN FUNCTIONS:
// • serializeMongoUser()     - Serialize MongoDB user documents 
// • serializeAuth0User()     - Serialize Auth0 JWT payloads/user objects
// • normalizeUserContext()   - Normalize mixed user context from middleware
// • serializeUserUsage()     - Extract just usage statistics
// • serializeUserSummary()   - Create user summaries for dashboards
//
// MIGRATION NOTES:
// - serializeUser() is deprecated, use serializeMongoUser() instead
// - All controller inline serialization has been moved here
// - Auth0 claim processing is centralized via auth0Claims.ts
//
// ==========================================

import { IMongoUser } from '../models/mongo-user';
import type { ProcessedAuth0User, DateLike } from '../types/common';
import { safeGetAuth0Claims, safeGetEmail, safeGetDisplayName } from './auth0-claims';

// ==========================================
// TYPE DEFINITIONS
// ==========================================

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
  membership: string;
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

export interface SerializedAuth0User {
  sub: string;
  email: string | null;
  emailVerified: boolean;
  name?: string;
  givenName?: string;
  familyName?: string;
  nickname?: string;
  picture?: string;
  locale?: string;
  updatedAt?: string;
}

export interface SerializedUserUsage {
  totalTransformations: number;
  monthlyUsage: number;
  lastTransformation?: string;
  usageResetDate: string;
}

export interface SerializedUserSummary {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  role: string;
  membership: string;
  memberSince: string;
  lastActive?: string;
  totalTransformations: number;
  monthlyUsage: number;
  isEmailVerified: boolean;
}

export interface NormalizedUserContext {
  mongoUser: SerializedUser;
  auth0User: SerializedAuth0User;
  userId: string;
  isNewUser: boolean;
}

// ==========================================
// MAIN SERIALIZATION FUNCTIONS
// ==========================================

/**
 * Serialize a MongoDB user for API responses
 * Provides consistent user data structure across all endpoints
 */
export function serializeMongoUser(user: IMongoUser): SerializedUser {
  // Safety check: Log the user object if any critical fields are missing for debugging
  if (!user?._id || !user?.auth0Id || !user?.email || !user?.username) {
    console.warn('serializeMongoUser: Incomplete user object detected:', {
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
    membership: user?.membership || 'free',
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
 * Serialize Auth0 user data to a normalized format
 * Handles raw Auth0 JWT payloads or processed user objects
 */
export function serializeAuth0User(auth0User: any): SerializedAuth0User {
  if (!auth0User) {
    throw new Error('Auth0 user object is required for serialization');
  }

  try {
    const claims = safeGetAuth0Claims(auth0User);
    const email = safeGetEmail(auth0User);

    return {
      sub: claims.sub,
      email,
      emailVerified: claims.emailVerified || false,
      name: claims.name,
      givenName: claims.givenName,
      familyName: claims.familyName,
      nickname: claims.nickname,
      picture: claims.picture,
      locale: claims.locale,
      updatedAt: claims.updatedAt
    };
  } catch (error) {
    console.error('Failed to serialize Auth0 user:', error);
    throw new Error(`Auth0 user serialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Normalize user context from middleware into a consistent format
 * Combines MongoDB user, Auth0 user, and metadata
 */
export function normalizeUserContext(context: {
  mongoUser: IMongoUser;
  auth0User?: any;
  userId: string;
  isNewUser?: boolean;
}): NormalizedUserContext {
  if (!context.mongoUser || !context.userId) {
    throw new Error('MongoDB user and userId are required for context normalization');
  }

  const serializedMongoUser = serializeMongoUser(context.mongoUser);
  const serializedAuth0User = context.auth0User 
    ? serializeAuth0User(context.auth0User) 
    : {
        sub: context.mongoUser.auth0Id,
        email: context.mongoUser.email,
        emailVerified: context.mongoUser.isEmailVerified,
        name: context.mongoUser.firstName && context.mongoUser.lastName 
          ? `${context.mongoUser.firstName} ${context.mongoUser.lastName}` 
          : undefined,
        givenName: context.mongoUser.firstName,
        familyName: context.mongoUser.lastName,
        nickname: context.mongoUser.username,
        picture: context.mongoUser.avatar
      };

  return {
    mongoUser: serializedMongoUser,
    auth0User: serializedAuth0User,
    userId: context.userId,
    isNewUser: context.isNewUser || false
  };
}

/**
 * Create a user context from Auth0 user data for new user creation
 * This helps bridge Auth0 data to MongoDB user structure
 */
export function createUserContextFromAuth0(auth0User: any): {
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isEmailVerified: boolean;
} {
  const serializedAuth0 = serializeAuth0User(auth0User);
  
  return {
    email: serializedAuth0.email || `user-${serializedAuth0.sub}@temp.com`,
    firstName: serializedAuth0.givenName,
    lastName: serializedAuth0.familyName,
    avatar: serializedAuth0.picture,
    isEmailVerified: serializedAuth0.emailVerified
  };
}

// ==========================================
// SPECIALIZED SERIALIZATION FUNCTIONS
// ==========================================

/**
 * Serialize user usage data only
 */
export function serializeUserUsage(user: IMongoUser): SerializedUserUsage {
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
 * Serialize user summary for dashboard/profile displays
 */
export function serializeUserSummary(user: IMongoUser): SerializedUserSummary {
  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.username || user.email?.split('@')[0] || 'Unknown User';

  return {
    id: user._id?.toString() || 'unknown',
    email: user.email || '',
    username: user.username || '',
    displayName,
    avatar: user.avatar,
    role: user.role || 'user',
    membership: user.membership || 'free',
    memberSince: user.createdAt ? safeToISOString(user.createdAt) : new Date().toISOString(),
    lastActive: user.lastLoginAt ? safeToISOString(user.lastLoginAt) : undefined,
    totalTransformations: user.usage?.totalTransformations || 0,
    monthlyUsage: user.usage?.monthlyUsage || 0,
    isEmailVerified: user.isEmailVerified || false
  };
}

// ==========================================
// RESPONSE WRAPPER FUNCTIONS
// ==========================================

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

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Safely log user objects to avoid circular reference issues
 */

/**
 * Safely logs user information for debugging purposes
 * Handles potential sensitive data and provides structured output
 * 
 * @param user - User object of unknown structure
 * @param label - Label for the log output
 */
export function safeLogUser(user: unknown, label: string = 'User object'): void {
  if (!user || typeof user !== 'object') {
    console.log(`${label}: Invalid or null user`);
    return;
  }

  try {
    // Safe property access with type checking
    const userRecord = user as Record<string, unknown>;
    const safeUser = {
      _id: userRecord._id?.toString?.() || 'No ID',
      auth0Id: userRecord.auth0Id || 'No Auth0 ID',
      email: userRecord.email || 'No email',
      username: userRecord.username || 'No username',
      hasUsage: !!userRecord.usage,
      hasPreferences: !!userRecord.preferences,
      createdAt: userRecord.createdAt,
      updatedAt: userRecord.updatedAt,
      lastLoginAt: userRecord.lastLoginAt,
      // Add any other critical fields for debugging
      type: userRecord.constructor?.name || typeof user
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
export function safeToISOString(dateValue: DateLike | null | undefined, fallback: Date = new Date()): string {
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
export function safeDate(dateValue: DateLike, fallback: Date = new Date()): Date {
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
