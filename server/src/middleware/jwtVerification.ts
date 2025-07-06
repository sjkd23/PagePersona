// JWT verification middleware with environment-specific configurations

import { expressjwt as jwt } from 'express-jwt';
import jwks from 'jwks-rsa';
import { Request, Response, NextFunction } from 'express';

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;
const NODE_ENV = process.env.NODE_ENV;

console.log('🔧 JWT Configuration:', {
  AUTH0_DOMAIN: AUTH0_DOMAIN || 'NOT SET',
  AUTH0_AUDIENCE: AUTH0_AUDIENCE || 'NOT SET',
  NODE_ENV: NODE_ENV || 'development'
});

if (!AUTH0_DOMAIN) {
  throw new Error('AUTH0_DOMAIN environment variable is required');
}

// Base JWT configuration with enhanced logging
const createJwtConfig = (audience?: string) => {
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
 */
const createEnhancedJwtVerifier = (config: any) => {
  const baseVerifier = jwt(config);
  
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: 'No authorization header provided',
        details: 'Please include a Bearer token in the Authorization header'
      });
      return;
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      console.log('❌ Invalid authorization header format');
      res.status(401).json({
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
      res.status(401).json({
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
      res.status(401).json({
        success: false,
        error: 'Invalid JWT header encoding'
      });
      return;
    }
    
    // Now use the base verifier
    baseVerifier(req, res, (err: any) => {
      if (err) {
        console.error('❌ JWT verification failed:', {
          name: err.name,
          message: err.message,
          code: err.code,
          status: err.status
        });
        
        res.status(401).json({
          success: false,
          error: 'JWT verification failed',
          details: err.message
        });
        return;
      }
      
      console.log('✅ JWT verification successful:', {
        user: (req as any).user ? { sub: (req as any).user.sub, email: (req as any).user.email } : 'No user data'
      });
      
      next();
    });
  };
};
/**
 * Strict JWT verification - requires audience (production)
 */
export const verifyAuth0TokenStrict = (() => {
  if (!AUTH0_AUDIENCE) {
    throw new Error('AUTH0_AUDIENCE is required for strict JWT verification');
  }
  
  console.log('🔒 Using STRICT JWT verification with audience:', AUTH0_AUDIENCE);
  
  return createEnhancedJwtVerifier(createJwtConfig(AUTH0_AUDIENCE));
})();

/**
 * Permissive JWT verification - no audience required (development)
 */
export const verifyAuth0TokenPermissive = (() => {
  console.log('⚠️  Using PERMISSIVE JWT verification (no audience requirement)');
  
  return createEnhancedJwtVerifier(createJwtConfig());
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
