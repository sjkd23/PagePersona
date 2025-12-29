/**
 * Auth0 JWT Authentication & Authorization Middleware
 *
 * This module provides comprehensive Auth0 integration with JWT validation,
 * scope enforcement, and permission checks for API routes.
 */

import "../types/loader";
import { Request, Response, NextFunction, RequestHandler } from "express";
import jwtAuthz from "express-jwt-authz";
import { parsedEnv } from "../utils/env-validation";
import { logger } from "../utils/logger";
import jwtAuth from "./jwtAuth";

/** Use validated environment configuration */
const envConfig = parsedEnv;

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

/** Middleware: validate JWT and attach decoded token to req.auth */
export const jwtCheck = jwtAuth;

/** Scope-based authorization */
export function requireScopes(
  scopes: string[],
  options: {
    checkAllScopes?: boolean;
    customScopeKey?: string;
    failWithError?: boolean;
  } = {},
): RequestHandler {
  const {
    checkAllScopes = false,
    customScopeKey = "permissions",
    failWithError = true,
  } = options;

  return jwtAuthz(scopes, {
    customScopeKey,
    checkAllScopes,
    failWithError,
    customUserKey: "auth",
  });
}

/** Permission-based authorization */
export function requirePermissions(
  permissions: string[],
  options: { requireAll?: boolean } = {},
) {
  const { requireAll = false } = options;

  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): void => {
    const userPerms = req.auth?.permissions || [];
    if (!Array.isArray(userPerms)) {
      logger.warn("Permissions missing or malformed", {
        user: req.auth?.sub,
        permissions: userPerms,
      });
      res.status(403).json({
        error: "Forbidden",
        message: "Insufficient permissions",
      });
      return;
    }

    const ok = requireAll
      ? permissions.every((p) => userPerms.includes(p))
      : permissions.some((p) => userPerms.includes(p));

    if (!ok) {
      logger.warn("Permission check failed", {
        user: req.auth?.sub,
        required: permissions,
        has: userPerms,
        requireAll,
      });
      res.status(403).json({
        error: "Forbidden",
        message: "Insufficient permissions",
        required: permissions,
        requireAll,
      });
      return;
    }

    logger.debug("Permission check passed", {
      user: req.auth?.sub,
      permissions: userPerms,
    });
    next();
  };
}

/** Role-based authorization */
export function requireRoles(
  roles: string[],
  options: { requireAll?: boolean } = {},
) {
  const { requireAll = false } = options;

  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): void => {
    const userRoles =
      req.auth?.roles ||
      req.auth?.[envConfig.AUTH0_ROLES_CLAIM || "roles"] ||
      [];

    if (!Array.isArray(userRoles)) {
      logger.warn("Roles missing or malformed", {
        user: req.auth?.sub,
        roles: userRoles,
      });
      res.status(403).json({
        error: "Forbidden",
        message: "Insufficient roles",
      });
      return;
    }

    const ok = requireAll
      ? roles.every((r) => userRoles.includes(r))
      : roles.some((r) => userRoles.includes(r));

    if (!ok) {
      logger.warn("Role check failed", {
        user: req.auth?.sub,
        required: roles,
        has: userRoles,
        requireAll,
      });
      res.status(403).json({
        error: "Forbidden",
        message: "Insufficient roles",
        required: roles,
        requireAll,
      });
      return;
    }

    logger.debug("Role check passed", {
      user: req.auth?.sub,
      roles: userRoles,
    });
    next();
  };
}

/** Optional JWT: if token present, validate, else continue */
export const optionalJwtCheck = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) return next();

  jwtAuth(req, res, (err) => {
    if (err) {
      logger.debug("Optional JWT failed", { error: err.message });
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
  if (err.name === "UnauthorizedError") {
    logger.warn("JWT validation failed", {
      error: err.message,
      code: err.code,
      path: req.path,
      method: req.method,
    });

    const resp: Record<string, unknown> = {
      error: "Unauthorized",
      message: "Invalid or missing authentication token",
      code: err.code || "INVALID_TOKEN",
    };
    if (envConfig.NODE_ENV !== "production") {
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
      roles:
        req.auth.roles ||
        req.auth[envConfig.AUTH0_ROLES_CLAIM || "roles"] ||
        [],
      scope: req.auth.scope?.split(" ") || [],
      sub: req.auth.sub,
      iss: req.auth.iss,
      aud: req.auth.aud,
      iat: req.auth.iat,
      exp: req.auth.exp,
    };
    // @ts-ignore attach dynamic user prop
    req.user = userInfo;
    logger.debug("User info attached", { user: userInfo.id });
  }
  next();
};

/** Development-only debug middleware */
export const debugAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  // Only enable debug middleware in development environment
  if (envConfig.NODE_ENV === "development") {
    logger.debug("Auth Debug", {
      user: req.user,
      auth: req.auth,
      path: req.path,
      headers: Object.keys(req.headers),
    });
  }
  next();
};
