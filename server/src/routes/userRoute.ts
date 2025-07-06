import express, { Request, Response } from 'express';
import { MongoUser } from '../models/MongoUser';
import { verifyAuth0Token, syncAuth0User } from '../middleware/auth0Middleware';
import { serializeUser, serializeUserUsage, createSuccessResponse, createErrorResponse, safeLogUser } from '../utils/userSerializer';
import { syncRateLimit, profileUpdateRateLimit, testEndpointRateLimit } from '../middleware/rateLimitMiddleware';
import { hasUserContext } from '../utils/migrationHelpers';

const router = express.Router();

// Get current user profile
router.get('/profile', verifyAuth0Token, syncAuth0User, async (req: Request, res: Response): Promise<void> => {
  let user;
  try {
    user = req.userContext?.mongoUser || req.user;
    
    if (!user) {
      res.status(404).json(createErrorResponse('User profile not found'));
      return;
    }

    // Debug logging to help identify incomplete user objects
    console.log('Serializing user profile for:', {
      userId: user._id,
      auth0Id: user.auth0Id,
      email: user.email,
      hasUsage: !!user.usage,
      hasCreatedAt: !!user.createdAt,
      hasUpdatedAt: !!user.updatedAt
    });

    res.json(createSuccessResponse(serializeUser(user)));
  } catch (error) {
    console.error('Error fetching user profile:', error);
    safeLogUser(user, 'User object that caused profile fetch error');
    res.status(500).json(createErrorResponse('Failed to fetch user profile'));
  }
});

// Update user profile
router.put('/profile', profileUpdateRateLimit, verifyAuth0Token, syncAuth0User, async (req: Request, res: Response): Promise<void> => {
  let updatedUser;
  try {
    // Use userContext if available, fallback to legacy field
    const user = req.userContext?.mongoUser || req.user;
    const updates = req.body;

    if (!user) {
      res.status(404).json(createErrorResponse('User profile not found'));
      return;
    }

    // Only allow updating certain fields
    const allowedUpdates = ['firstName', 'lastName', 'preferences'];
    const filteredUpdates: any = {};

    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    // Special handling for preferences (merge instead of replace)
    if (updates.preferences) {
      filteredUpdates.preferences = {
        ...user.preferences,
        ...updates.preferences
      };
    }

    updatedUser = await MongoUser.findByIdAndUpdate(
      user._id,
      filteredUpdates,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      res.status(404).json(createErrorResponse('User not found'));
      return;
    }

    console.log('✅ Profile updated for user:', updatedUser.username);
    res.json(createSuccessResponse(serializeUser(updatedUser), 'Profile updated successfully'));
  } catch (error) {
    console.error('❌ Error updating user profile:', error);
    safeLogUser(updatedUser, 'UpdatedUser object that caused update error');
    res.status(500).json(createErrorResponse('Failed to update user profile'));
  }
});

// Get user usage stats
router.get('/usage', verifyAuth0Token, syncAuth0User, async (req: Request, res: Response): Promise<void> => {
  try {
    // Use userContext if available, fallback to legacy field
    const user = req.userContext?.mongoUser || req.user;
    
    if (!user) {
      res.status(404).json(createErrorResponse('User not found'));
      return;
    }

    res.json(createSuccessResponse(serializeUserUsage(user)));
  } catch (error) {
    console.error('❌ Error fetching user usage:', error);
    res.status(500).json(createErrorResponse('Failed to fetch user usage'));
  }
});

// Sync user with MongoDB (triggers automatic user creation/update)
router.post('/sync', syncRateLimit, verifyAuth0Token, syncAuth0User, async (req: Request, res: Response): Promise<void> => {
  let user;
  try {
    user = req.userContext?.mongoUser || req.user;
    
    if (!user) {
      res.status(404).json(createErrorResponse('User sync failed - user not found'));
      return;
    }

    console.log('Syncing user:', {
      userId: user._id,
      auth0Id: user.auth0Id,
      email: user.email
    });

    res.json(createSuccessResponse(serializeUser(user), 'User successfully synced with MongoDB'));
  } catch (error) {
    console.error('Error syncing user:', error);
    safeLogUser(user, 'User object that caused sync error');
    res.status(500).json(createErrorResponse('Failed to sync user'));
  }
});

// Test endpoint to verify JWT authentication with audience
router.get('/test-auth', testEndpointRateLimit, verifyAuth0Token, (req: Request, res: Response): void => {
  console.log('🧪 Test auth endpoint called - JWT verification successful');
  console.log('🧪 Auth0 user info:', req.auth0User);
  
  const authUser = req.userContext?.auth0User || req.auth0User;
  const { sub, email } = authUser || {};
  const aud = (authUser as any)?.aud; // Type assertion for aud field
  
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

// Test endpoint to debug JWT verification
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

// Test endpoint to check Auth0 configuration
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

// Test endpoint for serializeUser robustness
router.get('/test-serialize-user', testEndpointRateLimit, (req: Request, res: Response): void => {
  console.log('🧪 SerializeUser robustness test endpoint called');
  
  try {
    // Import the test function dynamically to avoid circular imports
    const { testSerializeUser } = require('../tests/serializeUserTest');
    
    // Run the test
    testSerializeUser();
    
    res.json({
      success: true,
      message: 'SerializeUser robustness tests completed - check server logs for results',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error running serializeUser tests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run serializeUser tests',
      details: (error as Error).message
    });
  }
});

export default router;
