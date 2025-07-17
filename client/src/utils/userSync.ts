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
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

/**
 * Synchronizes user profile data with the backend service
 *
 * Attempts to retrieve existing user profile or create a new one through
 * the sync endpoint. Includes JWT validation, token expiry checking, and
 * comprehensive error handling with detailed logging.
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
    logger.sync.info('Starting user sync with backend');
    logger.sync.debug('Token preview', {
      preview: accessToken.substring(0, 50) + '...',
    });

    // Debug JWT structure
    const tokenParts = accessToken.split('.');
    if (tokenParts.length === 3) {
      try {
        const payload = JSON.parse(atob(tokenParts[1]));
        logger.sync.debug('JWT info', {
          sub: payload.sub?.substring(0, 10) + '...',
          aud: payload.aud,
          exp: new Date(payload.exp * 1000).toISOString(),
          scope: payload.scope,
        });

        // Check if token is expired
        if (payload.exp * 1000 < Date.now()) {
          logger.sync.error('Token is expired');
          return null;
        }
      } catch {
        logger.sync.error('Cannot decode JWT payload');
      }
    }

    // Try to get existing profile first
    logger.sync.debug('Fetching user profile');
    const profileRes = await fetch(`${API_URL}/user/profile`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    logger.sync.debug('Profile response status', { status: profileRes.status });

    if (profileRes.status === 404) {
      logger.sync.debug('User not found, triggering sync');

      // Try manual sync
      const syncRes = await fetch(`${API_URL}/user/sync`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      logger.sync.debug('Sync response status', { status: syncRes.status });

      if (!syncRes.ok) {
        const errorText = await syncRes.text();
        logger.sync.error('Sync request failed', undefined, {
          status: syncRes.status,
          errorText,
        });
        return null;
      }

      const syncData: UserSyncResponse = await syncRes.json();
      logger.sync.info('Sync successful', { success: syncData.success });
      return syncData.success ? (syncData.data ?? null) : null;
    }

    if (!profileRes.ok) {
      const errorText = await profileRes.text();
      logger.sync.error('Profile request failed', undefined, {
        status: profileRes.status,
        errorText,
      });
      return null;
    }

    const profileData: UserSyncResponse = await profileRes.json();
    logger.sync.info('Profile retrieved', { success: profileData.success });
    return profileData.success ? (profileData.data ?? null) : null;
  } catch (err) {
    logger.sync.error('Error during user sync', err);
    return null;
  }
}
