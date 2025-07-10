// src/hooks/useAuth0.tsx
import { useEffect, useState, useCallback, useContext } from 'react';
import type { ReactNode } from 'react';
import { useAuth0, Auth0Provider as Auth0ProviderBase } from '@auth0/auth0-react';
import { syncUserWithBackend } from '../utils/userSync';
import type { UserProfile } from '../utils/userSync';
import { setTokenGetter } from '../lib/apiClient';
import { domain, clientId, redirectUri, audience } from '../config/auth';
import { AuthContext, type AuthContextType, type CustomClaims } from '../contexts/AuthContext';

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function Auth0Provider({ children }: { children: ReactNode }) {
  if (!domain || !clientId) {
    console.error('Auth0 configuration missing');
    return null;
  }

  return (
    <Auth0ProviderBase
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
        audience,
        scope: "openid profile email"
      }}
      useRefreshTokens
      cacheLocation="localstorage"
      onRedirectCallback={(appState) => {
        window.history.replaceState({}, document.title, appState?.returnTo || window.location.pathname);
      }}
    >
      <AuthContextProvider>{children}</AuthContextProvider>
    </Auth0ProviderBase>
  );
}

function AuthContextProvider({ children }: { children: ReactNode }) {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently
  } = useAuth0();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [customClaims, setCustomClaims] = useState<CustomClaims | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const getAccessToken = useCallback(async () => {
    try {
      const token = await getAccessTokenSilently({ authorizationParams: { audience } }) as string;
      return token;
    } catch (error) {
      console.error('Token error:', error);
      return undefined;
    }
  }, [getAccessTokenSilently]);

  const syncUser = useCallback(async () => {
    if (!isAuthenticated || !user || isSyncing) return;
    setIsSyncing(true);
    try {
      const token = await getAccessToken();
      if (token) {
        const profile = await syncUserWithBackend(token);
        setUserProfile(profile);
        const claims = JSON.parse(atob(token.split('.')[1]));
        setCustomClaims({
          'https://pagepersona.com/is_new_user': claims['https://pagepersona.com/is_new_user'],
          'https://pagepersona.com/first_login': claims['https://pagepersona.com/first_login'],
          'https://pagepersona.com/profile_created_at': claims['https://pagepersona.com/profile_created_at'],
          'https://pagepersona.com/profile_sync_error': claims['https://pagepersona.com/profile_sync_error'],
        });
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isAuthenticated, user, isSyncing, getAccessToken]);

  // Only sync once when user becomes authenticated and we don't have a profile yet
  useEffect(() => {
    if (isAuthenticated && user && !userProfile && !isSyncing) {
      syncUser();
      setTokenGetter(getAccessToken);
    }
  }, [isAuthenticated, user, userProfile, isSyncing, syncUser, getAccessToken]);

  const login = () => loginWithRedirect({ authorizationParams: { audience, screen_hint: 'login' } });
  const signup = () => loginWithRedirect({ authorizationParams: { audience, screen_hint: 'signup' } });
  const logout = () => {
    setUserProfile(null);
    setCustomClaims(null);
    auth0Logout({ logoutParams: { returnTo: redirectUri } });
  };

  const getCustomClaims = async () => customClaims;

  return (
    <AuthContext.Provider value={{
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
      getCustomClaims
    }}>
      {children}
    </AuthContext.Provider>
  );
}
