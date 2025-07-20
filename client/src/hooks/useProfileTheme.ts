/**
 * Profile Theme Hook
 *
 * Provides integration between the user profile theme preferences
 * and the global theme context. Handles syncing theme changes
 * to the database and ensures consistent theme state across
 * the application.
 */

import { useTheme } from './useThemeHook';
import { useCallback, useRef, useEffect } from 'react';
import ApiService from '../lib/apiClient';
import type { ThemeOption } from '../components/auth/types';
import type { UserProfile } from '../lib/apiClient';

/**
 * Profile theme hook interface
 */
export interface UseProfileThemeReturn {
  /** Current theme from global context */
  currentTheme: ThemeOption;
  /** Update theme in both global context and user profile */
  updateTheme: (theme: ThemeOption) => Promise<void>;
  /** Sync global theme with user profile theme */
  syncThemeFromProfile: (profileTheme: ThemeOption) => void;
}

/**
 * Custom hook that bridges profile theme preferences with global theme context
 *
 * This hook ensures that theme changes made in the user profile are reflected
 * throughout the application and persisted to the database. It also handles
 * initial synchronization when the profile is loaded.
 *
 * @returns Object containing current theme state and update functions
 */
export const useProfileTheme = (): UseProfileThemeReturn => {
  const { isDarkMode, toggleTheme } = useTheme();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingRef = useRef(false);

  // Convert boolean to theme option
  const currentTheme: ThemeOption = isDarkMode ? 'dark' : 'light';

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Update theme in both global context and user profile
   *
   * This function updates the global theme state and also persists
   * the preference to the user's profile in the database.
   * Uses debouncing to prevent rate-limit 429 errors from rapid toggles.
   */
  const updateTheme = useCallback(
    async (theme: ThemeOption): Promise<void> => {
      // Prevent circular updates
      if (isUpdatingRef.current) {
        return;
      }

      isUpdatingRef.current = true;

      try {
        // Only toggle if the theme is actually changing
        const shouldToggle = (theme === 'dark') !== isDarkMode;

        if (shouldToggle) {
          toggleTheme();
        }

        // Clear existing timeout
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }

        // Debounce the API call to prevent rate limiting
        debounceTimeoutRef.current = setTimeout(async () => {
          try {
            await ApiService.updateUserProfile({
              preferences: {
                theme,
              } as Record<string, unknown>,
            } as Partial<UserProfile>);
          } catch (error) {
            console.error('Failed to update theme preference in profile:', error);
            // Note: We don't revert the local theme change as the user might want
            // to retry the save operation later
          } finally {
            isUpdatingRef.current = false;
          }
        }, 2000); // Increased debounce to 2 seconds for better rate limiting
      } catch (error) {
        isUpdatingRef.current = false;
        throw error;
      }
    },
    [isDarkMode, toggleTheme],
  );

  /**
   * Sync global theme with user profile theme
   *
   * This function is used to synchronize the global theme state
   * with the theme preference loaded from the user's profile.
   * It should be called when the profile is first loaded or
   * when making non-persisted theme changes (like live preview).
   */
  const syncThemeFromProfile = useCallback(
    (profileTheme: ThemeOption): void => {
      // Prevent circular updates during sync
      if (isUpdatingRef.current) {
        return;
      }

      const shouldToggle = (profileTheme === 'dark') !== isDarkMode;

      if (shouldToggle) {
        toggleTheme();
      }
    },
    [isDarkMode, toggleTheme],
  );

  return {
    currentTheme,
    updateTheme,
    syncThemeFromProfile,
  };
};
