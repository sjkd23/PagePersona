import { Request } from 'express';
import { IMongoUser } from '../models/MongoUser';

export interface UserContext {
  mongoUser: IMongoUser;
  auth0User?: any;
  userId: string;
}

export interface ValidationResult {
  isConsistent: boolean;
  issues: string[];
}

/**
 * Sets user context on the request object for downstream middleware and routes
 * This helper ensures consistent user context structure across the application
 */
export const setUserContext = (req: Request, context: UserContext): void => {
  // Extend the request object with user context
  (req as any).user = context.auth0User;
  (req as any).mongoUser = context.mongoUser;
  (req as any).userId = context.userId;
};

/**
 * Gets user context from the request object
 */
export const getUserContext = (req: Request): UserContext | null => {
  const mongoUser = (req as any).mongoUser;
  const auth0User = (req as any).user;
  const userId = (req as any).userId;

  if (!mongoUser || !userId) {
    return null;
  }

  return {
    mongoUser,
    auth0User,
    userId
  };
};

/**
 * Checks if user context is properly set on the request
 */
export const hasUserContext = (req: Request): boolean => {
  return !!(req as any).mongoUser && !!(req as any).userId;
};

/**
 * Validates that user context is consistent across the request object
 * This helps track migration progress and identify inconsistencies
 */
export const validateUserContextConsistency = (req: Request): ValidationResult => {
  const issues: string[] = [];
  const mongoUser = (req as any).mongoUser;
  const auth0User = (req as any).user;
  const userId = (req as any).userId;

  // Check if we have the new user context structure
  const hasNewContext = !!(mongoUser && userId);
  
  // Check for legacy fields that might still be present
  const hasLegacyFields = !!(req as any).auth0UserId || !!(req as any).legacyUser;

  if (hasNewContext && hasLegacyFields) {
    issues.push('Both new user context and legacy fields are present');
  }

  if (mongoUser && !userId) {
    issues.push('mongoUser is present but userId is missing');
  }

  if (userId && !mongoUser) {
    issues.push('userId is present but mongoUser is missing');
  }

  if (mongoUser && userId) {
    const mongoUserIdString = (mongoUser._id as any).toString();
    if (mongoUserIdString !== userId) {
      issues.push(`userId mismatch: mongoUser._id (${mongoUserIdString}) !== userId (${userId})`);
    }
  }

  return {
    isConsistent: issues.length === 0,
    issues
  };
};
