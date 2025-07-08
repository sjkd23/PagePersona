import { IMongoUser } from '../models/mongo-user';
import { Auth0JwtPayload, ProcessedAuth0User } from './user-types';

interface UserContext {
  jwtPayload: Auth0JwtPayload;
  auth0User: ProcessedAuth0User;
  mongoUser: IMongoUser;
}

declare global {
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
