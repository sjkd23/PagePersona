/**
 * TypeScript interfaces and types for authentication components
 *
 * This module defines the type definitions used across authentication
 * components to ensure type safety and consistency.
 *
 * @module AuthTypes
 */

/**
 * Membership tier levels available in the application
 */
export type MembershipTier = "free" | "premium" | "admin";

/**
 * Theme options for user preferences
 */
export type ThemeOption = "light" | "dark";

/**
 * Language options for user preferences
 */
export type LanguageOption = "en" | "fr" | "es" | string;

/**
 * User preferences interface
 */
export interface UserPreferences {
  /** UI theme preference */
  theme: ThemeOption;
  /** Language preference */
  language: LanguageOption;
  /** Email notifications enabled */
  notifications: boolean;
}

/**
 * Edit form state interface for profile editing
 */
export interface ProfileEditForm {
  /** User's first name */
  firstName: string;
  /** User's last name */
  lastName: string;
  /** User preferences */
  preferences: UserPreferences;
}

/**
 * Membership tier display information
 */
export interface MembershipInfo {
  /** Display icon for the tier */
  icon: string;
  /** Display label for the tier */
  label: string;
  /** CSS class for styling */
  class: string;
  /** Description of tier benefits */
  benefits: string;
}

/**
 * Usage limits for different membership tiers
 */
export interface UsageLimits {
  /** Monthly transformation limit */
  monthlyLimit: number;
  /** Current usage count */
  currentUsage: number;
}

/**
 * Props for components that need navigation
 */
export interface NavigationProps {
  /** Handler for back navigation */
  onBack: () => void;
}

/**
 * Props for components that display loading states
 */
export interface LoadingProps {
  /** Whether the component is in loading state */
  isLoading?: boolean;
  /** Loading message to display */
  loadingMessage?: string;
}

/**
 * Props for error display components
 */
export interface ErrorProps {
  /** Error message to display */
  error?: string | null;
  /** Error code for debugging */
  errorCode?: string;
  /** User-friendly error title */
  title?: string;
  /** Help text for users */
  helpText?: string;
  /** Action button text */
  actionText?: string;
  /** Error dismissal handler */
  onDismiss?: () => void;
  /** Error action handler */
  onAction?: () => void;
  /** Additional CSS classes */
  className?: string;
}
