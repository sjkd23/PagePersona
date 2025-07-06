// src/routes/authRoute.ts
// DEPRECATED: This file is kept for compatibility but all Auth0 functionality has moved to userRoute.ts
// All Auth0 user sync and profile management is now handled by /api/user/* endpoints

import express, { Request, Response } from 'express';

const router = express.Router();

// Redirect deprecated endpoints to their new locations
router.all('/user/*', (req: Request, res: Response): void => {
  const newPath = req.originalUrl.replace('/api/auth/user', '/api/user');
  res.status(301).json({
    success: false,
    deprecated: true,
    message: 'This endpoint has moved. Please use the new endpoint.',
    oldEndpoint: req.originalUrl,
    newEndpoint: newPath,
    info: 'All Auth0 user functionality is now available at /api/user/* endpoints'
  });
});

// General info endpoint
router.get('/', (req: Request, res: Response): void => {
  res.json({
    success: true,
    message: 'Auth routes are deprecated',
    info: 'All Auth0 functionality has moved to /api/user/* endpoints',
    availableEndpoints: [
      'GET /api/user/profile - Get user profile',
      'PUT /api/user/profile - Update user profile', 
      'POST /api/user/sync - Sync user with Auth0',
      'GET /api/user/usage - Get user usage statistics',
      'GET /api/user/test-auth - Test JWT authentication',
      'GET /api/user/test-no-auth - Test server connectivity'
    ]
  });
});

export default router;
