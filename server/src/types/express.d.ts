import { IMongoUser } from '../models/MongoUser';

interface Auth0User {
  sub: string;
  email?: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
  name?: string;
  nickname?: string;
  picture?: string;
  [key: string]: any;
}

interface UserContext {
  mongoUser: IMongoUser;
  auth0User: Auth0User;
  userId: string;
}

declare global {
  namespace Express {
    interface Request {
      /**
       * Clean, typed user context structure (RECOMMENDED)
       * 
       * @example
       * ```ts
       * // Access user data via clean context
       * const { mongoUser, auth0User, userId } = req.userContext!;
       * 
       * // Type-safe access
       * const email = req.userContext!.mongoUser.email;
       * const auth0Sub = req.userContext!.auth0User.sub;
       * ```
       */
      userContext?: UserContext;

      /**
       * @deprecated Use `req.userContext.mongoUser` instead
       * @description Legacy field kept for backward compatibility. Will be removed in v2.0
       * 
       * @example
       * ```ts
       * // OLD (deprecated)
       * const user = req.user;
       * 
       * // NEW (recommended)
       * const user = req.userContext!.mongoUser;
       * ```
       */
      user?: IMongoUser;

      /**
       * @deprecated Use `req.userContext.auth0User` instead
       * @description Legacy field kept for backward compatibility. Will be removed in v2.0
       */
      auth0User?: Auth0User;

      /**
       * @deprecated Use `req.userContext.userId` instead
       * @description Legacy field kept for backward compatibility. Will be removed in v2.0
       */
      userId?: string;
    }
  }
}

export { UserContext, Auth0User };
