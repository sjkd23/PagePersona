/**
 * Profile Header Component
 *
 * This component displays the user's profile header information including
 * avatar, name, email, and action buttons. It handles both viewing and
 * editing modes with appropriate UI state management.
 *
 * @module ProfileHeader
 */

import React from 'react';
import type { User } from '@auth0/auth0-react';
import type { UserProfile } from '../../lib/apiClient';
import type { LoadingProps } from './types';
import { hasValidName, formatFullName } from '../../utils/profileUtils';

/**
 * Props for the ProfileHeader component
 */
interface ProfileHeaderProps extends LoadingProps {
  /** Auth0 user object */
  user: User;
  /** User profile data from the database */
  profile: UserProfile | null;
  /** Whether the profile is in editing mode */
  editing: boolean;
  /** Handler to enter edit mode */
  onEdit: () => void;
  /** Handler to save profile changes */
  onSave: () => void;
  /** Handler to cancel editing */
  onCancel: () => void;
}

/**
 * ProfileHeader component that displays user profile header information
 *
 * Renders the user's avatar, name, email, member since date, and action
 * buttons. Provides different UI states for viewing and editing modes
 * with loading state support.
 *
 * @param props - Component props containing user data and handlers
 * @returns JSX element displaying the profile header
 */
export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  profile,
  editing,
  onEdit,
  onSave,
  onCancel,
  isLoading = false,
}) => {
  /**
   * Get the display name for the user
   * Prioritizes database profile names over Auth0 names
   */
  const getDisplayName = (): string => {
    if (hasValidName(profile?.firstName, profile?.lastName)) {
      return formatFullName(profile?.firstName, profile?.lastName);
    }
    return user.name || user.nickname || 'User';
  };

  /**
   * Get the user's initials for avatar placeholder
   */
  const getUserInitials = (): string => {
    const displayName = getDisplayName();
    const nameParts = displayName.split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return displayName[0]?.toUpperCase() || 'U';
  };

  /**
   * Format the member since date
   */
  const getMemberSinceDate = (): string => {
    if (profile?.createdAt) {
      return new Date(profile.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    return 'Unknown';
  };

  return (
    <div className="profile-header">
      <div className="profile-header-content">
        <div className="profile-info">
          {/* Avatar */}
          {user.picture ? (
            <img
              src={user.picture}
              alt={getDisplayName()}
              className="profile-avatar"
              loading="lazy"
            />
          ) : (
            <div className="profile-avatar-placeholder">{getUserInitials()}</div>
          )}

          {/* User Details */}
          <div className="profile-details">
            <h1 title={getDisplayName()}>{getDisplayName()}</h1>
            <p className="email" title={profile?.email || user.email}>
              {profile?.email || user.email}
            </p>
            <p className="member-since">Member since {getMemberSinceDate()}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="profile-actions">
          {!editing ? (
            <button
              onClick={onEdit}
              className="btn btn-secondary"
              disabled={isLoading}
              aria-label="Edit profile information"
            >
              <span>✏️</span>
              Edit Profile
            </button>
          ) : (
            <>
              <button
                onClick={onSave}
                disabled={isLoading}
                className="btn btn-success"
                aria-label="Save profile changes"
              >
                {isLoading ? (
                  <>
                    <span className="loading-spinner-small" />
                    Saving...
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    Save Changes
                  </>
                )}
              </button>
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="btn btn-secondary"
                aria-label="Cancel profile editing"
              >
                <span>❌</span>
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
