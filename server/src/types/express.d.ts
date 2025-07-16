// Express module augmentation for custom user properties
// This file extends the Express Request interface with user context

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

// Simple user interface for now
interface IMongoUser {
  _id: unknown;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  [key: string]: unknown;
}

interface UserContext {
  jwtPayload: Auth0JwtPayload;
  auth0User: ProcessedAuth0User;
  mongoUser: IMongoUser;
}

declare module 'express' {
  namespace Express {
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
}

export { UserContext };
