import express from 'express';
import { syncMongoUser } from '../controllers/mongoAuthController';
import { verifyAuth0Token } from '../middleware/auth0Middleware';

const router = express.Router();

// Legacy MongoDB auth routes - now using Auth0 for authentication
// These routes are maintained for backward compatibility and migration

// Sync Auth0 user with MongoDB
router.post('/sync', verifyAuth0Token, syncMongoUser);

// Health check for legacy auth system
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Legacy MongoDB auth system - now using Auth0',
    timestamp: new Date().toISOString(),
    note: 'Most auth functionality has migrated to Auth0. Use /api/user/* endpoints instead.'
  });
});

// Legacy endpoints redirect notice
const legacyNotice = (req: express.Request, res: express.Response) => {
  res.status(301).json({
    success: false,
    message: 'This endpoint has been migrated to Auth0',
    redirectTo: '/api/user',
    note: 'Please use Auth0 authentication and /api/user/* endpoints for user management'
  });
};

// Redirect legacy routes to Auth0-based endpoints
router.post('/register', legacyNotice);
router.post('/login', legacyNotice);
router.get('/profile', legacyNotice);
router.put('/profile', legacyNotice);
router.post('/change-password', legacyNotice);
router.post('/logout', legacyNotice);

export default router;
