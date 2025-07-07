import express, { Request, Response } from 'express';
import { MongoUser } from '../models/mongo-user';
import { verifyAuth0Token, syncAuth0User } from '../middleware/auth0-middleware';
import { createSuccessResponse, createErrorResponse, serializeMongoUser } from '../utils/userSerializer';
import { HttpStatus } from '../constants/http-status';
import { logger } from '../utils/logger';
import { redisClient } from '../utils/redis-client';

const router = express.Router();

/**
 * Middleware to check if user is admin
 */
const requireAdmin = (req: Request, res: Response, next: any) => {
  const user = req.userContext?.mongoUser;
  
  if (!user) {
    res.status(HttpStatus.UNAUTHORIZED).json(createErrorResponse('Authentication required'));
    return;
  }
  
  // Only allow users with role === 'admin', not membership === 'admin'
  if (user.role !== 'admin') {
    res.status(HttpStatus.FORBIDDEN).json(createErrorResponse('Admin role required'));
    return;
  }
  
  next();
};

/**
 * GET /api/admin/users - Get all users (admin only)
 */
router.get('/users', verifyAuth0Token, syncAuth0User, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const users = await MongoUser.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await MongoUser.countDocuments();
    const totalPages = Math.ceil(totalUsers / limit);

    const serializedUsers = users.map(user => serializeMongoUser(user));

    res.json(createSuccessResponse({
      users: serializedUsers,
      pagination: {
        page,
        limit,
        totalUsers,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }));
  } catch (error) {
    logger.auth.error('Error fetching users', error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(createErrorResponse('Failed to fetch users'));
  }
});

/**
 * PATCH /api/admin/users/:userId/membership - Update user membership (admin only)
 */
router.patch('/users/:userId/membership', verifyAuth0Token, syncAuth0User, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { membership } = req.body;

    // Validate membership value
    if (!['free', 'premium', 'admin'].includes(membership)) {
      res.status(HttpStatus.BAD_REQUEST).json(createErrorResponse('Invalid membership type. Must be free, premium, or admin'));
      return;
    }

    const user = await MongoUser.findById(userId);
    if (!user) {
      res.status(HttpStatus.NOT_FOUND).json(createErrorResponse('User not found'));
      return;
    }

    const previousMembership = user.membership;
    user.membership = membership;
    await user.save();

    // Clear Redis cache for this user's tier
    const cacheKey = `user:${userId}:tier`;
    await redisClient.del(cacheKey);

    logger.auth.info('User membership updated', {
      adminUserId: req.userContext?.mongoUser?._id,
      targetUserId: userId,
      previousMembership,
      newMembership: membership,
      cacheCleared: true
    });

    res.json(createSuccessResponse(
      serializeMongoUser(user),
      `User membership updated from ${previousMembership} to ${membership}`
    ));
  } catch (error) {
    logger.auth.error('Error updating user membership', error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(createErrorResponse('Failed to update user membership'));
  }
});

/**
 * GET /api/admin/stats - Get system statistics (admin only)
 */
router.get('/stats', verifyAuth0Token, syncAuth0User, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const totalUsers = await MongoUser.countDocuments();
    const freeUsers = await MongoUser.countDocuments({ membership: 'free' });
    const premiumUsers = await MongoUser.countDocuments({ membership: 'premium' });
    const adminUsers = await MongoUser.countDocuments({ membership: 'admin' });
    
    const now = new Date();
    const thisMonthUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const activeUsersThisMonth = await MongoUser.countDocuments({
      'usage.lastTransformation': { $gte: thisMonthUTC }
    });

    const totalTransformations = await MongoUser.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$usage.totalTransformations' }
        }
      }
    ]);

    const newUsersThisMonth = await MongoUser.countDocuments({
      createdAt: { $gte: thisMonthUTC }
    });

    res.json(createSuccessResponse({
      users: {
        total: totalUsers,
        free: freeUsers,
        premium: premiumUsers,
        admin: adminUsers,
        newThisMonth: newUsersThisMonth,
        activeThisMonth: activeUsersThisMonth
      },
      transformations: {
        total: totalTransformations[0]?.total || 0
      },
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    logger.auth.error('Error fetching admin stats', error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(createErrorResponse('Failed to fetch system statistics'));
  }
});

export default router;
