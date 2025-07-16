/**
 * Type loader for ts-node-dev
 *
 * This file ensures that ambient type declarations are loaded
 * when using ts-node-dev for development.
 */

import { IMongoUser } from '../models/mongo-user';

// Force TypeScript to recognize the module augmentation
declare module 'express-serve-static-core' {
  interface Request {
    userContext?: {
      jwtPayload: Record<string, unknown>;
      auth0User: Record<string, unknown>;
      mongoUser: IMongoUser;
    };
    auth?: Record<string, unknown>;
    user?: Record<string, unknown>;
    mongoUser?: IMongoUser;
    auth0User?: Record<string, unknown>;
    userId?: string;
  }
}

export {};
