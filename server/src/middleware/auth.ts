/**
 * Auth0 JWT Authentication & Authorization Middleware
 *
 * This module provides comprehensive Auth0 integration with JWT validation,
 * scope enforcement, and permission checks for API routes.
 *
 * Features:
 * - JWT token validation with RS256 algorithm
 * - JWKS (JSON Web Key Set) caching and rate limiting
 * - Scope-based authorization middleware
 * - Permission checks with custom claims
 * - Error handling and logging
 * - TypeScript support with proper type definitions
 *
 * Security Features:
 * - Rate-limited JWKS requests (5 per minute)
 * - Token caching for performance
 * - Proper error handling and logging
 * - Configurable scope checking (any vs all scopes)
 * - Custom permissions claim support
 *
 * Usage:
 * ```typescript
 * import { jwtCheck, requireScopes } from '../middleware/auth';
 *
 * // Public routes (no auth required)
 * router.get('/public', publicController);
 *
 * // Protected routes (any authenticated user)
 * router.get('/user/profile', jwtCheck, userController);
 *
 * // Admin-only routes (specific scopes required)
 * router.get('/admin/stats', jwtCheck, requireScopes(['read:admin']), adminController);
 * ```
 */

import '../types/loader';
import { Request, Response, NextFunction } from 'express';
import { expressjwt as jwt, GetVerificationKey } from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import jwtAuthz from 'express-jwt-authz';
import { validateEnvironment } from '../utils/env-validation';
import { logger } from '../utils/logger';

// Get validated environment variables
const envConfig = validateEnvironment();

/**
 * Extended Express Request interface with Auth0 user information
 */
export interface AuthenticatedRequest extends Request {
  auth?: {
    sub: string;
    aud: string | string[];
    iss: string;
    iat: number;
    exp: number;
    scope?: string;
    permissions?: string[];
    [key: string]: unknown;
  };
}

/**
 * JWKS client configuration for retrieving Auth0 public keys
 *
 * Configuration includes:
 * - Caching for performance optimization
 * - Rate limiting to prevent abuse
 * - Proper error handling
 */
const jwksClient = jwksRsa({
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
  jwksUri: `${envConfig.AUTH0_ISSUER}.well-known/jwks.json`,
  timeout: 10000,
  requestHeaders: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'User-Agent': 'PagePersonAI-Server/1.0.0',
  },
});

/**
 * Get verification key for JWT validation
 *
 * @param header JWT header containing key ID
 * @param callback Callback function for async key retrieval
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getKey: GetVerificationKey = (header: any, callback: any) => {
  if (!header.kid) {
    logger.error('JWT header missing key ID');
    return callback(new Error('JWT header missing key ID'));
  }

  jwksClient.getSigningKey(header.kid, (err, key) => {
    if (err) {
      logger.error('Failed to get signing key from JWKS', {
        error: err.message,
        kid: header.kid,
      });
      return callback(err);
    }

    if (!key) {
      logger.error('No signing key found', { kid: header.kid });
      return callback(new Error('No signing key found'));
    }

    const signingKey = 'publicKey' in key ? key.publicKey : key.rsaPublicKey;
    if (!signingKey) {
      logger.error('Invalid signing key format', { kid: header.kid });
      return callback(new Error('Invalid signing key format'));
    }

    callback(null, signingKey);
  });
};

/**
 * JWT Check Middleware
 *
 * Validates JWT tokens from Auth0 using RS256 algorithm.
 * Attaches decoded token information to req.auth for use in subsequent middleware.
 *
 * Features:
 * - Validates token signature using Auth0's public keys
 * - Verifies token audience and issuer
 * - Checks token expiration
 * - Handles various token formats (Bearer, query param, etc.)
 *
 * @throws 401 Unauthorized if token is invalid or missing
 * @throws 403 Forbidden if token is valid but lacks required claims
 */
export const jwtCheck = jwt({
  secret: getKey,
  audience: envConfig.AUTH0_AUDIENCE,
  issuer: envConfig.AUTH0_ISSUER,
  algorithms: ['RS256'],
  requestProperty: 'auth',
  getToken: (req: Request) => {
    // Check Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Fallback to query parameter or body
    return (req.query.token as string) || req.body.token;
  },
});

/**
 * Scope-based Authorization Middleware Factory
 *
 * Creates middleware that enforces specific scopes for route access.
 * Scopes can be checked individually (any) or all required (all).
 *
 * @param scopes Array of required scopes
 * @param options Configuration options for scope checking
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * // Require any of the listed scopes
 * router.get('/admin', jwtCheck, requireScopes(['read:admin', 'write:admin']), handler);
 *
 * // Require all listed scopes
 * router.post('/admin/users', jwtCheck, requireScopes(['read:admin', 'write:users'], { checkAllScopes: true }), handler);
 * ```
 */
export function requireScopes(
  scopes: string[],
  options: {
    checkAllScopes?: boolean;
    customScopeKey?: string;
    failWithError?: boolean;
  } = {},
) {
  const { checkAllScopes = false, customScopeKey = 'permissions', failWithError = true } = options;

  return jwtAuthz(scopes, {
    customScopeKey,
    checkAllScopes,
    failWithError,
    customUserKey: 'auth',
  });
}

/**
 * Permission-based Authorization Middleware Factory
 *
 * Creates middleware that checks for specific permissions in custom claims.
 * Useful for more granular authorization beyond standard scopes.
 *
 * @param permissions Array of required permissions
 * @param options Configuration options
 * @returns Express middleware function
 */
export function requirePermissions(permissions: string[], options: { requireAll?: boolean } = {}) {
  const { requireAll = false } = options;

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const userPermissions = req.auth?.permissions || [];

    if (!Array.isArray(userPermissions)) {
      logger.warn('User permissions not found or invalid format', {
        userId: req.auth?.sub,
        permissions: userPermissions,
      });
      res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
      return;
    }

    const hasPermission = requireAll
      ? permissions.every((permission) => userPermissions.includes(permission))
      : permissions.some((permission) => userPermissions.includes(permission));

    if (!hasPermission) {
      logger.warn('Permission check failed', {
        userId: req.auth?.sub,
        requiredPermissions: permissions,
        userPermissions,
        requireAll,
      });

      res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
        required: permissions,
        requireAll,
      });
      return;
    }

    logger.debug('Permission check passed', {
      userId: req.auth?.sub,
      requiredPermissions: permissions,
      userPermissions,
    });

    next();
  };
}

/**
 * Role-based Authorization Middleware Factory
 *
 * Creates middleware that checks for specific roles in custom claims.
 * Roles are typically broader than permissions (e.g., 'admin', 'user', 'moderator').
 *
 * @param roles Array of required roles
 * @param options Configuration options
 * @returns Express middleware function
 */
export function requireRoles(roles: string[], options: { requireAll?: boolean } = {}) {
  const { requireAll = false } = options;

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const userRoles = req.auth?.roles || req.auth?.[envConfig.AUTH0_ROLES_CLAIM || 'roles'] || [];

    if (!Array.isArray(userRoles)) {
      logger.warn('User roles not found or invalid format', {
        userId: req.auth?.sub,
        roles: userRoles,
      });
      res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient roles',
      });
      return;
    }

    const hasRole = requireAll
      ? roles.every((role) => userRoles.includes(role))
      : roles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      logger.warn('Role check failed', {
        userId: req.auth?.sub,
        requiredRoles: roles,
        userRoles,
        requireAll,
      });

      res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient roles',
        required: roles,
        requireAll,
      });
      return;
    }

    logger.debug('Role check passed', {
      userId: req.auth?.sub,
      requiredRoles: roles,
      userRoles,
    });

    next();
  };
}

/**
 * Optional JWT Check Middleware
 *
 * Similar to jwtCheck but doesn't fail if no token is provided.
 * Useful for routes that work for both authenticated and anonymous users.
 *
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
export const optionalJwtCheck = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token provided, continue without authentication
    return next();
  }

  // Token provided, validate it
  jwtCheck(req, res, (err) => {
    if (err) {
      logger.debug('Optional JWT validation failed', { error: err.message });
      // Don't fail the request, just continue without auth
      return next();
    }
    next();
  });
};

/**
 * Auth0 Error Handler Middleware
 *
 * Handles JWT validation errors and provides appropriate error responses.
 * Should be used after JWT middleware to catch authentication errors.
 *
 * @param err Error object from JWT middleware
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
export const authErrorHandler = (
  err: Error & { name?: string; code?: string; status?: number },
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (err.name === 'UnauthorizedError') {
    logger.warn('JWT validation failed', {
      error: err.message,
      code: err.code,
      path: req.path,
      method: req.method,
    });

    const errorResponse: {
      error: string;
      message: string;
      code: string;
      details?: string;
    } = {
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token',
      code: err.code || 'INVALID_TOKEN',
    };

    // Don't expose internal error details in production
    if (envConfig.NODE_ENV !== 'production') {
      errorResponse.details = err.message;
    }

    res.status(401).json(errorResponse);
    return;
  }

  next(err);
};

/**
 * User Information Middleware
 *
 * Extracts and formats user information from JWT token.
 * Attaches user info to req.user for easy access in route handlers.
 *
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
export const attachUserInfo = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.auth) {
    return next();
  }

  // Extract user information from JWT claims
  const userInfo = {
    id: req.auth.sub,
    email: req.auth.email,
    name: req.auth.name,
    picture: req.auth.picture,
    permissions: req.auth.permissions || [],
    roles: req.auth.roles || req.auth[envConfig.AUTH0_ROLES_CLAIM || 'roles'] || [],
    scope: req.auth.scope ? req.auth.scope.split(' ') : [],
  };

  // Attach to request for use in route handlers
  (req as Request & { user: typeof userInfo }).user = userInfo;

  logger.debug('User info attached to request', {
    userId: userInfo.id,
    email: userInfo.email,
    permissions: userInfo.permissions,
    roles: userInfo.roles,
  });

  next();
};

/**
 * Development-only middleware for debugging authentication
 * Only active in development environment
 */
export const debugAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (envConfig.NODE_ENV === 'development') {
    logger.debug('Auth Debug Info', {
      path: req.path,
      method: req.method,
      hasAuth: !!req.auth,
      auth: req.auth
        ? {
            sub: req.auth.sub,
            aud: req.auth.aud,
            iss: req.auth.iss,
            exp: req.auth.exp,
            scope: req.auth.scope,
            permissions: req.auth.permissions,
          }
        : null,
    });
  }
  next();
};
