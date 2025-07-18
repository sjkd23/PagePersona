// src/middleware/checkJwt.ts

/**
 * Auth0 JWT Authentication Middleware
 *
 * This module provides JWT authentication middleware using Auth0 for secure
 * API access. It validates JWT tokens against Auth0's JSON Web Key Set (JWKS)
 * and ensures proper token format and signature verification.
 *
 * Features:
 * - JWT signature verification using Auth0 JWKS
 * - Key caching and rate limiting for performance
 * - RS256 algorithm enforcement for security
 * - Fail-fast on missing environment variables
 */

import { expressjwt } from 'express-jwt';
import jwksRsa from 'jwks-rsa';

// ─── Fail-fast on missing ENV vars ─────────────────────────────────────────────
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;
if (!AUTH0_DOMAIN) {
  throw new Error('Missing required ENV var: AUTH0_DOMAIN');
}
if (!AUTH0_AUDIENCE) {
  throw new Error('Missing required ENV var: AUTH0_AUDIENCE');
}

// ─── JWT Middleware Configuration ────────────────────────────────────────────
const checkJwt = expressjwt({
  // Use JWKS from Auth0, with cache + rate limiting
  secret: jwksRsa.expressJwtSecret({
    cache: true, // cache keys in memory
    rateLimit: true, // throttle JWKS calls
    jwksRequestsPerMinute: 5, // adjust as needed
    cacheMaxEntries: 5, // how many entries to store
    cacheMaxAge: 10 * 60 * 1000, // ms: 10 minutes
    jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`,
  }),
  audience: AUTH0_AUDIENCE, // expected audience in token
  issuer: `https://${AUTH0_DOMAIN}/`, // expected issuer of token
  algorithms: ['RS256'], // only allow RS256
});

export default checkJwt;
