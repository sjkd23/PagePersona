import React from 'react';
import { useProfileTheme } from '../../hooks/useProfileTheme';

interface ThemeToggleProps {
  isOnProfilePage?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ isOnProfilePage = false }) => {
  const { currentTheme, updateTheme, toggleThemeOnly } = useProfileTheme();
  const isDarkMode = currentTheme === 'dark';

  const handleToggle = async () => {
    const newTheme = isDarkMode ? 'light' : 'dark';

    if (isOnProfilePage) {
      // On profile page: just toggle the UI theme, don't persist immediately
      // This allows the user to see the change and decide to save via profile form
      toggleThemeOnly();

      // Dispatch a custom event to notify the profile page about theme change
      window.dispatchEvent(
        new window.CustomEvent('headerThemeToggle', {
          detail: { theme: newTheme },
        }),
      );
    } else {
      // Not on profile page: update theme and persist immediately
      await updateTheme(newTheme);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className="theme-toggle-btn"
      aria-label="Toggle theme"
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDarkMode ? (
        // Sun icon for light mode
        <svg className="theme-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        // Moon icon for dark mode
        <svg className="theme-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
};

export default ThemeToggle;
