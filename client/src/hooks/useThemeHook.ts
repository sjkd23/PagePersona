/**
 * Theme Hook
 *
 * Contains the useTheme hook to solve the React Fast Refresh issue
 * where hooks and components shouldn't be in the same file.
 */

import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import type { ThemeContextType } from '../contexts/ThemeContext';

/**
 * Theme context hook with validation
 *
 * Provides type-safe access to theme context with automatic error
 * handling for missing provider configuration.
 *
 * @returns Theme context containing state and toggle function
 * @throws Error if used outside of ThemeProvider context
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
