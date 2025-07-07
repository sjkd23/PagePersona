import { Request, Response } from 'express';
import { IMongoUser, MongoUser } from '../models/mongo-user';
import { logger } from '../utils/logger';
import { HttpStatus } from '../constants/http-status';
import type { AuthenticatedRequest } from '../types/common';
import { 
  serializeMongoUser, 
  serializeUserUsage, 
  serializeUserSummary,
  createSuccessResponse,
  createErrorResponse
} from '../utils/userSerializer';

// Get current user info (Auth0 compatible)
export const getUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.userContext?.mongoUser;
    
    if (!user) {
      res.status(HttpStatus.NOT_FOUND).json(createErrorResponse('User not found'));
      return;
    }

    const serializedUser = serializeMongoUser(user);
    res.json(createSuccessResponse({ user: serializedUser }));
  } catch (error) {
    logger.auth.error('Error fetching user', error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(createErrorResponse('Internal server error'));
    return;
  }
};

// Get current user's usage statistics
export const getUserUsage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.userContext?.mongoUser;
    
    if (!user) {
      res.status(HttpStatus.NOT_FOUND).json(createErrorResponse('User not found'));
      return;
    }

    const usage = serializeUserUsage(user);
    res.json(createSuccessResponse(usage));
  } catch (error) {
    logger.auth.error('Error fetching user usage', error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(createErrorResponse('Internal server error'));
    return;
  }
};

// Get current user's summary
export const getUserSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.userContext?.mongoUser;
    
    if (!user) {
      res.status(HttpStatus.NOT_FOUND).json(createErrorResponse('User not found'));
      return;
    }

    const summary = serializeUserSummary(user);
    res.json(createSuccessResponse(summary));
  } catch (error) {
    logger.auth.error('Error fetching user summary', error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(createErrorResponse('Internal server error'));
    return;
  }
};
