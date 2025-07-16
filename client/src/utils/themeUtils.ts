/**
 * Theme utility functions and constants for consistent styling
 *
 * This module provides a comprehensive theming system that supports both
 * light and dark modes, with predefined color schemes for various UI
 * components and persona-specific styling.
 *
 * @module themeUtils
 */

/**
 * Predefined theme classes for consistent styling across components
 *
 * These classes provide light/dark mode variants for common UI elements
 * including backgrounds, text colors, borders, and interactive elements.
 */
export const themeClasses = {
  // Backgrounds
  backgroundPrimary: 'bg-white dark:bg-gray-900',
  backgroundSecondary: 'bg-gray-50 dark:bg-gray-800',
  backgroundCard: 'bg-white dark:bg-gray-800',
  backgroundMuted: 'bg-gray-100 dark:bg-gray-700',

  // Text colors
  textPrimary: 'text-gray-900 dark:text-gray-100',
  textSecondary: 'text-gray-600 dark:text-gray-300',
  textMuted: 'text-gray-500 dark:text-gray-400',
  textAccent: 'text-blue-600 dark:text-blue-400',

  // Borders
  border: 'border-gray-200 dark:border-gray-700',
  borderLight: 'border-gray-100 dark:border-gray-800',

  // Interactive elements
  buttonPrimary: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white',
  buttonSecondary:
    'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100',

  // Input fields
  input:
    'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400',

  // Shadows
  shadow: 'shadow-lg dark:shadow-gray-900/25',
  shadowCard: 'shadow-md dark:shadow-gray-900/50',
};

/**
 * Pre-configured component class combinations
 *
 * Common UI component styling patterns that combine multiple theme classes
 * for consistent appearance across the application.
 */
const componentClasses = {
  card: `${themeClasses.backgroundCard} ${themeClasses.textPrimary} ${themeClasses.border} ${themeClasses.shadowCard}`,
  modal: `${themeClasses.backgroundPrimary} ${themeClasses.textPrimary} ${themeClasses.border}`,
  button: themeClasses.buttonPrimary,
  input: `${themeClasses.input} focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400`,
  dropdown: `${themeClasses.backgroundCard} ${themeClasses.textPrimary} ${themeClasses.border} ${themeClasses.shadow}`,
};

/**
 * Retrieves appropriate CSS classes for a specific component type
 *
 * @param {keyof typeof componentClasses} component - The component type
 * @returns {string} The combined CSS classes for the component
 */
export const getComponentClasses = (component: keyof typeof componentClasses) => {
  return componentClasses[component];
};

/**
 * Persona-specific color schemes compatible with both light and dark modes
 *
 * Each persona has its own color scheme with variants for different contexts
 * including background, accent colors, and hover states.
 */
export const personaColors = {
  eli5: {
    light: 'bg-red-500 text-white',
    dark: 'bg-red-600 text-white',
    accent: 'text-red-600 dark:text-red-400',
  },
  anime: {
    light: 'bg-pink-500 text-white',
    dark: 'bg-pink-600 text-white',
    accent: 'text-pink-600 dark:text-pink-400',
  },
  knight: {
    light: 'bg-amber-700 text-white',
    dark: 'bg-amber-800 text-white',
    accent: 'text-amber-700 dark:text-amber-500',
  },
  hacker: {
    light: 'bg-green-500 text-white',
    dark: 'bg-green-600 text-white',
    accent: 'text-green-600 dark:text-green-400',
  },
  pirate: {
    light: 'bg-amber-600 text-white',
    dark: 'bg-amber-700 text-white',
    accent: 'text-amber-600 dark:text-amber-400',
  },
  scientist: {
    light: 'bg-purple-600 text-white',
    dark: 'bg-purple-700 text-white',
    accent: 'text-purple-600 dark:text-purple-400',
  },
  comedian: {
    light: 'bg-orange-500 text-white',
    dark: 'bg-orange-600 text-white',
    accent: 'text-orange-600 dark:text-orange-400',
  },
  zen: {
    light: 'bg-green-600 text-white',
    dark: 'bg-green-700 text-white',
    accent: 'text-green-600 dark:text-green-400',
  },
};
