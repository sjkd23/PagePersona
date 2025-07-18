/**
 * Auth0 JWT Authentication & Authorization Middleware
 *
 * This module provides comprehensive Auth0 integration with JWT validation,
 * scope enforcement, and permission checks for API routes.
 */

import '../types/loader';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { expressjwt as jwt } from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import jwtAuthz from 'express-jwt-authz';
import { validateEnvironment } from '../utils/env-validation';
import { logger } from '../utils/logger';

/** Load & validate environment, falling back to dev defaults if needed */
let envConfig: ReturnType<typeof validateEnvironment>;
try {
  envConfig = validateEnvironment();
} catch {
  console.warn('⚠️ Auth middleware: Environment validation failed, using dev defaults');
  envConfig = {
    NODE_ENV: 'development' as const,
    PORT: 5000,
    MONGODB_URI: 'mongodb://localhost:27017/pagepersonai-dev',
    OPENAI_API_KEY: 'missing',
    OPENAI_MODEL: 'gpt-4',
    AUTH0_DOMAIN: 'dev.example.com',
    AUTH0_CLIENT_ID: 'dev-client-id',
    AUTH0_CLIENT_SECRET: 'dev-client-secret',
    AUTH0_AUDIENCE: 'dev-audience',
    AUTH0_ISSUER: 'https://dev.example.com/',
    JWT_SECRET: 'dev-jwt-secret-minimum-32-characters-long',
    JWT_EXPIRES_IN: '7d',
    CLIENT_URL: 'http://localhost:3000',
    LOG_LEVEL: 'info' as const,
    RATE_LIMIT_WINDOW_MS: 900000,
    RATE_LIMIT_MAX_REQUESTS: 100,
    DAILY_LIMIT_FREE: 10,
    DAILY_LIMIT_PREMIUM: 100,
    CACHE_TTL: 3600,
    REDIS_URL: undefined,
    REDIS_PASSWORD: undefined,
    REDIS_DB: 0,
    REDIS_DISABLED: false,
    WEB_SCRAPER_MAX_CONTENT_LENGTH: 8000,
    WEB_SCRAPER_REQUEST_TIMEOUT_MS: 10000,
    WEB_SCRAPER_USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    ALLOWED_ORIGINS: undefined,
    AUTH0_CUSTOM_USER_ID_CLAIM: undefined,
    AUTH0_ROLES_CLAIM: undefined,
    AUTH0_PERMISSIONS_CLAIM: undefined,
  };
}

/** Extended Request with Auth0 info */
export interface AuthenticatedRequest extends Request {
  auth?: {
    sub: string;
    aud: string | string[];
    iss: string;
    iat: number;
    exp: number;
    scope?: string;
    permissions?: string[];
    roles?: string[];
    email?: string;
    name?: string;
    picture?: string;
    [key: string]: unknown;
  };
}

/** Secret provider for express-jwt using JWKS from Auth0 */
const jwtSecret = jwksRsa.expressJwtSecret({
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
  jwksUri: `${envConfig.AUTH0_ISSUER}.well-known/jwks.json`,
  timeout: 10_000,
  requestHeaders: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'User-Agent': 'PagePersonAI-Server/1.0.0',
  },
});

/** Middleware: validate JWT and attach decoded token to req.auth */
export const jwtCheck = jwt({
  secret: jwtSecret,
  audience: envConfig.AUTH0_AUDIENCE,
  issuer: envConfig.AUTH0_ISSUER,
  algorithms: ['RS256'],
  requestProperty: 'auth',
  getToken: (req: Request) => {
    const h = req.headers.authorization;
    if (h && h.startsWith('Bearer ')) return h.slice(7);
    return (req.query.token as string) || req.body.token;
  },
});

/** Scope-based authorization */
export function requireScopes(
  scopes: string[],
  options: {
    checkAllScopes?: boolean;
    customScopeKey?: string;
    failWithError?: boolean;
  } = {},
): RequestHandler {
  const { checkAllScopes = false, customScopeKey = 'permissions', failWithError = true } = options;

  return jwtAuthz(scopes, {
    customScopeKey,
    checkAllScopes,
    failWithError,
    customUserKey: 'auth',
  });
}

/** Permission-based authorization */
export function requirePermissions(permissions: string[], options: { requireAll?: boolean } = {}) {
  const { requireAll = false } = options;

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const userPerms = req.auth?.permissions || [];
    if (!Array.isArray(userPerms)) {
      logger.warn('Permissions missing or malformed', {
        user: req.auth?.sub,
        permissions: userPerms,
      });
      res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
      return;
    }

    const ok = requireAll
      ? permissions.every((p) => userPerms.includes(p))
      : permissions.some((p) => userPerms.includes(p));

    if (!ok) {
      logger.warn('Permission check failed', {
        user: req.auth?.sub,
        required: permissions,
        has: userPerms,
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
      user: req.auth?.sub,
      permissions: userPerms,
    });
    next();
  };
}

/** Role-based authorization */
export function requireRoles(roles: string[], options: { requireAll?: boolean } = {}) {
  const { requireAll = false } = options;

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const userRoles = req.auth?.roles || req.auth?.[envConfig.AUTH0_ROLES_CLAIM || 'roles'] || [];

    if (!Array.isArray(userRoles)) {
      logger.warn('Roles missing or malformed', {
        user: req.auth?.sub,
        roles: userRoles,
      });
      res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient roles',
      });
      return;
    }

    const ok = requireAll
      ? roles.every((r) => userRoles.includes(r))
      : roles.some((r) => userRoles.includes(r));

    if (!ok) {
      logger.warn('Role check failed', {
        user: req.auth?.sub,
        required: roles,
        has: userRoles,
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
      user: req.auth?.sub,
      roles: userRoles,
    });
    next();
  };
}

/** Optional JWT: if token present, validate, else continue */
export const optionalJwtCheck = (req: Request, res: Response, next: NextFunction): void => {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return next();

  jwtCheck(req, res, (err) => {
    if (err) {
      logger.debug('Optional JWT failed', { error: err.message });
    }
    next();
  });
};

/** Error handler for Auth0 JWT failures */
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

    const resp: Record<string, unknown> = {
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token',
      code: err.code || 'INVALID_TOKEN',
    };
    if (envConfig.NODE_ENV !== 'production') {
      resp.details = err.message;
    }
    res.status(401).json(resp);
    return;
  }
  next(err);
};

/** Attach user info from req.auth into req.user */
export const attachUserInfo = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (req.auth) {
    const userInfo = {
      id: req.auth.sub,
      email: req.auth.email as string | undefined,
      name: req.auth.name as string | undefined,
      picture: req.auth.picture as string | undefined,
      permissions: req.auth.permissions || [],
      roles: req.auth.roles || req.auth[envConfig.AUTH0_ROLES_CLAIM || 'roles'] || [],
      scope: req.auth.scope?.split(' ') || [],
      sub: req.auth.sub,
      iss: req.auth.iss,
      aud: req.auth.aud,
      iat: req.auth.iat,
      exp: req.auth.exp,
    };
    // @ts-ignore attach dynamic user prop
    req.user = userInfo;
    logger.debug('User info attached', { user: userInfo.id });
  }
  next();
};

/** Development-only debug middleware */
export const debugAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (envConfig.NODE_ENV === 'development') {
    logger.debug('Auth Debug', {
      path: req.path,
      method: req.method,
      auth: req.auth,
    });
  }
  next();
};
