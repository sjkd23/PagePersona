/**
 * Utility functions for membership and usage calculations
 * 
 * This module provides helper functions for managing user membership
 * tiers, usage limits, and related calculations throughout the
 * authentication system.
 * 
 * @module MembershipUtils
 */

import type { MembershipTier, MembershipInfo, UsageLimits } from '../types';

/**
 * Get usage limits based on membership tier
 * 
 * @param membership - The user's membership tier
 * @returns The monthly transformation limit for the tier
 */
export const getUsageLimit = (membership: MembershipTier): number => {
  const limits: Record<MembershipTier, number> = {
    free: 50,
    premium: 500,
    admin: 10000
  };
  
  return limits[membership] || limits.free;
};

/**
 * Get membership display information
 * 
 * @param membership - The user's membership tier
 * @returns Display information for the membership tier
 */
export const getMembershipInfo = (membership: MembershipTier): MembershipInfo => {
  const membershipData: Record<MembershipTier, MembershipInfo> = {
    free: {
      icon: '🆓',
      label: 'Free',
      class: 'free',
      benefits: 'Basic personas • Community support'
    },
    premium: {
      icon: '⭐',
      label: 'Premium',
      class: 'premium',
      benefits: 'All personas • Priority support • Custom personas'
    },
    admin: {
      icon: '👑',
      label: 'Admin',
      class: 'admin',
      benefits: 'Custom integrations • Dedicated support • White-label options'
    }
  };
  
  return membershipData[membership] || membershipData.free;
};

/**
 * Calculate usage statistics
 * 
 * @param currentUsage - Current monthly usage count
 * @param membership - User's membership tier
 * @returns Usage statistics including percentage and limits
 */
export const calculateUsageStats = (
  currentUsage: number, 
  membership: MembershipTier
): UsageLimits & { percentage: number; isNearLimit: boolean; isOverLimit: boolean } => {
  const monthlyLimit = getUsageLimit(membership);
  const percentage = Math.min(100, (currentUsage / monthlyLimit) * 100);
  const isNearLimit = percentage >= 80;
  const isOverLimit = currentUsage >= monthlyLimit;
  
  return {
    monthlyLimit,
    currentUsage,
    percentage,
    isNearLimit,
    isOverLimit
  };
};

/**
 * Get CSS variables for usage meter styling
 * 
 * @param percentage - Usage percentage (0-100)
 * @returns CSS custom properties object
 */
export const getUsageMeterStyle = (percentage: number): React.CSSProperties => {
  return {
    '--usage-width': `${Math.min(100, percentage)}%`
  } as React.CSSProperties;
};

/**
 * Format membership tier for display
 * 
 * @param membership - The membership tier
 * @returns Formatted display string
 */
export const formatMembershipTier = (membership: MembershipTier): string => {
  const info = getMembershipInfo(membership);
  return `${info.icon} ${info.label} Member`;
};

/**
 * Check if user has premium features access
 * 
 * @param membership - The user's membership tier
 * @returns True if user has premium or admin access
 */
export const hasPremiumAccess = (membership: MembershipTier): boolean => {
  return membership === 'premium' || membership === 'admin';
};

/**
 * Check if user has admin access
 * 
 * @param membership - The user's membership tier
 * @returns True if user has admin access
 */
export const hasAdminAccess = (membership: MembershipTier): boolean => {
  return membership === 'admin';
};
