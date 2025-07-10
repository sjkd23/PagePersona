import { useCallback } from 'react';
import { useAuth } from './useAuth';

export function useLogout() {
  const { logout } = useAuth();

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  return { logout: handleLogout };
}
