/**
 * Membership Status Component
 *
 * This component displays the user's current membership tier, benefits,
 * and usage statistics in a visually appealing card format. It provides
 * a clear overview of the user's account status and remaining usage.
 *
 * @module MembershipStatus
 */

import React from 'react';
import type { UserProfile } from '../../lib/apiClient';
import type { MembershipTier } from './types';
import {
  getMembershipInfo,
  calculateUsageStats,
  getUsageMeterStyle,
} from './utils/membershipUtils';

/**
 * Props for the MembershipStatus component
 */
interface MembershipStatusProps {
  /** User profile data containing membership and usage information */
  profile: UserProfile | null;
}

/**
 * MembershipStatus component that displays membership tier and usage information
 *
 * Renders a comprehensive membership card showing the user's current tier,
 * benefits, usage statistics, and visual usage meter. Handles loading states
 * and provides fallback values for missing data.
 *
 * @param props - Component props containing user profile data
 * @returns JSX element displaying membership status information
 */
export const MembershipStatus: React.FC<MembershipStatusProps> = ({ profile }) => {
  // Extract membership tier with fallback
  const membershipTier = (profile?.membership || 'free') as MembershipTier;

  // Get membership display information
  const membershipInfo = getMembershipInfo(membershipTier);

  // Calculate usage statistics
  const usageStats = calculateUsageStats(profile?.usage?.monthlyUsage || 0, membershipTier);

  // Get usage meter styling
  const usageMeterStyle = getUsageMeterStyle(usageStats.percentage);

  return (
    <div className="membership-status-section">
      <div className="membership-status-card">
        <div className="membership-info">
          <div className="membership-tier">
            <span className="membership-icon">{membershipInfo.icon}</span>
            <span className="membership-name">{membershipInfo.label} Member</span>
          </div>
          <div className="membership-benefits">{membershipInfo.benefits}</div>
        </div>

        <div className="usage-meter">
          <div className="usage-meter-bar">
            <div
              className={`usage-meter-fill ${usageStats.isOverLimit ? 'over-limit' : ''} ${usageStats.isNearLimit ? 'near-limit' : ''}`}
              style={usageMeterStyle}
            />
          </div>
          <div className="usage-meter-text">
            <span
              className={
                usageStats.isOverLimit ? 'text-error' : usageStats.isNearLimit ? 'text-warning' : ''
              }
            >
              {usageStats.currentUsage} / {usageStats.monthlyLimit} transformations used
            </span>
            {usageStats.isOverLimit && (
              <span className="usage-limit-warning">⚠️ Usage limit exceeded</span>
            )}
            {usageStats.isNearLimit && !usageStats.isOverLimit && (
              <span className="usage-limit-warning">⚠️ Approaching usage limit</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembershipStatus;
