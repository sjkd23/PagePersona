import { useContext } from 'react';
import { AuthContext } from './useAuth0';
import type { AuthContextType } from './useAuth0';

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an Auth0Provider');
  }
  return context;
}

export { AuthContext };
