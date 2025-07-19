// src/providers/AuthContextProvider.tsx
import { useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { syncUserWithBackend } from '../utils/userSync';
import type { UserProfile } from '../utils/userSync';
import { setTokenGetter } from '../lib/apiClient';
import { audience, redirectUri } from '../config/auth';
import { AuthContext, type CustomClaims } from '../contexts/AuthContext';

export function AuthContextProvider({ children }: { children: ReactNode }) {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently,
  } = useAuth0();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [customClaims, setCustomClaims] = useState<CustomClaims | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasAttemptedSync, setHasAttemptedSync] = useState(false); // Track if we've attempted sync to prevent infinite loop

  const getAccessToken = useCallback(async () => {
    try {
      const token = (await getAccessTokenSilently({
        authorizationParams: { audience },
      })) as string;
      return token;
    } catch {
      return undefined;
    }
  }, [getAccessTokenSilently]);

  const syncUser = useCallback(async () => {
    if (!isAuthenticated || !user || isSyncing) return;
    setIsSyncing(true);
    setHasAttemptedSync(true); // Mark that we've attempted sync
    try {
      const token = await getAccessToken();
      if (token) {
        const profile = await syncUserWithBackend(token);
        setUserProfile(profile);
        const claims = JSON.parse(atob(token.split('.')[1]));
        setCustomClaims({
          'https://pagepersona.com/is_new_user': claims['https://pagepersona.com/is_new_user'],
          'https://pagepersona.com/first_login': claims['https://pagepersona.com/first_login'],
          'https://pagepersona.com/profile_created_at':
            claims['https://pagepersona.com/profile_created_at'],
          'https://pagepersona.com/profile_sync_error':
            claims['https://pagepersona.com/profile_sync_error'],
        });
      }
    } catch {
      // Sync error - continue without sync
    } finally {
      setIsSyncing(false);
    }
  }, [isAuthenticated, user, isSyncing, getAccessToken]);

  // Only sync once when user becomes authenticated and we haven't attempted sync yet
  useEffect(() => {
    if (isAuthenticated && user && !hasAttemptedSync && !isSyncing) {
      syncUser(); // Run syncUser only once to prevent infinite sync-retry loop
      setTokenGetter(getAccessToken);
    }
  }, [isAuthenticated, user, hasAttemptedSync, isSyncing, syncUser, getAccessToken]);

  const login = () =>
    loginWithRedirect({
      authorizationParams: {
        audience,
      },
    });
  const signup = () =>
    loginWithRedirect({
      authorizationParams: {
        audience,
      },
    });
  const logout = () => {
    setUserProfile(null);
    setCustomClaims(null);
    setHasAttemptedSync(false); // Reset sync attempt state on logout
    auth0Logout({ logoutParams: { returnTo: redirectUri } });
  };

  const getCustomClaims = async () => customClaims;

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        userProfile,
        isAuthenticated,
        isLoading,
        isSyncing,
        error: error?.message || null,
        login,
        logout,
        signup,
        getAccessToken,
        refreshUserProfile: syncUser,
        isNewUser: customClaims?.['https://pagepersona.com/is_new_user'] ?? null,
        isFirstLogin: customClaims?.['https://pagepersona.com/first_login'] ?? null,
        profileSyncError: customClaims?.['https://pagepersona.com/profile_sync_error'] ?? null,
        getCustomClaims,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
