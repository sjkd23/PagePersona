/**
 * User synchronization utilities for backend integration
 *
 * This module provides functionality to synchronize user profile data
 * between the client application and backend services, including profile
 * retrieval, creation, and validation with comprehensive error handling.
 *
 * @module userSync
 */

import { logger } from './logger';

/**
 * User profile interface representing complete user data
 *
 * @interface UserProfile
 * @property {string} id - Unique user identifier
 * @property {string} auth0Id - Auth0 authentication provider ID
 * @property {string} email - User's email address
 * @property {string} username - User's chosen username
 * @property {string} [firstName] - User's first name
 * @property {string} [lastName] - User's last name
 * @property {string} [avatar] - URL to user's avatar image
 * @property {boolean} isEmailVerified - Email verification status
 * @property {string} role - User's role in the system
 * @property {object} preferences - User preference settings
 * @property {object} usage - User usage statistics
 * @property {string} createdAt - Account creation timestamp
 * @property {string} updatedAt - Last update timestamp
 */
export interface UserProfile {
  id: string;
  auth0Id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isEmailVerified: boolean;
  role: string;
  preferences: {
    theme: string;
    language: string;
    notifications: boolean;
  };
  usage: {
    dailyRequests: number;
    monthlyRequests: number;
    totalRequests: number;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Response interface for user synchronization operations
 *
 * @interface UserSyncResponse
 * @property {boolean} success - Whether the operation succeeded
 * @property {UserProfile} [profile] - User profile data (legacy field)
 * @property {UserProfile} [data] - User profile data
 * @property {string} [error] - Error message if operation failed
 */
export interface UserSyncResponse {
  success: boolean;
  profile?: UserProfile;
  data?: UserProfile;
  error?: string;
}

/**
 * API base URL for backend requests
 */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Synchronizes user profile data with the backend service
 *
 * Optimized sync process: tries GET first for existing users, then POST for new users.
 * Includes JWT validation, token expiry checking, and comprehensive error handling.
 *
 * @param {string} accessToken - JWT access token for authentication
 * @returns {Promise<UserProfile | null>} User profile data or null if failed
 */
export async function syncUserWithBackend(accessToken: string): Promise<UserProfile | null> {
  if (!accessToken || accessToken.split('.').length !== 3) {
    logger.sync.error('Invalid JWT token format');
    return null;
  }

  try {
    // Validate JWT payload and check expiration
    const parts = accessToken.split('.');
    let payload;
    try {
      payload = JSON.parse(atob(parts[1]));
    } catch {
      logger.sync.error('Cannot decode JWT payload');
      return null;
    }

    // Check token expiration
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < currentTime) {
      logger.sync.error('Token is expired');
      return null;
    }

    logger.sync.info('Starting user sync with backend');

    // 1️⃣ Try GET /user/profile for existing users
    const profileRes = await fetch(`${API_URL}/user/profile`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (profileRes.ok) {
      const result: UserSyncResponse = await profileRes.json();
      logger.sync.info('Profile retrieved', { success: result.success });
      return result.success ? (result.data ?? null) : null;
    }

    // If not found, but not another error
    if (profileRes.status !== 404) {
      const errorText = await profileRes.text();
      logger.sync.error('Profile request failed', undefined, {
        status: profileRes.status,
        errorText,
      });
      return null;
    }

    // 2️⃣ POST /user/sync for new users
    const syncRes = await fetch(`${API_URL}/user/sync`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    if (!syncRes.ok) {
      const errorText = await syncRes.text();
      logger.sync.error('Sync request failed', undefined, {
        status: syncRes.status,
        errorText,
      });
      return null;
    }

    const syncResult: UserSyncResponse = await syncRes.json();
    return syncResult.success ? (syncResult.data ?? null) : null;
  } catch (err) {
    logger.sync.error('Error during user sync', err);
    return null;
  }
}
