/**
 * 🔐 Auth0 Middleware Suite
 * 
 * Consolidated Auth0 authentication and user synchronization middleware.
 * 
 * This file provides:
 * - JWT token verification (re-exported from jwt-verification.ts)
 * - User synchronization between Auth0 and MongoDB
 * - Optional authentication for public routes
 * 
 * Usage:
 * - For protected routes: verifyAuth0Token + syncAuth0User
 * - For optional auth routes: optionalAuth0
 * 
 * @see jwt-verification.ts for JWT-specific configuration
 */

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { MongoUser, IMongoUser } from '../models/mongo-user';
import { generateUsernameFromAuth0, ensureUniqueUsername } from '../utils/username-generator';
import { syncAuth0Fields, logSyncResults } from '../utils/auth0-sync';
import { serializeMongoUser } from '../utils/userSerializer';
import { shouldPerformFullSync, updateSessionOnly } from '../utils/session-tracker';
import { HttpStatus } from '../constants/http-status';
import { ProcessedAuth0User } from '../types/common';
import { safeGetAuth0Claims } from '../utils/auth0-claims';

export { verifyAuth0Token } from './jwt-verification';

/**
 * Helper function to verify Auth0 token with error handling
 * Used internally by optionalAuth0 middleware
 */
const tryVerifyAuth0Token = async (req: Request, res: Response): Promise<boolean> => {
  try {
    const { verifyAuth0Token } = await import('./jwt-verification');
    
    return new Promise<boolean>((resolve) => {
      verifyAuth0Token(req, res, (err: unknown) => {
        if (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          console.log('⚠️ Optional Auth0 verification failed:', errorMessage);
          resolve(false);
        } else {
          console.log('✅ Auth0 token verified successfully');
          resolve(true);
        }
      });
    });
  } catch (error) {
    console.error('❌ Error during token verification:', error);
    return false;
  }
};

/**
 * Helper function to sync Auth0 user with error handling
 * Used internally by optionalAuth0 middleware
 */
const trySyncAuth0User = async (req: Request, res: Response): Promise<void> => {
  return new Promise<void>((resolve) => {
    syncAuth0User(req, res, () => {
      console.log('✅ User sync completed');
      resolve();
    });
  });
};

/**
 * Middleware to sync Auth0 user with MongoDB and attach user context
 */
export const syncAuth0User = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check database connection
    if (!mongoose.connection.readyState) {
      console.error('MongoDB not connected - skipping user sync');
      next();
      return;
    }

    const jwtPayload = req.user; // Raw JWT payload from Auth0
    
    if (!jwtPayload || !jwtPayload.sub) {
      next();
      return;
    }

    // Process the Auth0 JWT payload into a standardized format
    const claims = safeGetAuth0Claims(jwtPayload);
    const auth0User: ProcessedAuth0User = {
      id: claims.sub, // Added to satisfy required property
      sub: claims.sub,
      email: claims.email,
      emailVerified: claims.emailVerified,
      name: claims.name,
      givenName: claims.givenName,
      familyName: claims.familyName,
      nickname: claims.nickname,
      picture: claims.picture,
      locale: claims.locale,
      updatedAt: claims.updatedAt
    };
    const userId = jwtPayload.sub;
    const needsFullSync = shouldPerformFullSync(userId);
    
    let mongoUser = await MongoUser.findOne({ auth0Id: jwtPayload.sub });

    // Create new user if doesn't exist
    if (!mongoUser) {
      const baseUsername = generateUsernameFromAuth0(auth0User);
      const username = await ensureUniqueUsername(
        baseUsername,
        async (u) => Boolean(await MongoUser.findOne({ username: u }))
      );

      // Enhanced name extraction from Auth0/Google data
      const firstName = auth0User.givenName || 
                       auth0User.name?.split(' ')[0] || 
                       (auth0User.email ? auth0User.email.split('@')[0] : '') || 
                       '';
      const lastName = auth0User.familyName || 
                      (auth0User.name ? auth0User.name.split(' ').slice(1).join(' ') : '') || 
                      '';

      console.log('🔍 Creating new user with name data:', {
        auth0Name: auth0User.name,
        givenName: auth0User.givenName,
        familyName: auth0User.familyName,
        extractedFirstName: firstName,
        extractedLastName: lastName
      });

      mongoUser = new MongoUser({
        auth0Id: jwtPayload.sub,
        email: auth0User.email || `user-${jwtPayload.sub}@temp.com`,
        username: username,
        firstName: firstName,
        lastName: lastName,
        avatar: auth0User.picture || '',
        isEmailVerified: auth0User.emailVerified || false,
        role: 'user',
        membership: 'free', // Default membership for new users
        preferences: {
          theme: 'light',
          language: 'en',
          notifications: true
        },
        usage: {
          totalTransformations: 0,
          monthlyUsage: 0,
          usageResetDate: new Date()
        }
      });

      await mongoUser.save();
      console.log('✅ New user created with name:', { firstName, lastName });
    } else if (needsFullSync) {
      const syncResult = syncAuth0Fields(mongoUser, auth0User);
      
      // Add extra logging for name sync
      console.log('🔄 Syncing existing user names:', {
        currentFirstName: mongoUser.firstName,
        currentLastName: mongoUser.lastName,
        auth0GivenName: auth0User.givenName,
        auth0FamilyName: auth0User.familyName,
        auth0FullName: auth0User.name,
        syncUpdated: syncResult.updated
      });
      
      if (syncResult.updated) {
        await mongoUser.save();
        logSyncResults(userId, syncResult);
      }
    } else {
      // Check if user has empty names and Auth0 has name data - force sync
      const hasEmptyNames = !mongoUser.firstName || !mongoUser.lastName;
      const hasAuth0Names = auth0User.givenName || auth0User.familyName || auth0User.name;
      
      if (hasEmptyNames && hasAuth0Names) {
        console.log('🔧 Force syncing names for user with empty name fields:', {
          userId: mongoUser._id,
          currentFirstName: mongoUser.firstName,
          currentLastName: mongoUser.lastName,
          auth0Data: {
            givenName: auth0User.givenName,
            familyName: auth0User.familyName,
            name: auth0User.name
          }
        });
        
        const firstName = auth0User.givenName || 
                         (auth0User.name ? auth0User.name.split(' ')[0] : '') || 
                         '';
        const lastName = auth0User.familyName || 
                        (auth0User.name ? auth0User.name.split(' ').slice(1).join(' ') : '') || 
                        '';
        
        if (firstName || lastName) {
          mongoUser.firstName = firstName;
          mongoUser.lastName = lastName;
          await mongoUser.save();
          console.log('✅ Names force synced:', { firstName, lastName });
        }
      }
      
      updateSessionOnly(userId);
    }

    // Set user context directly
    req.userContext = {
      mongoUser,
      auth0User,
      jwtPayload
    };

    next();
  } catch (error) {
    console.error('Error syncing Auth0 user:', error);
    
    // For user-facing routes, don't break the entire request chain
    if (req.path.includes('/api/user/')) {
      next();
    } else {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to sync user data',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
};

// Optional Auth0 middleware for routes that can work without authentication
export const optionalAuth0 = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('🔍 optionalAuth0 middleware called for:', req.path);
  
  try {
    // Check if Auth0 is properly configured
    if (!process.env.AUTH0_DOMAIN) {
      console.log('⚠️ AUTH0_DOMAIN not configured, skipping auth');
      next();
      return;
    }

    // Try to verify token but don't fail if it's missing
    const authHeader = req.headers.authorization;
    console.log('🔑 Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.log('📝 No auth header, proceeding without authentication');
      next();
      return;
    }

    // Try to verify the token
    const tokenVerified = await tryVerifyAuth0Token(req, res);

    // If token was verified, sync the user
    if (tokenVerified && req.user) {
      console.log('👤 User found, attempting sync...');
      await trySyncAuth0User(req, res);
    } else {
      console.log('👤 No user to sync');
    }

    console.log('✅ optionalAuth0 middleware completed successfully');
    next();
  } catch (error) {
    console.error('❌ Optional Auth0 error:', error);
    console.log('🔄 Continuing without authentication due to error');
    next(); // Continue without authentication
  }
};

/**
 * 📋 Exported Auth0 Middleware Functions
 * 
 * Main exports from this module:
 * - verifyAuth0Token: Strict JWT verification (re-exported)
 * - syncAuth0User: Sync Auth0 user with MongoDB
 * - optionalAuth0: Optional authentication for public routes
 */
