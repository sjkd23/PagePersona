/**
 * Authentication Components Index
 * 
 * This module provides centralized exports for all authentication-related
 * components, making imports cleaner and more maintainable throughout
 * the application.
 * 
 * @module AuthComponents
 */

// Main profile components
export { default as UserProfile } from './UserProfile';
export { default as EnhancedUserProfile } from './EnhancedUserProfile';

// Modular profile components
export { default as ProfileHeader } from './ProfileHeader';
export { default as MembershipStatus } from './MembershipStatus';
export { default as ProfileForm } from './ProfileForm';
export { default as ProfileStats } from './ProfileStats';

// Authentication components
export { default as Auth0Login } from './Auth0Login';
export { default as Auth0DebugInfo } from './Auth0DebugInfo';

// Types and utilities
export type * from './types';
export * from './utils/membershipUtils';

/**
 * Component usage guide:
 * 
 * 1. EnhancedUserProfile - Use this for the main profile page (recommended)
 * 2. UserProfile - Legacy component, kept for compatibility
 * 3. Auth0Login - Use for authentication flows
 * 4. Auth0DebugInfo - Development debugging only
 * 
 * Individual components (ProfileHeader, MembershipStatus, etc.) can be
 * imported separately if you need to build custom profile layouts.
 */
