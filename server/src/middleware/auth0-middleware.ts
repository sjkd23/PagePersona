/**
 * Auth0 Authentication and User Synchro    return new Promise<boolean>((resolve) => {
      verifyAuth0Token(req, res, (err: unknown) => {
        if (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          logger.debug('Optional Auth0 verification failed', { e    // Sync user data if token was verified successfully
    if (tokenVerified && req.user) {
      logger.debug('User found, attempting sync...');
      await trySyncAuth0User(req, res);
    } else {
      logger.debug('No user to sync');
    }

    logger.debug('optionalAuth0 middleware completed successfully');
    next();
  } catch (error) {
    logger.error('Optional Auth0 error', { error });
    logger.debug('Continuing without authentication due to error');
    next();
  }
};ge });
          resolve(false);
        } else {
          logger.debug('Auth0 token verified successfully');
          resolve(true);
        }
      });
    });
  } catch (error) {
    logger.error('Error during token verification', { error });
    return false;ware
 * 
 * This module provides comprehensive Auth0 integration middleware for
 * user authentication, token verification, and user data synchronization
 * between Auth0 and MongoDB.
 * 
 * Key Features:
 * - JWT token verification and validation
 * - Automatic user synchronization between Auth0 and MongoDB
 * - Optional authentication for public routes
 * - User context attachment for authenticated requests
 * - Graceful handling of authentication errors
 * 
 * Exported Middleware:
 * - verifyAuth0Token: Strict JWT verification for protected routes
 * - syncAuth0User: Synchronizes Auth0 user data with MongoDB
 * - optionalAuth0: Optional authentication for public routes
 */

import "../types/loader";
import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { MongoUser } from "../models/mongo-user";
import {
  generateUsernameFromAuth0,
  ensureUniqueUsername,
} from "../utils/username-generator";
import { syncAuth0Fields, logSyncResults } from "../utils/auth0-sync";
import {
  shouldPerformFullSync,
  updateSessionOnly,
} from "../utils/session-tracker";
import { HttpStatus } from "../constants/http-status";
import { ProcessedAuth0User, Auth0JwtPayload } from "../types/common";
import { safeGetAuth0Claims } from "../utils/auth0-claims";
import { logger } from "../utils/logger";

import jwtAuth from "./jwtAuth";

// Re-export the JWT middleware for backward compatibility
export const verifyAuth0Token = jwtAuth;

/**
 * Helper function to verify Auth0 token with error handling
 * Used internally by optionalAuth0 middleware for graceful token verification
 *
 * @param req Express request object
 * @param res Express response object
 * @returns Promise resolving to true if token is valid, false otherwise
 */
const tryVerifyAuth0Token = async (
  req: Request,
  res: Response,
): Promise<boolean> => {
  try {
    return new Promise<boolean>((resolve) => {
      jwtAuth(req, res, (err: unknown) => {
        if (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          logger.debug("Optional Auth0 verification failed", {
            error: errorMessage,
          });
          resolve(false);
        } else {
          logger.debug("Auth0 token verified successfully");
          resolve(true);
        }
      });
    });
  } catch (error) {
    logger.error("Error during token verification", { error });
    return false;
  }
};

/**
 * Helper function to sync Auth0 user with error handling
 * Used internally by optionalAuth0 middleware for graceful user synchronization
 *
 * @param req Express request object
 * @param res Express response object
 * @returns Promise that resolves when sync is complete
 */
const trySyncAuth0User = async (req: Request, res: Response): Promise<void> => {
  return new Promise<void>((resolve) => {
    syncAuth0User(req, res, () => {
      logger.debug("User sync completed");
      resolve();
    });
  });
};

/**
 * Middleware to sync Auth0 user data with MongoDB and attach user context
 *
 * This middleware performs the following operations:
 * 1. Validates database connection and JWT payload
 * 2. Creates new users in MongoDB if they don't exist
 * 3. Synchronizes existing user data with Auth0 claims
 * 4. Handles name extraction and username generation
 * 5. Attaches user context to the request object
 *
 * @param req Express request object
 * @param res Express response object
 * @param next Next function to continue middleware chain
 */
export const syncAuth0User = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Check database connection
    if (!mongoose.connection.readyState) {
      logger.error("MongoDB not connected - skipping user sync");
      next();
      return;
    }

    const jwtPayload = req.user as Auth0JwtPayload; // Raw JWT payload from Auth0

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
      updatedAt: claims.updatedAt,
    };
    const userId = jwtPayload.sub;
    const needsFullSync = shouldPerformFullSync(userId);

    let mongoUser = await MongoUser.findOne({ auth0Id: jwtPayload.sub });

    // Create new user if doesn't exist
    if (!mongoUser) {
      const baseUsername = generateUsernameFromAuth0(auth0User);
      const username = await ensureUniqueUsername(baseUsername, async (u) =>
        Boolean(await MongoUser.findOne({ username: u })),
      );

      // Enhanced name extraction from Auth0/Google authentication data
      const firstName =
        auth0User.givenName ||
        auth0User.name?.split(" ")[0] ||
        (auth0User.email ? auth0User.email.split("@")[0] : "") ||
        "";
      const lastName =
        auth0User.familyName ||
        (auth0User.name ? auth0User.name.split(" ").slice(1).join(" ") : "") ||
        "";

      logger.debug("Creating new user with name data", {
        auth0Name: auth0User.name,
        givenName: auth0User.givenName,
        familyName: auth0User.familyName,
        extractedFirstName: firstName,
        extractedLastName: lastName,
      });

      mongoUser = new MongoUser({
        auth0Id: jwtPayload.sub,
        email: auth0User.email || `user-${jwtPayload.sub}@temp.com`,
        username: username,
        firstName: firstName,
        lastName: lastName,
        avatar: auth0User.picture || "",
        isEmailVerified: auth0User.emailVerified || false,
        role: "user",
        membership: "free", // Default membership for new users
        preferences: {
          theme: "light",
          language: "en",
          notifications: true,
        },
        usage: {
          totalTransformations: 0,
          monthlyUsage: 0,
          usageResetDate: new Date(),
        },
      });

      await mongoUser.save();
      logger.debug("New user created with name", { firstName, lastName });
    } else if (needsFullSync) {
      const syncResult = syncAuth0Fields(mongoUser, auth0User);

      // Log name synchronization details for debugging
      logger.debug("Syncing existing user names", {
        currentFirstName: mongoUser.firstName,
        currentLastName: mongoUser.lastName,
        auth0GivenName: auth0User.givenName,
        auth0FamilyName: auth0User.familyName,
        auth0FullName: auth0User.name,
        syncUpdated: syncResult.updated,
      });

      if (syncResult.updated) {
        await mongoUser.save();
        logSyncResults(userId, syncResult);
      }
    } else {
      // Check if user has empty names and Auth0 has name data - force sync
      const hasEmptyNames = !mongoUser.firstName || !mongoUser.lastName;
      const hasAuth0Names =
        auth0User.givenName || auth0User.familyName || auth0User.name;

      // Force sync names for users with empty name fields when Auth0 has name data
      if (hasEmptyNames && hasAuth0Names) {
        logger.debug("Force syncing names for user with empty name fields", {
          userId: mongoUser._id,
          currentFirstName: mongoUser.firstName,
          currentLastName: mongoUser.lastName,
          auth0Data: {
            givenName: auth0User.givenName,
            familyName: auth0User.familyName,
            name: auth0User.name,
          },
        });

        const firstName =
          auth0User.givenName ||
          (auth0User.name ? auth0User.name.split(" ")[0] : "") ||
          "";
        const lastName =
          auth0User.familyName ||
          (auth0User.name
            ? auth0User.name.split(" ").slice(1).join(" ")
            : "") ||
          "";

        if (firstName || lastName) {
          mongoUser.firstName = firstName;
          mongoUser.lastName = lastName;
          await mongoUser.save();
          logger.debug("Names force synced", { firstName, lastName });
        }
      }

      updateSessionOnly(userId);
    }

    // Set user context directly
    req.userContext = {
      mongoUser,
      auth0User,
      jwtPayload,
    };

    next();
  } catch (error) {
    logger.error("Error syncing Auth0 user", { error });

    // For user-facing routes, don't break the entire request chain
    if (req.path.includes("/api/user/")) {
      next();
    } else {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: "Failed to sync user data",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};

/**
 * Optional Auth0 authentication middleware for routes that can work without authentication
 *
 * This middleware attempts to authenticate users when tokens are present but
 * gracefully continues without authentication if tokens are missing or invalid.
 * Useful for public routes that benefit from user context when available.
 *
 * @param req Express request object
 * @param res Express response object
 * @param next Next function to continue middleware chain
 */
export const optionalAuth0 = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  logger.debug("optionalAuth0 middleware called for", { path: req.path });

  try {
    // Check if Auth0 is properly configured
    if (!process.env.AUTH0_DOMAIN) {
      logger.debug("AUTH0_DOMAIN not configured, skipping authentication");
      next();
      return;
    }

    // Check for authorization header
    const authHeader = req.headers.authorization;
    logger.debug("Auth header present", { hasHeader: !!authHeader });

    if (!authHeader) {
      logger.debug("No auth header, proceeding without authentication");
      next();
      return;
    }

    // Attempt token verification
    const tokenVerified = await tryVerifyAuth0Token(req, res);

    // Sync user data if token was verified successfully
    if (tokenVerified && req.user) {
      logger.debug("User found, attempting sync...");
      await trySyncAuth0User(req, res);
    } else {
      logger.debug("No user to sync");
    }

    logger.debug("optionalAuth0 middleware completed successfully");
    next();
  } catch (error) {
    logger.error("Optional Auth0 error", { error });
    logger.debug("Continuing without authentication due to error");
    next(); // Continue without authentication
  }
};

/**
 * Exported Auth0 Middleware Functions
 *
 * This module exports the following middleware functions:
 * - verifyAuth0Token: Strict JWT verification for protected routes
 * - syncAuth0User: Synchronizes Auth0 user data with MongoDB
 * - optionalAuth0: Optional authentication for public routes
 */
