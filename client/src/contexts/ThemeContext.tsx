/**
 * Theme Context Provider
 * 
 * Manages application-wide theme state including dark/light mode switching,
 * persistence to localStorage, and system preference detection. Provides
 * theme state and toggle functionality throughout the application with
 * automatic system preference monitoring.
 * 
 * Features:
 * - Dark/light theme state management
 * - localStorage persistence for user preferences
 * - System preference detection and monitoring
 * - Automatic CSS class application for theming
 * - Context-based theme access throughout app
 */

import React, { createContext, useEffect, useState } from 'react';

/**
 * Theme context interface defining available theme operations
 */
interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Export the context for use in the hook file
export { ThemeContext };

/**
 * Theme provider component props interface
 */
interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * Theme Provider Component
 * 
 * Provides theme context to the entire application with persistent
 * storage and system preference integration for seamless user experience.
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first for user preference, then system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme !== null) {
      return JSON.parse(savedTheme);
    }
    
    // Fallback to system preference detection
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply theme changes to document and persist to storage
  useEffect(() => {
    // Apply dark mode CSS class to document root for global theming
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Persist theme preference to localStorage
    localStorage.setItem('theme', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Monitor system theme preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't manually set a preference
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === null) {
        setIsDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
