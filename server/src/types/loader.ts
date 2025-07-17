/**
 * Type loader for ts-node-dev
 *
 * This file ensures that ambient type declarations are loaded
 * when using ts-node-dev for development.
 */

import { IMongoUser } from '../models/mongo-user';
import { Auth0JwtPayload, ProcessedAuth0User } from './user-types';

// Force TypeScript to recognize the module augmentation
declare module 'express-serve-static-core' {
  interface Request {
    userContext?: {
      jwtPayload: Auth0JwtPayload;
      auth0User: ProcessedAuth0User;
      mongoUser: IMongoUser;
    };
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
    user?: Auth0JwtPayload;
    mongoUser?: IMongoUser;
    auth0User?: ProcessedAuth0User;
    userId?: string;
  }
}

export {};
