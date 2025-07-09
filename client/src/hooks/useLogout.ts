import { useAuth } from './useAuth';

export function useLogout() {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return { logout: handleLogout };
}
