import express, { Request, Response } from 'express';
import { MongoUser } from '../models/mongo-user';
import { verifyAuth0Token, syncAuth0User } from '../middleware/auth0-middleware';
import { createSuccessResponse, createErrorResponse, safeLogUser } from '../utils/userSerializer';
import { syncRateLimit, profileUpdateRateLimit, testEndpointRateLimit } from '../middleware/rate-limit-middleware';
import { validateBody, validateQuery } from '../middleware/zod-validation';
import { userSchemas } from '../middleware/validation-schemas';
import { HttpStatus } from '../constants/http-status';
import { userService } from '../services/user-service';

const router = express.Router();

// Get current user profile
router.get('/profile', validateQuery(userSchemas.profileQuery), verifyAuth0Token, syncAuth0User, async (req: Request, res: Response): Promise<void> => {
  try {
    const mongoUser = req.userContext?.mongoUser;
    
    if (!mongoUser || !mongoUser._id) {
      res.status(HttpStatus.NOT_FOUND).json(createErrorResponse('User profile not found'));
      return;
    }

    // Enhanced debug logging for name investigation
    console.log('🔍 Profile Request Debug:', {
      userId: mongoUser._id.toString(),
      email: mongoUser.email,
      firstName: mongoUser.firstName,
      lastName: mongoUser.lastName,
      firstNameType: typeof mongoUser.firstName,
      lastNameType: typeof mongoUser.lastName,
      firstNameLength: mongoUser.firstName ? mongoUser.firstName.length : 'null/undefined',
      lastNameLength: mongoUser.lastName ? mongoUser.lastName.length : 'null/undefined',
      auth0Data: req.userContext?.auth0User ? {
        name: req.userContext.auth0User.name,
        givenName: req.userContext.auth0User.givenName,
        familyName: req.userContext.auth0User.familyName
      } : 'Not available'
    });

    const result = await userService.getUserProfile(mongoUser._id.toString());
    
    if (result.success) {
      console.log('📋 Serialized Profile Data:', {
        firstName: result.data.firstName,
        lastName: result.data.lastName,
        firstNameType: typeof result.data.firstName,
        lastNameType: typeof result.data.lastName
      });
      res.json(createSuccessResponse(result.data));
    } else {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(createErrorResponse(result.error || 'Failed to fetch user profile'));
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(createErrorResponse('Failed to fetch user profile'));
  }
});

// Update user profile
router.put('/profile', profileUpdateRateLimit, validateBody(userSchemas.updateProfile), verifyAuth0Token, syncAuth0User, async (req: Request, res: Response): Promise<void> => {
  try {
    const mongoUser = req.userContext?.mongoUser;
    const updates = req.body;

    if (!mongoUser) {
      res.status(HttpStatus.NOT_FOUND).json(createErrorResponse('User profile not found'));
      return;
    }

    const result = await userService.updateUserProfile(mongoUser, updates);
    
    if (result.success) {
      res.json(createSuccessResponse(result.data, result.message));
    } else {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(createErrorResponse(result.error || 'Failed to update user profile'));
    }
  } catch (error) {
    console.error('❌ Error updating user profile:', error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(createErrorResponse('Failed to update user profile'));
  }
});

// Get user usage stats
router.get('/usage', verifyAuth0Token, syncAuth0User, async (req: Request, res: Response): Promise<void> => {
  try {
    const mongoUser = req.userContext?.mongoUser;
    
    if (!mongoUser) {
      res.status(HttpStatus.NOT_FOUND).json(createErrorResponse('User not found'));
      return;
    }

    const result = await userService.getUserUsage(mongoUser);
    
    if (result.success) {
      res.json(createSuccessResponse(result.data));
    } else {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(createErrorResponse(result.error || 'Failed to fetch user usage'));
    }
  } catch (error) {
    console.error('❌ Error fetching user usage:', error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(createErrorResponse('Failed to fetch user usage'));
  }
});

// Sync user with MongoDB (triggers automatic user creation/update)
router.post('/sync', syncRateLimit, verifyAuth0Token, syncAuth0User, async (req: Request, res: Response): Promise<void> => {
  try {
    const mongoUser = req.userContext?.mongoUser;
    
    if (!mongoUser) {
      res.status(HttpStatus.NOT_FOUND).json(createErrorResponse('User sync failed - user not found'));
      return;
    }

    const result = await userService.syncUser(mongoUser);
    
    if (result.success) {
      res.json(createSuccessResponse(result.data, result.message));
    } else {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(createErrorResponse(result.error || 'Failed to sync user'));
    }
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(createErrorResponse('Failed to sync user'));
  }
});

// Test endpoints (development only)
if (process.env.NODE_ENV !== 'production') {
  // Test endpoint to verify JWT authentication with audience
  router.get('/test-auth', testEndpointRateLimit, verifyAuth0Token, (req: Request, res: Response): void => {
    console.log('🧪 Test auth endpoint called - JWT verification successful');
    console.log('🧪 Auth0 user info:', req.userContext?.auth0User);
    
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
        hasValidAudience: !!aud
      }
    });
  });

  // Test endpoint without JWT verification (for connectivity testing)
  router.get('/test-no-auth', (req: Request, res: Response): void => {
    console.log('🧪 No-auth test endpoint called - server connectivity OK');
    
    res.json({
      success: true,
      message: 'Server connectivity test successful',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Test endpoint to debug JWT verification (development only)
  router.get('/test-jwt-debug', (req: Request, res: Response): void => {
    console.log('🧪 JWT Debug endpoint called');
    
    const authHeader = req.headers.authorization;
    console.log('🔍 Authorization header:', authHeader ? 'Present' : 'Missing');
    
    if (authHeader) {
      console.log('🔍 Header preview:', authHeader.substring(0, 30) + '...');
      
      // Check JWT structure
      const token = authHeader.replace('Bearer ', '');
      const parts = token.split('.');
      console.log('🔍 JWT parts:', parts.length);
      
      if (parts.length === 3) {
        try {
          const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          
          console.log('🔍 JWT Header:', header);
          console.log('🔍 JWT Payload (sub, aud, exp):', {
            sub: payload.sub,
            aud: payload.aud,
            exp: payload.exp,
            expired: Date.now() / 1000 > payload.exp
          });
        } catch (e) {
          console.log('❌ JWT decode failed:', e instanceof Error ? e.message : 'Unknown error');
        }
      }
    }
    
    res.json({
      success: true,
      message: 'JWT debug info logged to console',
      hasAuthHeader: !!authHeader,
      serverTime: new Date().toISOString()
    });
  });

  // Test endpoint to check Auth0 configuration (development only)
  router.get('/test-auth-config', (req: Request, res: Response): void => {
    console.log('🧪 Auth config test endpoint called');
    
    const config = {
      AUTH0_DOMAIN: process.env.AUTH0_DOMAIN || 'NOT SET',
      AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE || 'NOT SET',
      NODE_ENV: process.env.NODE_ENV || 'development',
      jwksUri: process.env.AUTH0_DOMAIN ? `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json` : 'N/A'
    };
    
    res.json({
      success: true,
      message: 'Auth0 configuration check',
      config,
      timestamp: new Date().toISOString()
    });
  });

  // Test endpoint for serializeUser robustness (development only)
  router.get('/test-serialize-user', testEndpointRateLimit, async (req: Request, res: Response): Promise<void> => {
    // Only available in development
    if (process.env.NODE_ENV === 'production') {
      res.status(HttpStatus.NOT_FOUND).json(createErrorResponse('Endpoint not found'));
      return;
    }

    console.log('🧪 SerializeUser robustness test endpoint called');
    
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
        usage: { totalTransformations: 5, monthlyUsage: 2, usageResetDate: new Date() },
        createdAt: new Date(),
        updatedAt: new Date()
      } as any;
      
      const serialized = serializeMongoUser(testUser);
      console.log('✅ SerializeUser test completed successfully');
      console.log('Serialized user:', JSON.stringify(serialized, null, 2));
    
      res.json({
        success: true,
        message: 'SerializeUser robustness tests completed - check server logs for results',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error running serializeUser tests:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to run serializeUser tests',
        details: (error as Error).message
      });
    }
  });

  // Debug endpoint to check user name data (development only)
  router.get('/debug/name-data', verifyAuth0Token, syncAuth0User, async (req: Request, res: Response): Promise<void> => {
    if (process.env.NODE_ENV === 'production') {
      res.status(HttpStatus.FORBIDDEN).json(createErrorResponse('Debug endpoint not available in production'));
      return;
    }

    try {
      const mongoUser = req.userContext?.mongoUser;
      const auth0User = req.userContext?.auth0User;
      const jwtPayload = req.userContext?.jwtPayload;
      
      if (!mongoUser) {
        res.status(HttpStatus.NOT_FOUND).json(createErrorResponse('User not found'));
        return;
      }

      const debugData = {
        mongodb: {
          firstName: mongoUser.firstName,
          lastName: mongoUser.lastName,
          username: mongoUser.username,
          email: mongoUser.email,
          fullRecord: mongoUser
        },
        auth0: {
          sub: auth0User?.sub,
          email: auth0User?.email,
          name: auth0User?.name,
          givenName: auth0User?.givenName,
          familyName: auth0User?.familyName,
          nickname: auth0User?.nickname,
          fullRecord: auth0User
        },
        jwtPayload: {
          sub: jwtPayload?.sub,
          name: jwtPayload?.name,
          given_name: jwtPayload?.given_name,
          family_name: jwtPayload?.family_name,
          nickname: jwtPayload?.nickname,
          email: jwtPayload?.email,
          fullPayload: jwtPayload
        }
      };

      console.log('🔍 User name debug data:', debugData);
      res.json(createSuccessResponse(debugData, 'Debug data retrieved'));
    } catch (error) {
      console.error('❌ Error fetching debug data:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(createErrorResponse('Failed to fetch debug data'));
    }
  });

  // Force sync names from Auth0 (development only)
  router.post('/debug/force-name-sync', verifyAuth0Token, syncAuth0User, async (req: Request, res: Response): Promise<void> => {
    if (process.env.NODE_ENV === 'production') {
      res.status(HttpStatus.FORBIDDEN).json(createErrorResponse('Debug endpoint not available in production'));
      return;
    }

    try {
      const mongoUser = req.userContext?.mongoUser;
      const auth0User = req.userContext?.auth0User;
      
      if (!mongoUser || !auth0User) {
        res.status(HttpStatus.NOT_FOUND).json(createErrorResponse('User data not found'));
        return;
      }

      // Force update names from Auth0 data
      const oldFirstName = mongoUser.firstName;
      const oldLastName = mongoUser.lastName;

      mongoUser.firstName = auth0User.givenName || 
                           auth0User.name?.split(' ')[0] || 
                           mongoUser.firstName;
      mongoUser.lastName = auth0User.familyName || 
                          (auth0User.name ? auth0User.name.split(' ').slice(1).join(' ') : '') || 
                          mongoUser.lastName;

      await mongoUser.save();

      const result = {
        updated: true,
        changes: {
          firstName: { old: oldFirstName, new: mongoUser.firstName },
          lastName: { old: oldLastName, new: mongoUser.lastName }
        },
        source: {
          auth0Name: auth0User.name,
          givenName: auth0User.givenName,
          familyName: auth0User.familyName
        }
      };

      console.log('🔄 Forced name sync completed:', result);
      res.json(createSuccessResponse(result, 'Name sync completed'));
    } catch (error) {
      console.error('❌ Error forcing name sync:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(createErrorResponse('Failed to force name sync'));
    }
  });

  // Debug endpoint to force name sync for existing users (development only)
  router.post('/debug/force-name-sync', testEndpointRateLimit, verifyAuth0Token, syncAuth0User, async (req: Request, res: Response): Promise<void> => {
    if (process.env.NODE_ENV === 'production') {
      res.status(HttpStatus.FORBIDDEN).json(createErrorResponse('Debug endpoints not available in production'));
      return;
    }

    try {
      const mongoUser = req.userContext?.mongoUser;
      const auth0User = req.userContext?.auth0User;
      
      if (!mongoUser || !auth0User) {
        res.status(HttpStatus.NOT_FOUND).json(createErrorResponse('User context not found'));
        return;
      }

      // Extract names from Auth0 data
      const firstName = auth0User.givenName || 
                     (auth0User.name ? auth0User.name.split(' ')[0] : '') || 
                     '';
      const lastName = auth0User.familyName || 
                    (auth0User.name ? auth0User.name.split(' ').slice(1).join(' ') : '') || 
                    '';

      console.log('🔄 Force syncing names:', {
        userId: mongoUser._id,
        currentFirstName: mongoUser.firstName,
        currentLastName: mongoUser.lastName,
        newFirstName: firstName,
        newLastName: lastName,
        auth0Data: {
          name: auth0User.name,
          givenName: auth0User.givenName,
          familyName: auth0User.familyName
        }
      });

      // Update the user with the extracted names
      const updatedUser = await MongoUser.findByIdAndUpdate(
        mongoUser._id,
        { 
          firstName: firstName,
          lastName: lastName 
        },
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        res.status(HttpStatus.NOT_FOUND).json(createErrorResponse('User not found for update'));
        return;
      }

      res.json(createSuccessResponse({
        message: 'Names synced successfully',
        changes: {
          firstName: {
            old: mongoUser.firstName,
            new: updatedUser.firstName
          },
          lastName: {
            old: mongoUser.lastName,
            new: updatedUser.lastName
          }
        },
        user: {
          id: updatedUser._id,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName
        }
      }));
    } catch (error) {
      console.error('❌ Error force syncing names:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(createErrorResponse('Failed to sync names'));
    }
  });

  // One-time migration endpoint to fix existing users without names
  router.post('/debug/migrate-empty-names', testEndpointRateLimit, verifyAuth0Token, async (req: Request, res: Response): Promise<void> => {
    if (process.env.NODE_ENV === 'production') {
      res.status(HttpStatus.FORBIDDEN).json(createErrorResponse('Debug endpoints not available in production'));
      return;
    }

    try {
      // Find all users with empty names
      const usersWithEmptyNames = await MongoUser.find({
        $or: [
          { firstName: { $in: ['', null, undefined] } },
          { lastName: { $in: ['', null, undefined] } }
        ]
      });

      console.log(`🔍 Found ${usersWithEmptyNames.length} users with empty names`);

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
            lastName: lastName
          });
          
          updatedCount++;
          results.push({
            userId: user._id,
            email: user.email,
            oldFirstName: user.firstName,
            oldLastName: user.lastName,
            newFirstName: firstName,
            newLastName: lastName
          });
        }
      }

      res.json(createSuccessResponse({
        message: `Migration completed. Updated ${updatedCount} users.`,
        totalFound: usersWithEmptyNames.length,
        totalUpdated: updatedCount,
        results: results
      }));
    } catch (error) {
      console.error('❌ Error during name migration:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(createErrorResponse('Failed to migrate user names'));
    }
  });
}

export default router;
