// Auth0 claim utilities for safe, consistent access to user data
// Handles environment variations and provides fallbacks

import type { Auth0JwtPayload, ProcessedAuth0User } from '../types/common';

interface SafeAuth0Claims {
  sub: string;
  email?: string;
  emailVerified?: boolean;
  name?: string;
  givenName?: string;
  familyName?: string;
  nickname?: string;
  picture?: string;
  locale?: string;
  updatedAt?: string;
}

/**
 * Standard Auth0 claim mappings that should be consistent across environments
 */
const STANDARD_CLAIMS = {
  sub: 'sub',                    // Always present, unique identifier
  email: 'email',                // Standard email claim
  emailVerified: 'email_verified', // Email verification status
  name: 'name',                  // Full name
  givenName: 'given_name',       // First name  
  familyName: 'family_name',     // Last name
  nickname: 'nickname',          // Username/nickname
  picture: 'picture',            // Profile picture URL
  locale: 'locale',              // User locale
  updatedAt: 'updated_at'        // Last update timestamp
} as const;

/**
 * Environment-specific claim mappings for non-standard claims
 * Configure this per tenant/environment if needed
 */
const ENVIRONMENT_CLAIMS = {
  // Custom claims might have different paths per environment
  customUserId: process.env.AUTH0_CUSTOM_USER_ID_CLAIM || 'https://api.pagepersona.com/user_id',
  roles: process.env.AUTH0_ROLES_CLAIM || 'https://api.pagepersona.com/roles',
  permissions: process.env.AUTH0_PERMISSIONS_CLAIM || 'https://api.pagepersona.com/permissions'
};

/**
 * Safely extract standard claims from Auth0 user object
 * Provides consistent access regardless of JWT structure variations
 */
export function safeGetAuth0Claims(auth0User: Auth0JwtPayload): SafeAuth0Claims {
  if (!auth0User) {
    throw new Error('Auth0 user object is required');
  }

  // Sub is required - this should always be present
  const sub = auth0User[STANDARD_CLAIMS.sub];
  if (!sub) {
    throw new Error('Auth0 sub claim is missing - invalid JWT token');
  }

  return {
    sub,
    email: auth0User[STANDARD_CLAIMS.email],
    emailVerified: Boolean(auth0User[STANDARD_CLAIMS.emailVerified]),
    name: auth0User[STANDARD_CLAIMS.name],
    givenName: auth0User[STANDARD_CLAIMS.givenName],
    familyName: auth0User[STANDARD_CLAIMS.familyName],
    nickname: auth0User[STANDARD_CLAIMS.nickname],
    picture: auth0User[STANDARD_CLAIMS.picture],
    locale: auth0User[STANDARD_CLAIMS.locale],
    updatedAt: auth0User[STANDARD_CLAIMS.updatedAt]
  };
}

/**
 * Get custom claims with environment-specific handling
 */
export function safeGetCustomClaims(auth0User: Auth0JwtPayload) {
  if (!auth0User) {
    return {};
  }

  return {
    customUserId: auth0User[ENVIRONMENT_CLAIMS.customUserId],
    roles: auth0User[ENVIRONMENT_CLAIMS.roles] || [],
    permissions: auth0User[ENVIRONMENT_CLAIMS.permissions] || []
  };
}

/**
 * Enhanced email access with multiple fallback strategies
 */
export function safeGetEmail(auth0User: Auth0JwtPayload): string | null {
  if (!auth0User) return null;

  // Try standard email claim first
  const standardEmail = auth0User[STANDARD_CLAIMS.email];
  if (standardEmail && typeof standardEmail === 'string' && standardEmail.includes('@')) {
    return standardEmail;
  }

  // Fallback to sub if it looks like an email
  const sub = auth0User[STANDARD_CLAIMS.sub];
  if (sub && typeof sub === 'string' && sub.includes('@') && !sub.startsWith('auth0|')) {
    return sub;
  }

  // Check for environment-specific email claims
  const customEmail = auth0User[`${process.env.AUTH0_DOMAIN}/email`];
  if (customEmail && typeof customEmail === 'string' && customEmail.includes('@')) {
    return customEmail;
  }

  return null;
}

/**
 * Safe name extraction with fallback hierarchy
 */
export function safeGetDisplayName(auth0User: Auth0JwtPayload): string {
  if (!auth0User) return 'Anonymous User';

  const claims = safeGetAuth0Claims(auth0User);
  
  // Preference order: name > givenName + familyName > nickname > email > sub
  if (claims.name && claims.name.trim()) {
    return claims.name.trim();
  }

  if (claims.givenName || claims.familyName) {
    return [claims.givenName, claims.familyName].filter(Boolean).join(' ').trim();
  }

  if (claims.nickname && claims.nickname.trim()) {
    return claims.nickname.trim();
  }

  const email = safeGetEmail(auth0User);
  if (email) {
    return email.split('@')[0]; // Use email username part
  }

  // Last resort: use sub but clean it up
  const sub = claims.sub;
  if (sub.startsWith('auth0|')) {
    return `User ${sub.slice(-6)}`; // "User abc123"
  }

  return sub.slice(0, 20); // Truncate long subs
}

/**
 * Validate Auth0 user object structure
 */
export function validateAuth0User(auth0User: Auth0JwtPayload): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!auth0User) {
    errors.push('Auth0 user object is null or undefined');
    return { isValid: false, errors };
  }

  if (typeof auth0User !== 'object') {
    errors.push('Auth0 user is not an object');
    return { isValid: false, errors };
  }

  // Check required fields
  if (!auth0User.sub) {
    errors.push('Missing required "sub" claim');
  }

  if (typeof auth0User.sub !== 'string') {
    errors.push('Sub claim must be a string');
  }

  // Check optional but important fields
  const email = safeGetEmail(auth0User);
  if (auth0User.email && !email) {
    errors.push('Email claim is present but invalid format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Debug utility - log all claims for troubleshooting
 */
export function debugAuth0Claims(auth0User: Auth0JwtPayload, userId?: string): void {
  if (process.env.NODE_ENV === 'production') return;

  const userLabel = userId ? ` for user ${userId}` : '';
  console.log(`🔍 Auth0 Claims Debug${userLabel}:`);
  
  try {
    const standardClaims = safeGetAuth0Claims(auth0User);
    const customClaims = safeGetCustomClaims(auth0User);
    
    console.log('📋 Standard Claims:', standardClaims);
    console.log('🔧 Custom Claims:', customClaims);
    console.log('📧 Safe Email:', safeGetEmail(auth0User));
    console.log('👤 Display Name:', safeGetDisplayName(auth0User));
    
    // Show any unrecognized claims
    const knownClaimKeys = [
      ...Object.values(STANDARD_CLAIMS),
      ...Object.values(ENVIRONMENT_CLAIMS),
      'iss', 'aud', 'exp', 'iat', 'azp', 'scope' // JWT standard claims
    ];
    
    const unknownClaims = Object.keys(auth0User).filter(key => !knownClaimKeys.includes(key));
    if (unknownClaims.length > 0) {
      console.log('❓ Unknown Claims:', unknownClaims.map(key => `${key}: ${auth0User[key]}`));
    }
    
  } catch (error) {
    console.error('❌ Error debugging Auth0 claims:', error);
  }
}
