// src/utils/userSync.ts

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
    totalTransformations: number;
    monthlyUsage: number;
    lastTransformation?: string;
    usageResetDate: string;
  };
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface UserSyncResponse {
  success: boolean;
  data?: UserProfile;
  error?: string;
}

export async function syncUserWithBackend(accessToken: string): Promise<UserProfile | null> {
  if (!accessToken || accessToken.split('.').length !== 3) {
    console.error('❌ Invalid JWT token format');
    return null;
  }

  try {
    const profileRes = await fetch(`${API_URL}/user/profile`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (profileRes.status === 404) {
      const syncRes = await fetch(`${API_URL}/user/sync`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!syncRes.ok) {
        console.error('❌ Sync request failed:', await syncRes.text());
        return null;
      }

      const syncData: UserSyncResponse = await syncRes.json();
      return syncData.success ? syncData.data ?? null : null;
    }

    if (!profileRes.ok) {
      console.error('❌ Profile request failed:', await profileRes.text());
      return null;
    }

    const profileData: UserSyncResponse = await profileRes.json();
    return profileData.success ? profileData.data ?? null : null;

  } catch (err) {
    console.error('❌ Error during user sync:', err);
    return null;
  }
}

export async function updateUserProfile(
  accessToken: string,
  updates: Partial<Pick<UserProfile, 'firstName' | 'lastName' | 'preferences'>>
): Promise<UserProfile | null> {
  try {
    const res = await fetch(`${API_URL}/user/profile`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    if (!res.ok) {
      console.error('❌ Failed to update user profile:', await res.text());
      return null;
    }

    const result: UserSyncResponse = await res.json();
    return result.success ? result.data ?? null : null;

  } catch (err) {
    console.error('❌ Error updating user profile:', err);
    return null;
  }
}

export async function getUserUsage(accessToken: string) {
  try {
    const res = await fetch(`${API_URL}/user/usage`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      console.error('❌ Failed to get usage:', await res.text());
      return null;
    }

    const result = await res.json();
    return result.success ? result.data : null;

  } catch (err) {
    console.error('❌ Error getting usage data:', err);
    return null;
  }
}

export async function testTokenAuth(accessToken: string): Promise<boolean> {
  if (!accessToken || accessToken.split('.').length !== 3) {
    console.error('🧪 Invalid JWT token format');
    return false;
  }

  try {
    const res = await fetch(`${API_URL}/user/test-auth`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    return res.ok;

  } catch (err) {
    console.error('🧪 Test token auth error:', err);
    return false;
  }
}
