/**
 * Auth0 JWT Authentication Middleware
 * 
 * This module provides JWT authentication middleware using Auth0 for secure
 * API access. It validates JWT tokens against Auth0's JSON Web Key Set (JWKS)
 * and ensures proper token format and signature verification.
 * 
 * Features:
 * - JWT signature verification using Auth0 JWKS
 * - Token caching for performance optimization
 * - Rate limiting for JWKS requests
 * - RS256 algorithm enforcement for security
 */

import { expressjwt } from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import dotenv from 'dotenv';

// Load environment variables for Auth0 configuration
dotenv.config();

/**
 * JWT authentication middleware configuration
 * 
 * This middleware validates JWT tokens using Auth0's public keys.
 * It automatically fetches and caches the JWKS (JSON Web Key Set) from Auth0
 * and verifies token signatures against the appropriate public key.
 * 
 * Configuration:
 * - Caches JWKS responses for improved performance
 * - Rate limits JWKS requests to 5 per minute
 * - Validates audience and issuer claims
 * - Enforces RS256 algorithm for enhanced security
 */
const checkJwt = expressjwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,                    // Cache JWKS responses for performance
    rateLimit: true,               // Enable rate limiting
    jwksRequestsPerMinute: 5,      // Limit JWKS requests to prevent abuse
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  }),
  audience: process.env.AUTH0_AUDIENCE,  // Expected token audience
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,  // Expected token issuer
  algorithms: ['RS256'],                 // Only allow RS256 algorithm
});

export default checkJwt;
