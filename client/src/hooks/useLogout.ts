/**
 * Custom hook for handling user logout operations
 * 
 * This hook provides a simplified interface for logout functionality,
 * wrapping the authentication context's logout method with proper
 * callback memoization for performance optimization.
 * 
 * @module useLogout
 */

import { useCallback } from 'react';
import { useAuth } from './useAuth';

/**
 * Hook for managing user logout operations
 * 
 * Provides a memoized logout handler that integrates with the authentication
 * system to properly clear user session and redirect as needed.
 * 
 * @returns {object} Logout interface
 * @returns {function} returns.logout - Function to trigger user logout
 */
export function useLogout() {
  const { logout } = useAuth();

  /**
   * Handles user logout with proper cleanup
   * 
   * Triggers the authentication system's logout process, which typically
   * includes clearing tokens, session data, and redirecting to login.
   */
  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  return { logout: handleLogout };
}
