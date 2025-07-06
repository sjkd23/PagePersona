import { IMongoUser } from '../models/MongoUser';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        auth0Id?: string;
        user: IMongoUser;
        auth0User?: any;
      };
    }
  }
}

export {};
