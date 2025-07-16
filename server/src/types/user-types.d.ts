/**
 * User-related types and interfaces
 * Shared between common.ts and express.d.ts to prevent circular dependencies
 */

/**
 * Raw Auth0 JWT payload structure
 * Represents the decoded JWT token from Auth0
 */
export interface Auth0JwtPayload {
  /** Unique Auth0 user identifier (required) */
  sub: string;

  /** Email address from Auth0 (optional - may not be verified) */
  email?: string;

  /** Display name from Auth0 (optional) */
  name?: string;

  /** Profile picture URL from Auth0 (optional) */
  picture?: string;

  /** Token issuer (Auth0 domain) */
  iss: string;

  /** Token audience (API identifier) */
  aud: string | string[];

  /** Token issued at timestamp */
  iat: number;

  /** Token expiration timestamp */
  exp: number;

  /** Additional custom claims from Auth0 rules/actions */
  [key: string]: unknown;
}

/**
 * Processed Auth0 user data
 * Clean, validated user information extracted from Auth0 JWT payload
 */
export interface ProcessedAuth0User {
  /** Auth0 user ID (extracted from 'sub' claim) */
  id: string;
  /**
   * Legacy/compatibility: Auth0 user ID (from 'sub' claim)
   * Some code expects 'sub' instead of 'id'.
   */
  sub?: string;
  /** User's email address (validated and cleaned) */
  email?: string;
  /** User's display name (validated and cleaned) */
  name?: string;
  /** User's profile picture URL (validated and cleaned) */
  picture?: string;
  /** User's given name (first name) */
  givenName?: string;
  /** User's family name (last name) */
  familyName?: string;
  /** User's nickname (from Auth0) */
  nickname?: string;
  /** Whether the user's email is verified */
  emailVerified?: boolean;
  /** User's preferred locale */
  locale?: string;
  /** Last update timestamp */
  updatedAt?: string;
  /** Additional metadata from Auth0 */
  metadata?: {
    /** When the user first logged in via Auth0 */
    firstLogin?: Date;
    /** Last login timestamp */
    lastLogin?: Date;
    /** Login count */
    loginCount?: number;
    /** User's preferred locale */
    locale?: string;
  };
}
