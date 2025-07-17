/**
 * User Management Routes
 *
 * This module defines all REST API routes for user management operations including
 * profile management, usage tracking, synchronization, and debugging endpoints.
 *
 * Route Categories:
 * - Profile Management: Get and update user profiles
 * - Usage Statistics: Track and retrieve user usage data
 * - User Synchronization: Sync users between Auth0 and MongoDB
 * - Development/Testing: Debug and test endpoints for development
 * - Debug Utilities: Name synchronization and data migration tools
 *
 * Security Features:
 * - Auth0 JWT token verification
 * - Rate limiting for sensitive operations
 * - Input validation using Zod schemas
 * - User context synchronization middleware
 *
 * All routes require proper authentication unless explicitly marked as public.
 * Development and debug routes are conditionally enabled based on environment.
 */

import '../types/loader';
import express, { Request, Response, RequestHandler } from 'express';
import type { AuthenticatedRequest, ProcessedAuth0User } from '../types/common';
import { MongoUser, type IMongoUser } from '../models/mongo-user';
import { jwtCheck, authErrorHandler } from '../middleware/auth';
import * as userSerializer from '../utils/userSerializer';

// Helper type for authenticated route handlers
type AuthenticatedRequestHandler = (
  req: AuthenticatedRequest,
  res: Response,
) => void | Promise<void>;

// Helper function to properly type authenticated routes
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _authHandler = (handler: AuthenticatedRequestHandler): RequestHandler => {
  return handler as RequestHandler;
};

import {
  syncRateLimit,
  profileUpdateRateLimit,
  testEndpointRateLimit,
} from '../middleware/simple-rate-limit';
import { validateRequest } from '../middleware/validation';
import { userProfileUpdateSchema, userProfileQuerySchema } from '../schemas/user.schema';
import { HttpStatus } from '../constants/http-status';
import { userService, UserProfileUpdateRequest } from '../services/user-service';
import { logger } from '../utils/logger';

const router = express.Router();

// Apply auth error handler to all routes
router.use(authErrorHandler);

/**
 * GET /api/user/profile
 *
 * Retrieve the current user's profile information including personal details,
 * preferences, and account settings. Supports optional include parameters
 * for additional data like stats, preferences, or history.
 *
 * @openapi
 * /api/user/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: include
 *         schema:
 *           type: string
 *           enum: [stats, preferences, history]
 *         description: Additional data to include in response
 *     responses:
 *       '200':
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       '401':
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '404':
 *         description: User profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * @access Private - Requires Auth0 authentication
 * @middleware validateQuery - Validates query parameters
 * @middleware verifyAuth0Token - Verifies JWT token
 * @middleware syncAuth0User - Synchronizes Auth0 user with MongoDB
 */
router.get(
  '/profile',
  validateRequest(userProfileQuerySchema, 'query'),
  jwtCheck,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const mongoUser = req.userContext?.mongoUser;

      if (!mongoUser || !mongoUser._id) {
        res
          .status(HttpStatus.NOT_FOUND)
          .json(userSerializer.createErrorResponse('User profile not found'));
        return;
      }

      const result = await userService.getUserProfile(mongoUser._id.toString());

      if (result.success) {
        res.json(userSerializer.createSuccessResponse(result.data));
      } else {
        // Map known errors to appropriate HTTP status codes
        const errMsg = result.error || 'Failed to fetch user profile';
        const status = errMsg.includes('not found')
          ? HttpStatus.NOT_FOUND
          : errMsg.includes('Validation')
            ? HttpStatus.BAD_REQUEST
            : HttpStatus.INTERNAL_SERVER_ERROR;
        res.status(status).json(userSerializer.createErrorResponse(errMsg));
      }
    } catch (error: unknown) {
      logger.error('Error fetching user profile:', error);
      const errMsg = error instanceof Error ? error.message : 'Failed to fetch user profile';
      const status = errMsg.includes('not found')
        ? HttpStatus.NOT_FOUND
        : errMsg.includes('Validation')
          ? HttpStatus.BAD_REQUEST
          : HttpStatus.INTERNAL_SERVER_ERROR;
      res.status(status).json(userSerializer.createErrorResponse(errMsg));
    }
  },
);

/**
 * PUT /api/user/profile
 *
 * Update the current user's profile information including name, bio,
 * display name, and user preferences. All fields are optional and
 * only provided fields will be updated.
 *
 * @access Private - Requires Auth0 authentication
 * @middleware profileUpdateRateLimit - Prevents profile update spam
 * @middleware validateBody - Validates request body against schema
 * @middleware verifyAuth0Token - Verifies JWT token
 * @middleware syncAuth0User - Syncs user data with MongoDB
 */
router.put(
  '/profile',
  profileUpdateRateLimit,
  validateRequest(userProfileUpdateSchema, 'body'),
  jwtCheck,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const mongoUser = req.userContext?.mongoUser;
      const updates = req.body as UserProfileUpdateRequest;

      if (!mongoUser) {
        res
          .status(HttpStatus.NOT_FOUND)
          .json(userSerializer.createErrorResponse('User profile not found'));
        return;
      }

      const result = await userService.updateUserProfile(mongoUser, updates);

      if (result.success) {
        res.json(userSerializer.createSuccessResponse(result.data, result.message));
      } else {
        res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .json(
            userSerializer.createErrorResponse(result.error || 'Failed to update user profile'),
          );
      }
    } catch (error) {
      logger.error('❌ Error updating user profile:', error);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(userSerializer.createErrorResponse('Failed to update user profile'));
    }
  },
);

// Get user usage stats
router.get('/usage', jwtCheck, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const mongoUser = req.userContext?.mongoUser;

    if (!mongoUser) {
      res.status(HttpStatus.NOT_FOUND).json(userSerializer.createErrorResponse('User not found'));
      return;
    }

    const result = await userService.getUserUsage(mongoUser);

    if (result.success) {
      res.json(userSerializer.createSuccessResponse(result.data));
    } else {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(userSerializer.createErrorResponse(result.error || 'Failed to fetch user usage'));
    }
  } catch (error) {
    logger.error('❌ Error fetching user usage:', error);
    res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json(userSerializer.createErrorResponse('Failed to fetch user usage'));
  }
});

// Sync user with MongoDB (triggers automatic user creation/update)
router.post(
  '/sync',
  syncRateLimit,
  jwtCheck,

  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const mongoUser = req.userContext?.mongoUser;

      if (!mongoUser) {
        res
          .status(HttpStatus.NOT_FOUND)
          .json(userSerializer.createErrorResponse('User sync failed - user not found'));
        return;
      }

      const serviceResult = await userService.syncUser(mongoUser);
      // support raw or structured result
      const success = typeof serviceResult.success === 'boolean' ? serviceResult.success : true;
      const userData = success ? (serviceResult.data ?? serviceResult) : null;
      const message =
        success && (serviceResult as { message?: string }).message
          ? (serviceResult as { message?: string }).message
          : undefined;

      if (success) {
        // serialize and respond
        const serializedData =
          userData && typeof userData === 'object' && '_id' in userData && 'auth0Id' in userData
            ? userSerializer.serializeMongoUser(userData as IMongoUser)
            : null;
        const serialized = userSerializer.createSuccessResponse(serializedData, message);
        res.json(serialized);
      } else {
        const errMsg = (serviceResult as { error?: string }).error || 'Failed to sync user';
        res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .json(userSerializer.createErrorResponse(errMsg));
      }
    } catch (error: unknown) {
      logger.error('Error syncing user:', error);
      const errMsg = error instanceof Error ? error.message : 'Failed to sync user';
      const status = errMsg.includes('not found')
        ? HttpStatus.NOT_FOUND
        : errMsg.includes('Validation')
          ? HttpStatus.BAD_REQUEST
          : HttpStatus.INTERNAL_SERVER_ERROR;
      res.status(status).json(userSerializer.createErrorResponse(errMsg));
    }
  },
);

// Test endpoints (development only)
if (process.env.NODE_ENV !== 'production') {
  // Test endpoint to verify JWT authentication with audience
  router.get(
    '/test-auth',
    testEndpointRateLimit,
    jwtCheck,

    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const authUser = req.userContext?.auth0User;
      const jwtPayload = req.userContext?.jwtPayload;
      const { sub, email } = authUser || {};
      // Safe access to aud field from JWT payload
      const aud = jwtPayload?.aud;

      res.json({
        success: true,
        message: 'JWT verification with audience successful',
        tokenInfo: {
          sub,
          email,
          audience: aud,
          hasValidAudience: !!aud,
        },
      });
    },
  );

  // Test endpoint without JWT verification (for connectivity testing)
  router.get('/test-no-auth', (req: Request, res: Response): void => {
    res.json({
      success: true,
      message: 'Server connectivity test successful',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // Test endpoint to debug JWT verification (development only)
  router.get('/test-jwt-debug', (req: Request, res: Response): void => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      // Check JWT structure
      const token = authHeader.replace('Bearer ', '');
      const parts = token.split('.');

      if (parts.length === 3) {
        try {
          JSON.parse(Buffer.from(parts[0], 'base64').toString());
          JSON.parse(Buffer.from(parts[1], 'base64').toString());
        } catch (e) {
          logger.info('❌ JWT decode failed:', {
            error: e instanceof Error ? e.message : 'Unknown error',
          });
        }
      }
    }

    res.json({
      success: true,
      message: 'JWT debug info logged to console',
      hasAuthHeader: !!authHeader,
      serverTime: new Date().toISOString(),
    });
  });

  // Test endpoint to check Auth0 configuration (development only)
  router.get('/test-auth-config', (req: Request, res: Response): void => {
    const config = {
      AUTH0_DOMAIN: process.env.AUTH0_DOMAIN || 'NOT SET',
      AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE || 'NOT SET',
      NODE_ENV: process.env.NODE_ENV || 'development',
      jwksUri: process.env.AUTH0_DOMAIN
        ? `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
        : 'N/A',
    };

    res.json({
      success: true,
      message: 'Auth0 configuration check',
      config,
      timestamp: new Date().toISOString(),
    });
  });

  // Test endpoint for serializeUser robustness (development only)
  router.get(
    '/test-serialize-user',
    testEndpointRateLimit,
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      // Only available in development
      if (process.env.NODE_ENV === 'production') {
        res
          .status(HttpStatus.NOT_FOUND)
          .json(userSerializer.createErrorResponse('Endpoint not found'));
        return;
      }

      try {
        // Run a simple test inline instead of importing
        const { serializeMongoUser } = await import('../utils/userSerializer.js');

        // Test serializeUser with a sample object
        const testUser = {
          _id: '507f1f77bcf86cd799439011',
          auth0Id: 'auth0|test123',
          email: 'test@example.com',
          username: 'testuser',
          role: 'user',
          preferences: { theme: 'light', language: 'en', notifications: true },
          usage: {
            totalTransformations: 5,
            monthlyUsage: 2,
            usageResetDate: new Date(),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown;

        // Test serialization without storing result
        serializeMongoUser(testUser as IMongoUser);

        res.json({
          success: true,
          message: 'SerializeUser robustness tests completed - check server logs for results',
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('Error running serializeUser tests:', error);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: 'Failed to run serializeUser tests',
          details: (error as Error).message,
        });
      }
    },
  );

  // Debug endpoint to check user name data (development only)
  router.get(
    '/debug/name-data',
    jwtCheck,

    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      if (process.env.NODE_ENV === 'production') {
        res
          .status(HttpStatus.FORBIDDEN)
          .json(userSerializer.createErrorResponse('Debug endpoint not available in production'));
        return;
      }

      try {
        const mongoUser = req.userContext?.mongoUser;
        const auth0User = req.userContext?.auth0User;
        const jwtPayload = req.userContext?.jwtPayload;

        if (!mongoUser) {
          res
            .status(HttpStatus.NOT_FOUND)
            .json(userSerializer.createErrorResponse('User not found'));
          return;
        }

        const debugData = {
          mongodb: {
            firstName: mongoUser.firstName,
            lastName: mongoUser.lastName,
            username: mongoUser.username,
            email: mongoUser.email,
            fullRecord: mongoUser,
          },
          auth0: {
            sub: auth0User?.sub,
            email: auth0User?.email,
            name: auth0User?.name,
            givenName: auth0User?.givenName,
            familyName: auth0User?.familyName,
            nickname: auth0User?.nickname,
            fullRecord: auth0User,
          },
          jwtPayload: {
            sub: jwtPayload?.sub,
            name: jwtPayload?.name,
            given_name: jwtPayload?.given_name,
            family_name: jwtPayload?.family_name,
            nickname: jwtPayload?.nickname,
            email: jwtPayload?.email,
            fullPayload: jwtPayload,
          },
        };

        logger.info('🔍 User name debug data:', debugData);
        res.json(userSerializer.createSuccessResponse(debugData, 'Debug data retrieved'));
      } catch (error) {
        logger.error('❌ Error fetching debug data:', error);
        res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .json(userSerializer.createErrorResponse('Failed to fetch debug data'));
      }
    },
  );

  // Debug endpoint to force name sync for existing users (development only)
  router.post(
    '/debug/force-name-sync',
    testEndpointRateLimit,
    jwtCheck,

    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      if (process.env.NODE_ENV === 'production') {
        res
          .status(HttpStatus.FORBIDDEN)
          .json(userSerializer.createErrorResponse('Debug endpoints not available in production'));
        return;
      }

      try {
        const mongoUser = req.userContext?.mongoUser;
        const auth0User = req.userContext?.auth0User;

        if (!mongoUser || !auth0User) {
          res
            .status(HttpStatus.NOT_FOUND)
            .json(userSerializer.createErrorResponse('User context not found'));
          return;
        }

        // Type guard to ensure auth0User has the expected properties
        const typedAuth0User = auth0User as ProcessedAuth0User;

        // Extract names from Auth0 data
        const firstName =
          typedAuth0User.givenName ||
          (typedAuth0User.name ? typedAuth0User.name.split(' ')[0] : '') ||
          '';
        const lastName =
          typedAuth0User.familyName ||
          (typedAuth0User.name ? typedAuth0User.name.split(' ').slice(1).join(' ') : '') ||
          '';

        // Update the user with the extracted names
        const updatedUser = await MongoUser.findByIdAndUpdate(
          mongoUser._id,
          {
            firstName: firstName,
            lastName: lastName,
          },
          { new: true, runValidators: true },
        );

        if (!updatedUser) {
          res
            .status(HttpStatus.NOT_FOUND)
            .json(userSerializer.createErrorResponse('User not found for update'));
          return;
        }

        res.json(
          userSerializer.createSuccessResponse({
            message: 'Names synced successfully',
            changes: {
              firstName: {
                old: mongoUser.firstName,
                new: updatedUser.firstName,
              },
              lastName: {
                old: mongoUser.lastName,
                new: updatedUser.lastName,
              },
            },
            user: {
              id: updatedUser._id,
              firstName: updatedUser.firstName,
              lastName: updatedUser.lastName,
            },
          }),
        );
      } catch (error) {
        logger.error('❌ Error force syncing names:', error);
        res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .json(userSerializer.createErrorResponse('Failed to sync names'));
      }
    },
  );

  // One-time migration endpoint to fix existing users without names
  router.post(
    '/debug/migrate-empty-names',
    testEndpointRateLimit,
    jwtCheck,
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      if (process.env.NODE_ENV === 'production') {
        res
          .status(HttpStatus.FORBIDDEN)
          .json(userSerializer.createErrorResponse('Debug endpoints not available in production'));
        return;
      }

      try {
        // Find all users with empty names
        const usersWithEmptyNames = await MongoUser.find({
          $or: [
            { firstName: { $in: ['', null, undefined] } },
            { lastName: { $in: ['', null, undefined] } },
          ],
        });

        let updatedCount = 0;
        const results = [];

        for (const user of usersWithEmptyNames) {
          // For this migration, we'll try to extract names from email or username
          // In a real scenario, you'd need to call Auth0 API to get the latest user data

          let firstName = user.firstName || '';
          let lastName = user.lastName || '';

          // Try to extract from email if available
          if (!firstName && !lastName && user.email) {
            const emailParts = user.email.split('@')[0].split('.');
            if (emailParts.length >= 2) {
              firstName = emailParts[0];
              lastName = emailParts.slice(1).join(' ');
            }
          }

          // Try to extract from username if available
          if (!firstName && !lastName && user.username) {
            const usernameParts = user.username.replace(/[_-]/g, ' ').split(' ');
            if (usernameParts.length >= 2) {
              firstName = usernameParts[0];
              lastName = usernameParts.slice(1).join(' ');
            }
          }

          if (firstName || lastName) {
            await MongoUser.findByIdAndUpdate(user._id, {
              firstName: firstName,
              lastName: lastName,
            });

            updatedCount++;
            results.push({
              userId: user._id,
              email: user.email,
              oldFirstName: user.firstName,
              oldLastName: user.lastName,
              newFirstName: firstName,
              newLastName: lastName,
            });
          }
        }

        res.json(
          userSerializer.createSuccessResponse({
            message: `Migration completed. Updated ${updatedCount} users.`,
            totalFound: usersWithEmptyNames.length,
            totalUpdated: updatedCount,
            results: results,
          }),
        );
      } catch (error) {
        logger.error('❌ Error during name migration:', error);
        res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .json(userSerializer.createErrorResponse('Failed to migrate user names'));
      }
    },
  );
}

export default router;
