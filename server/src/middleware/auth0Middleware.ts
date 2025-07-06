import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { MongoUser, IMongoUser } from '../models/MongoUser';
import { generateUsernameFromAuth0, ensureUniqueUsername } from '../utils/usernameGenerator';
import { syncAuth0Fields, logSyncResults } from '../utils/auth0Sync';
import { serializeUser } from '../utils/userSerializer';
import { shouldPerformFullSync, updateSessionOnly } from '../utils/sessionTracker';
import { setUserContext } from '../utils/migrationHelpers';

export { verifyAuth0Token } from './jwtVerification';

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

    const auth0User = (req as any).user;
    
    if (!auth0User || !auth0User.sub) {
      next();
      return;
    }

    const userId = auth0User.sub;
    const needsFullSync = shouldPerformFullSync(userId);
    
    let mongoUser = await MongoUser.findOne({ auth0Id: auth0User.sub });

    // Create new user if doesn't exist
    if (!mongoUser) {
      const baseUsername = generateUsernameFromAuth0(auth0User);
      const username = await ensureUniqueUsername(
        baseUsername,
        async (u) => Boolean(await MongoUser.findOne({ username: u }))
      );

      mongoUser = new MongoUser({
        auth0Id: auth0User.sub,
        email: auth0User.email || `user-${auth0User.sub}@temp.com`,
        username: username,
        firstName: auth0User.given_name || auth0User.name?.split(' ')[0] || '',
        lastName: auth0User.family_name || auth0User.name?.split(' ').slice(1).join(' ') || '',
        avatar: auth0User.picture || '',
        isEmailVerified: auth0User.email_verified || false,
        role: 'user',
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
    } else if (needsFullSync) {
      const syncResult = syncAuth0Fields(mongoUser, auth0User);
      
      if (syncResult.updated) {
        await mongoUser.save();
        logSyncResults(userId, syncResult);
      }
    } else {
      updateSessionOnly(userId);
    }

    // Set user context using the migration-safe helper
    setUserContext(req, {
      mongoUser,
      auth0User,
      userId: (mongoUser._id as any).toString()
    });

    next();
  } catch (error) {
    console.error('Error syncing Auth0 user:', error);
    
    // For user-facing routes, don't break the entire request chain
    if (req.path.includes('/api/user/')) {
      next();
    } else {
      res.status(500).json({
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
  try {
    // Try to verify token but don't fail if it's missing
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      next();
      return;
    }

    // Import the JWT verification function
    const { verifyAuth0Token } = await import('./jwtVerification');

    // Use the verification logic but catch errors
    await new Promise<void>((resolve, reject) => {
      verifyAuth0Token(req, res, (err: any) => {
        if (err) {
          // Log the error but don't fail the request
          console.log('Optional Auth0 verification failed:', err.message);
          resolve();
        } else {
          resolve();
        }
      });
    });

    // If token was verified, sync the user
    if ((req as any).user) {
      await syncAuth0User(req, res, () => {});
    }

    next();
  } catch (error) {
    console.error('Optional Auth0 error:', error);
    next(); // Continue without authentication
  }
};
