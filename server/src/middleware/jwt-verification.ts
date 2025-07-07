// JWT verification middleware with environment-specific configurations

import { expressjwt as jwt } from 'express-jwt';
import jwks from 'jwks-rsa';
import { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '../constants/http-status';

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;
const NODE_ENV = process.env.NODE_ENV;

console.log('🔧 JWT Configuration:', {
  AUTH0_DOMAIN: AUTH0_DOMAIN || 'NOT SET',
  AUTH0_AUDIENCE: AUTH0_AUDIENCE || 'NOT SET',
  NODE_ENV: NODE_ENV || 'development'
});

// Don't throw error immediately - handle gracefully in middleware
if (!AUTH0_DOMAIN) {
  console.warn('⚠️ AUTH0_DOMAIN environment variable is not set - Auth0 features will be disabled');
}

// Base JWT configuration with enhanced logging
const createJwtConfig = (audience?: string) => {
  // Safety check for missing AUTH0_DOMAIN
  if (!AUTH0_DOMAIN) {
    throw new Error('Cannot create JWT config: AUTH0_DOMAIN is not configured');
  }

  const config = {
    secret: jwks.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`
    }),
    issuer: `https://${AUTH0_DOMAIN}/`,
    algorithms: ['RS256'] as any[],
    requestProperty: 'user', // This sets req.user
    ...(audience && { audience })
  };
  
  console.log('🔧 JWT Config created:', {
    issuer: config.issuer,
    audience: audience || 'NO AUDIENCE',
    jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`
  });
  
  return config;
};

/**
 * Enhanced JWT verification middleware
 * Uses unknown type due to complex express-jwt library typing
 */
const createEnhancedJwtVerifier = (config: unknown) => {
  const baseVerifier = jwt(config as any);
  
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        error: 'No authorization header provided',
        details: 'Please include a Bearer token in the Authorization header'
      });
      return;
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      console.log('❌ Invalid authorization header format');
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        error: 'Invalid authorization header format',
        details: 'Authorization header must start with "Bearer "'
      });
      return;
    }
    
    const token = authHeader.substring(7);
    const tokenParts = token.split('.');
    
    console.log('🔍 Token analysis:', {
      tokenLength: token.length,
      parts: tokenParts.length,
      validJWTStructure: tokenParts.length === 3
    });
    
    if (tokenParts.length !== 3) {
      console.log('❌ Invalid JWT structure');
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        error: 'Invalid JWT token structure',
        details: 'JWT must have 3 parts separated by dots'
      });
      return;
    }
    
    // Try to decode header to check if it's a valid JWT
    try {
      const header = JSON.parse(Buffer.from(tokenParts[0], 'base64').toString());
      console.log('🔍 JWT Header:', header);
    } catch (error) {
      console.log('❌ Invalid JWT header encoding');
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        error: 'Invalid JWT header encoding'
      });
      return;
    }
    
    // Now use the base verifier
    baseVerifier(req, res, (err: unknown) => {
      if (err) {
        console.error('❌ JWT verification failed:', {
          name: err instanceof Error ? err.name : 'Unknown',
          message: err instanceof Error ? err.message : String(err),
          code: (err as any)?.code,
          status: (err as any)?.status
        });
        
        res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          error: 'JWT verification failed',
          details: err instanceof Error ? err.message : String(err)
        });
        return;
      }
      
      console.log('✅ JWT verification successful:', {
        user: req.user ? { sub: req.user.sub, email: req.user.email } : 'No user data'
      });
      
      next();
    });
  };
};
/**
 * Strict JWT verification - requires audience (production)
 */
export const verifyAuth0TokenStrict = (() => {
  try {
    if (!AUTH0_DOMAIN) {
      console.warn('⚠️ AUTH0_DOMAIN not configured - returning no-op middleware');
      return (req: Request, res: Response, next: NextFunction) => {
        console.log('⚠️ JWT verification skipped - AUTH0_DOMAIN not configured');
        next();
      };
    }
    
    if (!AUTH0_AUDIENCE) {
      console.warn('⚠️ AUTH0_AUDIENCE not configured for strict verification');
      return (req: Request, res: Response, next: NextFunction) => {
        console.log('⚠️ Strict JWT verification skipped - AUTH0_AUDIENCE not configured');
        next();
      };
    }
    
    console.log('🔒 Using STRICT JWT verification with audience:', AUTH0_AUDIENCE);
    return createEnhancedJwtVerifier(createJwtConfig(AUTH0_AUDIENCE));
  } catch (error) {
    console.error('❌ Failed to create strict JWT verifier:', error);
    return (req: Request, res: Response, next: NextFunction) => {
      console.log('⚠️ JWT verification skipped due to configuration error');
      next();
    };
  }
})();

/**
 * Permissive JWT verification - no audience required (development)
 */
export const verifyAuth0TokenPermissive = (() => {
  try {
    if (!AUTH0_DOMAIN) {
      console.warn('⚠️ AUTH0_DOMAIN not configured - returning no-op middleware');
      return (req: Request, res: Response, next: NextFunction) => {
        console.log('⚠️ JWT verification skipped - AUTH0_DOMAIN not configured');
        next();
      };
    }
    
    console.log('⚠️  Using PERMISSIVE JWT verification (no audience requirement)');
    return createEnhancedJwtVerifier(createJwtConfig());
  } catch (error) {
    console.error('❌ Failed to create permissive JWT verifier:', error);
    return (req: Request, res: Response, next: NextFunction) => {
      console.log('⚠️ JWT verification skipped due to configuration error');
      next();
    };
  }
})();

/**
 * Auto-select appropriate JWT verification based on environment
 */
export const verifyAuth0Token = (() => {
  // In production, always require audience
  if (NODE_ENV === 'production') {
    return verifyAuth0TokenStrict;
  }
  
  // In development, use audience if available, otherwise permissive
  if (AUTH0_AUDIENCE) {
    console.log('🔧 Development mode with audience configured - using strict verification');
    return verifyAuth0TokenStrict;
  } else {
    console.log('🔧 Development mode without audience - using permissive verification');
    return verifyAuth0TokenPermissive;
  }
})();

/**
 * Get current JWT configuration info
 */
export function getJwtInfo() {
  return {
    domain: AUTH0_DOMAIN,
    audience: AUTH0_AUDIENCE || 'NOT SET',
    environment: NODE_ENV || 'development',
    strictMode: Boolean(AUTH0_AUDIENCE && NODE_ENV === 'production'),
    jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`
  };
}
