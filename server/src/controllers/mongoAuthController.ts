// src/controllers/mongoAuthController.ts

import { Request, Response } from 'express';
import { MongoUser } from '../models/MongoUser';

export const syncMongoUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sub: auth0Id, email, name, picture } = (req.user as any);
    if (!auth0Id || !email) {
      res.status(400).json({ error: 'Auth0 ID or email missing' });
      return;
    }

    let user = await MongoUser.findOne({ auth0Id });
    if (!user) {
      user = await MongoUser.create({ auth0Id, email, name, picture });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    console.error('Mongo sync error:', err);
    res.status(500).json({ success: false, error: 'Server error during sync' });
  }
};
