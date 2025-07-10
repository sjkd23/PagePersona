/**
 * JWT Authentication Middleware
 * 
 * This module provides JWT authentication middleware using Auth0's JWKS
 * (JSON Web Key Set) for token verification. It validates JWT tokens
 * against Auth0's public keys to ensure secure API access.
 * 
 * Features:
 * - JWKS-based token verification
 * - Response caching for improved performance
 * - Rate limiting to prevent abuse
 * - RS256 algorithm enforcement
 */

import { expressjwt } from 'express-jwt';
import jwksRsa from 'jwks-rsa';

// Load Auth0 configuration from environment variables
const domain = process.env.AUTH0_DOMAIN;
const audience = process.env.AUTH0_AUDIENCE;

/**
 * JWT authentication middleware using Auth0 JWKS
 * 
 * This middleware validates JWT tokens by fetching the appropriate
 * public key from Auth0's JWKS endpoint and verifying the token signature.
 * 
 * Configuration:
 * - Enables caching and rate limiting for JWKS requests
 * - Limits JWKS requests to 5 per minute for security
 * - Validates audience and issuer claims
 * - Only accepts RS256 algorithm tokens
 */
export const jwtAuth = expressjwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,                    // Cache JWKS responses for performance
    rateLimit: true,               // Enable rate limiting
    jwksRequestsPerMinute: 5,      // Limit requests to prevent abuse
    jwksUri: `https://${domain}/.well-known/jwks.json`
  }),
  audience: audience,                // Expected token audience
  issuer: `https://${domain}/`,     // Expected token issuer
  algorithms: ['RS256']             // Only allow RS256 algorithm
});
