// useAuth hook - separated for fast refresh compatibility
import { useContext } from 'react';
import { AuthContext } from './useAuth0';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an Auth0Provider');
  return context;
}
