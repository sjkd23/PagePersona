/**
 * Example Routes with Auth0 JWT and Scope Enforcement
 *
 * This file demonstrates how to properly implement Auth0 authentication
 * and authorization in route handlers using the new middleware.
 */

import express from 'express';
import {
  jwtCheck,
  requireScopes,
  requireRoles,
  authErrorHandler,
  AuthenticatedRequest,
} from '../middleware/auth';

const router = express.Router();

// Apply auth error handler to all routes
router.use(authErrorHandler);

// ==========================================
// PUBLIC ROUTES (No authentication required)
// ==========================================

/**
 * Public health check endpoint
 * Accessible to everyone without authentication
 */
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

/**
 * Public info endpoint
 * Accessible to everyone without authentication
 */
router.get('/info', (req, res) => {
  res.json({
    app: 'PagePersonAI',
    version: '1.0.0',
    description: 'AI-powered content transformation service',
  });
});

// ==========================================
// PROTECTED ROUTES (Authentication required)
// ==========================================

/**
 * User profile endpoint
 * Requires valid JWT token (any authenticated user)
 */
router.get('/user/profile', jwtCheck, (req: AuthenticatedRequest, res) => {
  // req.auth contains the decoded JWT token
  res.json({
    userId: req.auth?.sub,
    email: req.auth?.email,
    name: req.auth?.name,
  });
});

/**
 * Transform content endpoint
 * Requires valid JWT token (any authenticated user)
 */
router.post('/transform', jwtCheck, (req, res) => {
  // Implementation here
  res.json({ message: 'Content transformed successfully' });
});

// ==========================================
// SCOPE-BASED ROUTES (Specific permissions)
// ==========================================

/**
 * Premium features endpoint
 * Requires valid JWT token + premium scope
 */
router.get('/premium/features', jwtCheck, requireScopes(['read:premium']), (req, res) => {
  res.json({ features: ['Advanced personas', 'Unlimited transforms'] });
});

/**
 * Analytics endpoint
 * Requires valid JWT token + analytics read scope
 */
router.get('/analytics', jwtCheck, requireScopes(['read:analytics']), (req, res) => {
  res.json({ analytics: 'data' });
});

// ==========================================
// ADMIN ROUTES (Role-based authorization)
// ==========================================

/**
 * Admin dashboard endpoint
 * Requires valid JWT token + admin role
 */
router.get('/admin/dashboard', jwtCheck, requireRoles(['admin']), (req, res) => {
  res.json({ dashboard: 'Admin dashboard data' });
});

/**
 * Admin user management endpoint
 * Requires valid JWT token + admin role + specific scopes
 */
router.get(
  '/admin/users',
  jwtCheck,
  requireRoles(['admin']),
  requireScopes(['read:admin', 'read:users']),
  (req, res) => {
    res.json({ users: 'User management data' });
  },
);

/**
 * System settings endpoint
 * Requires valid JWT token + admin role + write permissions
 */
router.post(
  '/admin/settings',
  jwtCheck,
  requireRoles(['admin']),
  requireScopes(['write:admin', 'write:settings']),
  (req, res) => {
    res.json({ message: 'Settings updated successfully' });
  },
);

// ==========================================
// MULTIPLE SCOPE REQUIREMENTS
// ==========================================

/**
 * Advanced admin endpoint
 * Requires valid JWT token + multiple scopes (all required)
 */
router.post(
  '/admin/advanced',
  jwtCheck,
  requireScopes(['read:admin', 'write:admin'], { checkAllScopes: true }),
  (req, res) => {
    res.json({ message: 'Advanced admin action completed' });
  },
);

export default router;

/**
 * Expected Auth0 JWT Token Claims:
 *
 * {
 *   "sub": "auth0|user123",
 *   "aud": "your-api-audience",
 *   "iss": "https://your-domain.auth0.com/",
 *   "iat": 1640995200,
 *   "exp": 1640998800,
 *   "scope": "openid profile email",
 *   "permissions": ["read:premium", "write:profile"],
 *   "roles": ["user"],
 *   "email": "user@example.com",
 *   "name": "John Doe"
 * }
 *
 * For admin users:
 * {
 *   "roles": ["admin"],
 *   "permissions": ["read:admin", "write:admin", "read:users", "write:users"]
 * }
 */

/**
 * Error Response Examples:
 *
 * 401 Unauthorized (missing/invalid token):
 * {
 *   "error": "Unauthorized",
 *   "message": "Invalid or missing authentication token",
 *   "code": "invalid_token"
 * }
 *
 * 403 Forbidden (insufficient permissions):
 * {
 *   "error": "Forbidden",
 *   "message": "Insufficient permissions",
 *   "required": ["read:admin"],
 *   "requireAll": false
 * }
 *
 * 403 Forbidden (insufficient roles):
 * {
 *   "error": "Forbidden",
 *   "message": "Insufficient roles",
 *   "required": ["admin"],
 *   "requireAll": false
 * }
 */
