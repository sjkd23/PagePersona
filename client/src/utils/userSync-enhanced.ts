// Enhanced userSync.ts with better error handling
import { logger } from './logger';

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

export interface UserSyncResponse {
  success: boolean;
  profile?: UserProfile;
  data?: UserProfile;
  error?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function syncUserWithBackend(accessToken: string): Promise<UserProfile | null> {
  if (!accessToken || accessToken.split('.').length !== 3) {
    logger.sync.error('Invalid JWT token format');
    return null;
  }

  try {
    logger.sync.info('Starting user sync with backend');
    logger.sync.debug('Token preview', { preview: accessToken.substring(0, 50) + '...' });
    
    // Test server connectivity first
    try {
      const testRes = await fetch(`${API_URL}/user/test-no-auth`);
      if (!testRes.ok) {
        logger.sync.error('Server connectivity test failed');
        return null;
      }
      logger.sync.info('Server connectivity OK');
    } catch (error) {
      logger.sync.error('Cannot reach server', error);
      return null;
    }
    
    // Debug JWT structure
    const tokenParts = accessToken.split('.');
    if (tokenParts.length === 3) {
      try {
        const payload = JSON.parse(atob(tokenParts[1]));
        logger.sync.debug('JWT info', {
          sub: payload.sub?.substring(0, 10) + '...',
          aud: payload.aud,
          exp: new Date(payload.exp * 1000).toISOString(),
          scope: payload.scope
        });
        
        // Check if token is expired
        if (payload.exp * 1000 < Date.now()) {
          logger.sync.error('Token is expired');
          return null;
        }
      } catch (e) {
        logger.sync.error('Cannot decode JWT payload');
      }
    }

    // Try to get existing profile first
    logger.sync.debug('Fetching user profile');
    const profileRes = await fetch(`${API_URL}/user/profile`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    logger.sync.debug('Profile response status', { status: profileRes.status });

    if (profileRes.status === 404) {
      logger.sync.debug('User not found, triggering sync');
      
      // Try manual sync
      const syncRes = await fetch(`${API_URL}/user/sync`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      logger.sync.debug('Sync response status', { status: syncRes.status });

      if (!syncRes.ok) {
        const errorText = await syncRes.text();
        logger.sync.error('Sync request failed', undefined, { status: syncRes.status, errorText });
        return null;
      }

      const syncData: UserSyncResponse = await syncRes.json();
      logger.sync.info('Sync successful', { success: syncData.success });
      return syncData.success ? syncData.data ?? null : null;
    }

    if (!profileRes.ok) {
      const errorText = await profileRes.text();
      logger.sync.error('Profile request failed', undefined, { status: profileRes.status, errorText });
      return null;
    }

    const profileData: UserSyncResponse = await profileRes.json();
    logger.sync.info('Profile retrieved', { success: profileData.success });
    return profileData.success ? profileData.data ?? null : null;

  } catch (err) {
    logger.sync.error('Error during user sync', err);
    return null;
  }
}
