// src/providers/AuthContextProvider.tsx
import { useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { syncUserWithBackend } from "../utils/userSync";
import type { UserProfile } from "../utils/userSync";
import { setTokenGetter } from "../lib/apiClient";
import { audience, redirectUri } from "../config/auth";
import { AuthContext, type CustomClaims } from "../contexts/AuthContext";

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
  const [lastSyncAttempt, setLastSyncAttempt] = useState<number>(0);
  const [auth0Error, setAuth0Error] = useState<typeof error>(null);

  const MIN_SYNC_INTERVAL = 60000; // 1 minute minimum between sync attempts

  const getAccessToken = useCallback(async () => {
    try {
      const token = (await getAccessTokenSilently({
        authorizationParams: { audience },
      })) as string;
      setAuth0Error(null); // Clear any previous errors on success
      return token;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Token fetch failed";
      setAuth0Error(error as typeof auth0Error);

      // Specific Auth0 errors that require re-authentication
      if (
        errorMessage.includes("login_required") ||
        errorMessage.includes("consent_required") ||
        errorMessage.includes("interaction_required")
      ) {
        console.warn("Auth0 requires re-authentication:", errorMessage);
        // Don't auto-redirect, let user choose to log in again
      } else {
        console.error("Token fetch error:", errorMessage);
      }

      return undefined;
    }
  }, [getAccessTokenSilently]);

  const syncUser = useCallback(async () => {
    const now = Date.now();

    // Prevent rapid successive syncs - rate limiting
    if (now - lastSyncAttempt < MIN_SYNC_INTERVAL && hasAttemptedSync) {
      console.warn(
        `Sync attempted too soon (${Math.round((MIN_SYNC_INTERVAL - (now - lastSyncAttempt)) / 1000)}s remaining), skipping`,
      );
      return;
    }

    if (!isAuthenticated || !user || isSyncing) return;

    setLastSyncAttempt(now);
    setIsSyncing(true);
    setHasAttemptedSync(true); // Mark that we've attempted sync

    try {
      const token = await getAccessToken();
      if (token) {
        const profile = await syncUserWithBackend(token);
        if (profile) {
          setUserProfile(profile);
        } else {
          console.warn("User sync failed - continuing without profile data");
          // Don't block the user if sync fails
        }
        const claims = JSON.parse(atob(token.split(".")[1]));
        setCustomClaims({
          "https://pagepersona.com/is_new_user":
            claims["https://pagepersona.com/is_new_user"],
          "https://pagepersona.com/first_login":
            claims["https://pagepersona.com/first_login"],
          "https://pagepersona.com/profile_created_at":
            claims["https://pagepersona.com/profile_created_at"],
          "https://pagepersona.com/profile_sync_error":
            claims["https://pagepersona.com/profile_sync_error"],
        });
      }
    } catch (error) {
      // Sync error - continue without sync, but log it
      console.error("User sync error:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [
    isAuthenticated,
    user,
    isSyncing,
    getAccessToken,
    lastSyncAttempt,
    hasAttemptedSync,
    MIN_SYNC_INTERVAL,
  ]);

  // Only sync once when user becomes authenticated and we haven't attempted sync yet
  // CRITICAL: Wait for isLoading to complete to prevent rapid token requests during init
  useEffect(() => {
    if (
      isAuthenticated &&
      user &&
      !isLoading &&
      !hasAttemptedSync &&
      !isSyncing
    ) {
      syncUser(); // Run syncUser only once to prevent infinite sync-retry loop
      setTokenGetter(getAccessToken);
    }
  }, [
    isAuthenticated,
    user,
    isLoading,
    hasAttemptedSync,
    isSyncing,
    syncUser,
    getAccessToken,
  ]);

  // Track Auth0 errors for debugging and user feedback
  useEffect(() => {
    if (error) {
      setAuth0Error(error);
      console.error("Auth0 Error:", {
        message: error.message,
        name: error.name,
        error: error,
      });
    }
  }, [error]);

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
        isNewUser:
          customClaims?.["https://pagepersona.com/is_new_user"] ?? null,
        isFirstLogin:
          customClaims?.["https://pagepersona.com/first_login"] ?? null,
        profileSyncError:
          customClaims?.["https://pagepersona.com/profile_sync_error"] ?? null,
        getCustomClaims,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
