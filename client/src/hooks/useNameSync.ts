import { useState, useCallback } from 'react';
import { useAuth } from './useAuth0';

interface NameSyncResult {
  success: boolean;
  message?: string;
  firstName?: string;
  lastName?: string;
  error?: string;
}

export const useNameSync = () => {
  const { getAccessToken, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const forceNameSync = useCallback(async (): Promise<NameSyncResult> => {
    setIsLoading(true);
    
    try {
      const token = await getAccessToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch('/api/user/debug/force-name-sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to sync names');
      }

      return {
        success: true,
        message: result.message,
        firstName: result.data?.firstName,
        lastName: result.data?.lastName
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
  }, [getAccessToken]);

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
