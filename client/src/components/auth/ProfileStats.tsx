/**
 * Profile Stats Component
 *
 * This component displays user statistics and account information in
 * an organized sidebar format. It provides quick access to important
 * account metrics and status information.
 *
 * @module ProfileStats
 */

import React from 'react';
import type { UserProfile } from '../../lib/apiClient';
import type { MembershipTier } from './types';
import { calculateUsageStats, hasPremiumAccess } from './utils/membershipUtils';

/**
 * Props for the ProfileStats component
 */
interface ProfileStatsProps {
  /** User profile data containing stats and information */
  profile: UserProfile | null;
  /** Handler for logout action */
  onLogout: () => void;
}

/**
 * ProfileStats component that displays user statistics and account actions
 *
 * Renders user statistics, account information, and action buttons in a
 * sidebar layout. Provides quick access to usage stats, account actions,
 * and upgrade prompts for free users.
 *
 * @param props - Component props containing profile data and handlers
 * @returns JSX element displaying profile statistics and actions
 */
export const ProfileStats: React.FC<ProfileStatsProps> = ({ profile, onLogout }) => {
  // Get membership tier and stats
  const membershipTier = (profile?.membership || 'free') as MembershipTier;
  const usageStats = calculateUsageStats(profile?.usage?.monthlyUsage || 0, membershipTier);
  const hasUpgradeAccess = !hasPremiumAccess(membershipTier);

  /**
   * Format date for display
   */
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  /**
   * Get activity status based on recent usage
   */
  const getActivityStatus = (): { status: string; className: string } => {
    const lastActive = profile?.lastLoginAt;
    if (!lastActive) return { status: 'Unknown', className: 'status-info' };

    const daysSinceActive = Math.floor(
      (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSinceActive === 0) return { status: 'Active today', className: 'status-verified' };
    if (daysSinceActive <= 7)
      return { status: `${daysSinceActive} days ago`, className: 'status-verified' };
    if (daysSinceActive <= 30)
      return { status: `${daysSinceActive} days ago`, className: 'status-warning' };
    return { status: 'Inactive', className: 'status-disabled' };
  };

  const activityStatus = getActivityStatus();

  return (
    <div>
      <h2 className="section-title">Account Overview</h2>

      {/* Usage Statistics */}
      <div className="stats-container">
        <div className="stat-card remaining-transformations">
          <div className="stat-number">{usageStats.monthlyLimit - usageStats.currentUsage}</div>
          <div className="stat-label">
            Remaining Transformations
            <div className="stat-sublabel">Resets monthly</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-number">{profile?.usage?.totalTransformations || 0}</div>
          <div className="stat-label">Total Transformations</div>
        </div>

        <div className="stat-card">
          <div className="stat-number">{Math.round(usageStats.percentage)}%</div>
          <div className="stat-label">Monthly Usage</div>
        </div>
      </div>

      {/* Account Information */}
      <div className="stats-container">
        <div className="info-card">
          <div className="label">Account Created</div>
          <div className="value">{formatDate(profile?.createdAt)}</div>
        </div>

        <div className="info-card">
          <div className="label">Last Active</div>
          <div className="value">
            <span className={`status-badge ${activityStatus.className}`}>
              {activityStatus.status}
            </span>
          </div>
        </div>

        <div className="info-card">
          <div className="label">User ID</div>
          <div className="value" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
            {profile?.id ? profile.id.slice(-8) : 'N/A'}
          </div>
        </div>
      </div>

      {/* Upgrade Prompt for Free Users */}
      {hasUpgradeAccess && (
        <div
          className="info-card"
          style={{ backgroundColor: '#f0f9ff', border: '2px solid #3b82f6' }}
        >
          <div className="label" style={{ color: '#1e40af', fontWeight: 'bold' }}>
            🚀 Upgrade Available
          </div>
          <div className="value" style={{ color: '#1e40af' }}>
            Get unlimited transformations and premium features
          </div>
          <button
            className="btn btn-info btn-small"
            style={{ marginTop: '0.75rem', width: '100%' }}
            onClick={() => {
              // Upgrade flow not implemented yet
            }}
          >
            Upgrade to Premium
          </button>
        </div>
      )}

      {/* Account Actions */}
      <div className="stats-container">
        <h3 className="section-subtitle">Account Actions</h3>

        <div className="info-card">
          <button
            onClick={() => {
              // Profile export not implemented yet
            }}
            className="btn btn-secondary btn-small"
            style={{ width: '100%', marginBottom: '0.75rem' }}
          >
            📄 Export Profile Data
          </button>

          <button
            onClick={() => {
              // Account settings not implemented yet
            }}
            className="btn btn-secondary btn-small"
            style={{ width: '100%', marginBottom: '0.75rem' }}
          >
            ⚙️ Account Settings
          </button>

          <button onClick={onLogout} className="btn btn-danger btn-small" style={{ width: '100%' }}>
            🚪 Sign Out
          </button>
        </div>

        {/* Help and Support */}
        <div className="info-card">
          <div className="label">Need Help?</div>
          <div className="value">
            <a
              href="mailto:support@pagepersona.ai"
              className="text-blue-600 hover:text-blue-800 text-sm"
              style={{ textDecoration: 'none' }}
            >
              📧 Contact Support
            </a>
          </div>
          <div className="value" style={{ marginTop: '0.5rem' }}>
            <a
              href="/docs"
              className="text-blue-600 hover:text-blue-800 text-sm"
              style={{ textDecoration: 'none' }}
            >
              📚 Documentation
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileStats;
