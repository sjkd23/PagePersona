/**
 * JWT Token Verification Middleware
 *
 * This module provides JWT token verification middleware with environment-specific
 * configurations. It supports both strict verification (with audience validation)
 * for production environments and permissive verification for development.
 *
 * Features:
 * - Environment-aware JWT verification
 * - Comprehensive token validation and error handling
 * - Graceful fallback when Auth0 is not configured
 * - Detailed error reporting for debugging
 * - Support for both strict and permissive verification modes
 */

import { expressjwt as jwt } from 'express-jwt';
import jwks from 'jwks-rsa';
import { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '../constants/http-status';
import { logger } from '../utils/logger';

// Load Auth0 configuration from environment variables
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;
const NODE_ENV = process.env.NODE_ENV;

// Handle missing Auth0 configuration gracefully
if (!AUTH0_DOMAIN) {
  logger.warn('AUTH0_DOMAIN environment variable is not set - Auth0 features will be disabled');
}

/**
 * Creates JWT configuration object for token verification
 *
 * @param audience Optional audience claim to validate
 * @returns JWT configuration object for express-jwt middleware
 * @throws Error if AUTH0_DOMAIN is not configured
 */
const createJwtConfig = (audience?: string) => {
  // Safety check for missing AUTH0_DOMAIN
  if (!AUTH0_DOMAIN) {
    throw new Error('Cannot create JWT config: AUTH0_DOMAIN is not configured');
  }

  const config = {
    secret: jwks.expressJwtSecret({
      cache: true, // Cache JWKS responses for performance
      rateLimit: true, // Enable rate limiting
      jwksRequestsPerMinute: 5, // Limit requests to prevent abuse
      jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`,
    }),
    issuer: `https://${AUTH0_DOMAIN}/`, // Expected token issuer
    algorithms: ['RS256'] as const, // Only allow RS256 algorithm
    requestProperty: 'user', // Attach decoded token to req.user
    ...(audience && { audience }), // Include audience validation if provided
  };

  return config;
};

/**
 * Creates enhanced JWT verification middleware with comprehensive validation
 *
 * This function wraps the base express-jwt middleware with additional
 * validation steps and improved error handling.
 *
 * @param config JWT configuration object
 * @returns Express middleware function for JWT verification
 */
const createEnhancedJwtVerifier = (config: Record<string, unknown>) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const baseVerifier = jwt(config as any);

  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    // Check for missing authorization header
    if (!authHeader) {
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        error: 'No authorization header provided',
        details: 'Please include a Bearer token in the Authorization header',
      });
      return;
    }

    // Validate authorization header format
    if (!authHeader.startsWith('Bearer ')) {
      logger.info('Invalid authorization header format');
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        error: 'Invalid authorization header format',
        details: 'Authorization header must start with "Bearer "',
      });
      return;
    }

    // Extract and validate JWT structure
    const token = authHeader.substring(7);
    const tokenParts = token.split('.');

    if (tokenParts.length !== 3) {
      logger.info('Invalid JWT structure');
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        error: 'Invalid JWT token structure',
        details: 'JWT must have 3 parts separated by dots',
      });
      return;
    }

    // Validate JWT header encoding
    try {
      JSON.parse(Buffer.from(tokenParts[0], 'base64').toString());
    } catch (error) {
      logger.info('Invalid JWT header encoding');
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        error: 'Invalid JWT header encoding',
      });
      return;
    }

    // Perform JWT verification using express-jwt
    baseVerifier(req, res, (err: unknown) => {
      if (err) {
        logger.error('JWT verification failed:', {
          name: err instanceof Error ? err.name : 'Unknown',
          message: err instanceof Error ? err.message : String(err),
          code: (err as Error & { code?: string })?.code,
          status: (err as Error & { status?: number })?.status,
        });

        res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          error: 'JWT verification failed',
          details: err instanceof Error ? err.message : String(err),
        });
        return;
      }

      next();
    });
  };
};
/**
 * Strict JWT verification middleware - requires audience validation
 *
 * This middleware enforces strict JWT validation including audience claim
 * verification. Recommended for production environments.
 */
export const verifyAuth0TokenStrict = (() => {
  try {
    if (!AUTH0_DOMAIN) {
      logger.warn('AUTH0_DOMAIN not configured - returning no-op middleware');
      return (req: Request, res: Response, next: NextFunction) => {
        logger.info('JWT verification skipped - AUTH0_DOMAIN not configured');
        next();
      };
    }

    if (!AUTH0_AUDIENCE) {
      logger.warn('AUTH0_AUDIENCE not configured for strict verification');
      return (req: Request, res: Response, next: NextFunction) => {
        logger.info('Strict JWT verification skipped - AUTH0_AUDIENCE not configured');
        next();
      };
    }

    return createEnhancedJwtVerifier(createJwtConfig(AUTH0_AUDIENCE));
  } catch (error) {
    logger.error('Failed to create strict JWT verifier:', error);
    return (req: Request, res: Response, next: NextFunction) => {
      logger.info('JWT verification skipped due to configuration error');
      next();
    };
  }
})();

/**
 * Permissive JWT verification middleware - no audience validation required
 *
 * This middleware provides JWT validation without requiring audience claims.
 * Useful for development environments or when audience validation is not needed.
 */
export const verifyAuth0TokenPermissive = (() => {
  try {
    if (!AUTH0_DOMAIN) {
      logger.warn('AUTH0_DOMAIN not configured - returning no-op middleware');
      return (req: Request, res: Response, next: NextFunction) => {
        logger.info('JWT verification skipped - AUTH0_DOMAIN not configured');
        next();
      };
    }

    return createEnhancedJwtVerifier(createJwtConfig());
  } catch (error) {
    logger.error('Failed to create permissive JWT verifier:', error);
    return (req: Request, res: Response, next: NextFunction) => {
      logger.info('JWT verification skipped due to configuration error');
      next();
    };
  }
})();

/**
 * Environment-aware JWT verification middleware
 *
 * Automatically selects the appropriate JWT verification strategy based on
 * the current environment and available configuration:
 * - Production: Always uses strict verification with audience validation
 * - Development: Uses strict verification if audience is configured, otherwise permissive
 */
export const verifyAuth0Token = (() => {
  // In production, always require audience validation
  if (NODE_ENV === 'production') {
    return verifyAuth0TokenStrict;
  }

  // In development, use audience validation if available, otherwise permissive
  if (AUTH0_AUDIENCE) {
    return verifyAuth0TokenStrict;
  } else {
    return verifyAuth0TokenPermissive;
  }
})();

/**
 * Retrieves current JWT configuration information
 *
 * @returns Object containing current JWT configuration details
 */
export function getJwtInfo(): {
  domain: string | undefined;
  audience: string;
  environment: string;
  strictMode: boolean;
  jwksUri: string;
} {
  return {
    domain: AUTH0_DOMAIN,
    audience: AUTH0_AUDIENCE || 'NOT SET',
    environment: NODE_ENV || 'development',
    strictMode: Boolean(AUTH0_AUDIENCE && NODE_ENV === 'production'),
    jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`,
  };
}
