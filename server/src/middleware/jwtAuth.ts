/**
 * Consolidated JWT Authentication Middleware
 *
 * Single, canonical JWT authentication module using Auth0 for secure API access.
 * This module validates JWT tokens against Auth0's JSON Web Key Set (JWKS)
 * with fail-fast environment validation and optimized performance settings.
 *
 * Features:
 * - Fail-fast validation of required Auth0 environment variables
 * - JWT signature verification using Auth0 JWKS with caching
 * - RS256 algorithm enforcement for security
 * - Optimized JWKS caching and rate limiting
 */

import { expressjwt } from "express-jwt";
import jwksRsa from "jwks-rsa";
import { parsedEnv } from "../utils/env-validation";

// ─── JWKS URI Construction ──────────────────────────────────────────────────────
const jwksUri = `https://${parsedEnv.AUTH0_DOMAIN}/.well-known/jwks.json`;

// Log JWKS URI for monitoring
console.log(`🔑 JWKS URI: ${jwksUri}`);

// ─── JWT Middleware Export (Default) ────────────────────────────────────────────
export default expressjwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 10,
    cacheMaxEntries: 5,
    cacheMaxAge: 600_000, // 10 minutes
    jwksUri,
  }),
  audience: parsedEnv.AUTH0_AUDIENCE,
  issuer: `https://${parsedEnv.AUTH0_DOMAIN}/`,
  algorithms: ["RS256"],
  requestProperty: "user",
  credentialsRequired: true,
});

// ─── Utility Functions ──────────────────────────────────────────────────────────
/**
 * Get JWT configuration information for monitoring
 */
export function getJwtInfo(): {
  domain: string;
  audience: string;
  jwksUri: string;
} {
  return {
    domain: parsedEnv.AUTH0_DOMAIN,
    audience: parsedEnv.AUTH0_AUDIENCE,
    jwksUri,
  };
}
