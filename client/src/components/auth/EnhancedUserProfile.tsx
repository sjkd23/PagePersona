/**
 * Enhanced User Profile Component
 * 
 * This is the main user profile component that orchestrates the display
 * of user information, membership status, and profile editing capabilities.
 * It uses modular sub-components for better maintainability and organization.
 * 
 * @module EnhancedUserProfile
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuthContext';
import { useNameSync } from '../../hooks/useNameSync';
import ApiService, { setTokenGetter } from '../../lib/apiClient';
import type { UserProfile } from '../../lib/apiClient';
import { hasValidName } from '../../utils/profileUtils';
import ErrorDisplay from '../Transformer/ErrorDisplay';
import { ErrorMapper, type UserFriendlyError } from '../../../../shared/types/errors';

// Import new modular components
import ProfileHeader from './ProfileHeader';
import MembershipStatus from './MembershipStatus';
import ProfileForm from './ProfileForm';
import ProfileStats from './ProfileStats';
import type { ProfileEditForm, UserPreferences } from './types';

// Import styles
import './UserProfile.css';
import './ProfileComponents.css';

/**
 * Main UserProfile component that provides comprehensive user profile management
 * 
 * This component orchestrates the display of user information, handles profile
 * editing, manages loading and error states, and integrates with Auth0 for
 * authentication. It uses modular sub-components for better maintainability.
 * 
 * @returns JSX element containing the complete user profile interface
 */
export default function EnhancedUserProfile() {
  // Hooks
  const { user, logout, getAccessToken } = useAuth();
  const { forceNameSync, extractNamesFromAuth0 } = useNameSync();
  
  // State management
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enhancedError, setEnhancedError] = useState<UserFriendlyError | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<ProfileEditForm>({
    firstName: '',
    lastName: '',
    preferences: {
      theme: 'light',
      language: 'en',
      notifications: true
    }
  });

  // Set up the token getter for API calls
  useEffect(() => {
    setTokenGetter(getAccessToken);
  }, [getAccessToken]);

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        setEnhancedError(null);
        const response = await ApiService.getUserProfile();
        
        if (response.data) {
          setProfile(response.data);
          
          // Set form data
          setEditForm({
            firstName: response.data.firstName || '',
            lastName: response.data.lastName || '',
            preferences: {
              theme: response.data.preferences.theme,
              language: response.data.preferences.language,
              notifications: response.data.preferences.notifications
            }
          });

          // Auto-sync names if they're missing or empty
          if (!hasValidName(response.data.firstName, response.data.lastName)) {
            const syncResult = await forceNameSync();
            
            if (syncResult.success) {
              // Refetch profile after successful sync
              const updatedResponse = await ApiService.getUserProfile();
              if (updatedResponse.data) {
                setProfile(updatedResponse.data);
                setEditForm({
                  firstName: updatedResponse.data.firstName || '',
                  lastName: updatedResponse.data.lastName || '',
                  preferences: {
                    theme: updatedResponse.data.preferences.theme,
                    language: updatedResponse.data.preferences.language,
                    notifications: updatedResponse.data.preferences.notifications
                  }
                });
              }
            } else {
              // Fallback: try manual update with Auth0 data
              const { firstName, lastName } = extractNamesFromAuth0();
              if (firstName || lastName) {
                const updateResult = await ApiService.updateUserProfile({
                  firstName: firstName || '',
                  lastName: lastName || '',
                  preferences: response.data.preferences
                });
                
                if (updateResult.data) {
                  setProfile(updateResult.data);
                  setEditForm({
                    firstName: updateResult.data.firstName || '',
                    lastName: updateResult.data.lastName || '',
                    preferences: {
                      theme: updateResult.data.preferences.theme,
                      language: updateResult.data.preferences.language,
                      notifications: updateResult.data.preferences.notifications
                    }
                  });
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        const mappedError = ErrorMapper.mapError(err);
        setEnhancedError(mappedError);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, forceNameSync, extractNamesFromAuth0]);

  /**
   * Handle saving profile changes
   */
  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      setEnhancedError(null);
      const response = await ApiService.updateUserProfile({
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        preferences: editForm.preferences
      });
      
      if (response.data) {
        setProfile(response.data);
        setEditing(false);
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      const mappedError = ErrorMapper.mapError(err);
      setEnhancedError(mappedError);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle form field changes
   */
  const handleFormChange = (field: keyof ProfileEditForm, value: string | UserPreferences) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Early returns for loading and error states
  if (!user) return null;

  if (loading && !profile) {
    return (
      <div className="profile-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (enhancedError || error) {
    return (
      <div className="profile-container">
        {enhancedError ? (
          <ErrorDisplay
            error={enhancedError.message}
            errorCode={enhancedError.code}
            title={enhancedError.title}
            helpText={enhancedError.helpText}
            actionText={enhancedError.actionText}
            onDismiss={() => {
              setEnhancedError(null);
              setError(null);
            }}
            onAction={() => window.location.reload()}
            className="profile-error"
          />
        ) : (
          <div className="error-container">
            <p className="error-text">{error}</p>
            <button 
              onClick={() => {
                setError(null);
                window.location.reload();
              }} 
              className="error-button"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        {/* Profile Header with user info and actions */}
        <ProfileHeader
          user={user}
          profile={profile}
          editing={editing}
          onEdit={() => setEditing(true)}
          onSave={handleSaveProfile}
          onCancel={() => setEditing(false)}
          isLoading={loading}
        />

        {/* Membership Status and Usage */}
        <MembershipStatus profile={profile} />

        {/* Main Content Grid */}
        <div className="profile-content">
          <div className="content-grid">
            {/* Profile Form - Left Column */}
            <ProfileForm
              profile={profile}
              editForm={editForm}
              editing={editing}
              onFormChange={handleFormChange}
              isLoading={loading}
            />

            {/* Profile Stats - Right Column */}
            <ProfileStats
              profile={profile}
              onLogout={logout}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
