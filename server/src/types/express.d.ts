/**
 * Express Module Augmentation
 *
 * This file extends the Express Request interface with custom properties used
 * throughout the application. It uses TypeScript's module augmentation feature
 * to add type-safe properties to the Express Request object.
 *
 * Key Features:
 * - No runtime imports - purely type declarations
 * - Automatically loaded by TypeScript via typeRoots configuration
 * - Provides type safety for all custom Request properties
 * - Supports both current and legacy property patterns
 *
 * Usage:
 * After this file is loaded, all Express Request objects will have
 * the custom properties available with full type safety:
 *
 * @example
 * ```typescript
 * app.get('/api/user', (req, res) => {
 *   // TypeScript knows about userContext
 *   const user = req.userContext?.mongoUser;
 *   const auth = req.auth?.sub;
 * });
 * ```
 */

import { IMongoUser } from '../models/mongo-user';

// Define the types inline to avoid import issues
interface Auth0JwtPayload {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  iss: string;
  aud: string | string[];
  iat: number;
  exp: number;
  [key: string]: unknown;
}

interface ProcessedAuth0User {
  id: string;
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
  givenName?: string;
  familyName?: string;
  nickname?: string;
  emailVerified?: boolean;
  locale?: string;
  updatedAt?: string;
  metadata?: {
    firstLogin?: Date;
    lastLogin?: Date;
    loginCount?: number;
    locale?: string;
  };
}

interface UserContext {
  jwtPayload: Auth0JwtPayload;
  auth0User: ProcessedAuth0User;
  mongoUser: IMongoUser;
}

interface AuthObject {
  sub: string;
  aud: string | string[];
  iss: string;
  iat: number;
  exp: number;
  scope?: string;
  permissions?: string[];
  [key: string]: unknown;
}

/**
 * Express Request Interface Extension
 *
 * Extends the Express Request interface with custom properties.
 * Uses 'express-serve-static-core' module for better TypeScript support.
 */
declare module 'express-serve-static-core' {
  interface Request {
    /**
     * ✅ UNIFIED USER CONTEXT (CURRENT STANDARD)
     *
     * Contains all user-related data in a single, well-typed object.
     * This is the preferred way to access user data throughout the application.
     *
     * @example
     * ```ts
     * // Access user data via unified context
     * const { jwtPayload, auth0User, mongoUser } = req.userContext!;
     *
     * // Type-safe access to specific data
     * const email = req.userContext!.mongoUser.email;
     * const auth0Sub = req.userContext!.jwtPayload.sub;
     * const username = req.userContext!.mongoUser.username;
     * ```
     */
    userContext?: UserContext;

    /**
     * Auth0 JWT information from express-jwt middleware
     * Contains the decoded JWT payload with user info and permissions
     */
    auth?: AuthObject;

    /**
     * @deprecated Legacy: Use `req.userContext.jwtPayload` instead
     * Raw JWT payload from Auth0 verification middleware
     */
    user?: Auth0JwtPayload;

    /**
     * @deprecated Legacy: Use `req.userContext.mongoUser` instead
     * MongoDB user document from sync middleware
     */
    mongoUser?: IMongoUser;

    /**
     * @deprecated Legacy: Use `req.userContext.auth0User` instead
     * Processed Auth0 user data
     */
    auth0User?: ProcessedAuth0User;

    /**
     * @deprecated Legacy: Use `req.userContext.mongoUser._id.toString()` instead
     * String representation of MongoDB user ID
     */
    userId?: string;
  }
}

export { UserContext };
