/**
 * Authentication Hook
 * 
 * Simplified authentication hook providing access to Auth0 context
 * with error boundary protection. Separated from main Auth0 provider
 * for better fast refresh compatibility during development.
 * 
 * Features:
 * - Context validation and error handling
 * - Type-safe authentication state access
 * - Development-optimized fast refresh support
 */

// useAuth hook - separated for fast refresh compatibility
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

/**
 * Authentication hook with context validation
 * 
 * Provides type-safe access to Auth0 authentication context with
 * automatic error handling for missing provider configuration.
 * 
 * @returns Auth0 context containing authentication state and methods
 * @throws Error if used outside of Auth0Provider context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an Auth0Provider');
  return context;
}
