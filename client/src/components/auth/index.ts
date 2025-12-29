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
export { default as UserProfile } from "./UserProfile";

// Modular profile components
export { default as ProfileHeader } from "./ProfileHeader";
export { default as MembershipStatus } from "./MembershipStatus";
export { default as ProfileForm } from "./ProfileForm";
export { default as ProfileStats } from "./ProfileStats";

// Types and utilities
export type * from "./types";
export * from "./utils/membershipUtils";

/**
 * Component usage guide:
 *
 * 1. UserProfile - Main profile component for user management
 *
 * Individual components (ProfileHeader, MembershipStatus, etc.) can be
 * imported separately if you need to build custom profile layouts.
 */
