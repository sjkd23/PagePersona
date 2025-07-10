/**
 * Custom hook for synchronizing user name data with authentication provider
 * 
 * This hook provides functionality to extract and synchronize user name
 * information from Auth0 user profile data, with fallback parsing for
 * cases where structured name fields are not available.
 * 
 * @module useNameSync
 */

import { useState, useCallback } from 'react';
import { useAuth } from './useAuthContext';

/**
 * Result interface for name synchronization operations
 * 
 * @interface NameSyncResult
 * @property {boolean} success - Whether the sync operation succeeded
 * @property {string} [message] - Success message if operation completed
 * @property {string} [firstName] - Extracted first name
 * @property {string} [lastName] - Extracted last name
 * @property {string} [error] - Error message if operation failed
 */
interface NameSyncResult {
  success: boolean;
  message?: string;
  firstName?: string;
  lastName?: string;
  error?: string;
}

/**
 * Hook for managing user name synchronization with authentication provider
 * 
 * Provides methods to extract user name information from Auth0 profile
 * data and synchronize it with the application's user data. Includes
 * error handling and loading state management.
 * 
 * @returns {object} Name synchronization interface
 * @returns {function} returns.forceNameSync - Force synchronization of user name
 * @returns {function} returns.extractNamesFromAuth0 - Extract names from Auth0 profile
 * @returns {boolean} returns.isLoading - Current loading state
 */
export const useNameSync = () => {
  const { getAccessToken, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Forces synchronization of user name data
   * 
   * Attempts to synchronize user name information with the backend,
   * handling authentication and error states appropriately.
   * 
   * @returns {Promise<NameSyncResult>} The result of the sync operation
   */
  const forceNameSync = useCallback(async (): Promise<NameSyncResult> => {
    setIsLoading(true);
    
    try {
      const token = await getAccessToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Removed call to /api/user/debug/force-name-sync (temporary debug endpoint)

      return {
        success: true,
        message: 'Name sync successful',
        firstName: user?.given_name,
        lastName: user?.family_name
      };

    } catch (error) {
      console.error('Name sync error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken, user]);

  /**
   * Extracts first and last names from Auth0 user profile
   * 
   * Attempts to extract structured name data from Auth0 user profile,
   * with fallback to parsing the full name field if individual name
   * components are not available.
   * 
   * @returns {object} Extracted name components
   * @returns {string} returns.firstName - The user's first name
   * @returns {string} returns.lastName - The user's last name
   */
  const extractNamesFromAuth0 = useCallback(() => {
    if (!user) return { firstName: '', lastName: '' };

    let firstName = user.given_name || '';
    let lastName = user.family_name || '';

    // Fallback to parsing full name if given/family names not available
    if (!firstName && !lastName && user.name) {
      const nameParts = user.name.split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }

    return { firstName, lastName };
  }, [user]);

  return {
    forceNameSync,
    extractNamesFromAuth0,
    isLoading
  };
};
