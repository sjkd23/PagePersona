/**
 * Profile Form Component
 * 
 * This component handles the display and editing of user profile information
 * including personal details and preferences. It provides form validation,
 * proper accessibility, and responsive design.
 * 
 * @module ProfileForm
 */

import React from 'react';
import type { UserProfile } from '../../lib/apiClient';
import type { ProfileEditForm, ThemeOption, LanguageOption } from './types';
import { formatProfileField } from '../../utils/profileUtils';

/**
 * Props for the ProfileForm component
 */
interface ProfileFormProps {
  /** User profile data from the database */
  profile: UserProfile | null;
  /** Current form editing state */
  editForm: ProfileEditForm;
  /** Whether the profile is in editing mode */
  editing: boolean;
  /** Handler for form field changes */
  onFormChange: (field: keyof ProfileEditForm, value: string | ProfileEditForm['preferences']) => void;
  /** Whether the form is in loading state */
  isLoading?: boolean;
}

/**
 * ProfileForm component that displays and edits user profile information
 * 
 * Renders personal information fields and user preferences with proper
 * form controls, validation, and accessibility features. Handles both
 * viewing and editing modes with appropriate UI states.
 * 
 * @param props - Component props containing profile data and handlers
 * @returns JSX element displaying the profile form
 */
export const ProfileForm: React.FC<ProfileFormProps> = ({
  profile,
  editForm,
  editing,
  onFormChange,
  isLoading = false
}) => {
  /**
   * Handle preference changes
   */
  const handlePreferenceChange = (key: keyof ProfileEditForm['preferences'], value: boolean | string) => {
    onFormChange('preferences', {
      ...editForm.preferences,
      [key]: value
    });
  };

  /**
   * Get email verification status badge
   */
  const getEmailVerificationBadge = () => {
    const isVerified = profile?.isEmailVerified;
    return (
      <span 
        className={`status-badge ${isVerified ? 'status-verified' : 'status-warning'}`}
        title={isVerified ? 'Email address is verified' : 'Email address not verified'}
      >
        {isVerified ? '✅ Verified' : '⚠️ Not verified'}
      </span>
    );
  };

  return (
    <div>
      <h2 className="section-title">Personal Information</h2>
      
      {/* Personal Information Grid */}
      <div className="form-grid">
        {/* First Name */}
        <div className="form-field">
          <label htmlFor="firstName" className="form-label">
            First Name
          </label>
          {editing ? (
            <input
              id="firstName"
              type="text"
              value={editForm.firstName}
              onChange={(e) => onFormChange('firstName', e.target.value)}
              className="form-input"
              placeholder="Enter first name"
              disabled={isLoading}
              maxLength={50}
              aria-describedby="firstName-help"
            />
          ) : (
            <div className="form-value" id="firstName-value">
              {formatProfileField(profile?.firstName)}
            </div>
          )}
          {editing && (
            <small id="firstName-help" className="form-help">
              Your first name as you'd like it displayed
            </small>
          )}
        </div>

        {/* Last Name */}
        <div className="form-field">
          <label htmlFor="lastName" className="form-label">
            Last Name
          </label>
          {editing ? (
            <input
              id="lastName"
              type="text"
              value={editForm.lastName}
              onChange={(e) => onFormChange('lastName', e.target.value)}
              className="form-input"
              placeholder="Enter last name"
              disabled={isLoading}
              maxLength={50}
              aria-describedby="lastName-help"
            />
          ) : (
            <div className="form-value" id="lastName-value">
              {formatProfileField(profile?.lastName)}
            </div>
          )}
          {editing && (
            <small id="lastName-help" className="form-help">
              Your last name as you'd like it displayed
            </small>
          )}
        </div>

        {/* Email Address (Read-only) */}
        <div className="form-field">
          <label htmlFor="email" className="form-label">
            Email Address
          </label>
          <div className="form-value" id="email-value">
            {profile?.email || 'Not provided'}
          </div>
          <small className="form-help">
            Email cannot be changed here. Contact support if needed.
          </small>
        </div>

        {/* Username (Read-only) */}
        <div className="form-field">
          <label htmlFor="username" className="form-label">
            Username
          </label>
          <div className="form-value" id="username-value">
            {profile?.username || 'Not set'}
          </div>
        </div>

        {/* Account Status */}
        <div className="form-field">
          <label className="form-label">
            Account Status
          </label>
          <div className="form-value">
            {getEmailVerificationBadge()}
          </div>
        </div>
      </div>

      {/* Preferences Section */}
      <h3 className="section-subtitle">Account Preferences</h3>
      <div className="form-grid">
        {/* Theme Preference */}
        <div className="form-field">
          <label htmlFor="theme" className="form-label">
            Display Theme
          </label>
          {editing ? (
            <select
              id="theme"
              value={editForm.preferences.theme}
              onChange={(e) => handlePreferenceChange('theme', e.target.value as ThemeOption)}
              className="form-input"
              disabled={isLoading}
              aria-describedby="theme-help"
            >
              <option value="light">🌞 Light Theme</option>
              <option value="dark">🌙 Dark Theme</option>
            </select>
          ) : (
            <div className="form-value">
              {editForm.preferences.theme === 'dark' ? '🌙 Dark Theme' : '🌞 Light Theme'}
            </div>
          )}
          {editing && (
            <small id="theme-help" className="form-help">
              Choose your preferred color scheme
            </small>
          )}
        </div>

        {/* Language Preference */}
        <div className="form-field">
          <label htmlFor="language" className="form-label">
            Language
          </label>
          {editing ? (
            <select
              id="language"
              value={editForm.preferences.language}
              onChange={(e) => handlePreferenceChange('language', e.target.value as LanguageOption)}
              className="form-input"
              disabled={isLoading}
              aria-describedby="language-help"
            >
              <option value="en">🇺🇸 English</option>
              <option value="fr">🇫🇷 Français</option>
              <option value="es">🇪🇸 Español</option>
            </select>
          ) : (
            <div className="form-value">
              {editForm.preferences.language === 'fr' ? '🇫🇷 Français' : 
               editForm.preferences.language === 'es' ? '🇪🇸 Español' : '🇺🇸 English'}
            </div>
          )}
          {editing && (
            <small id="language-help" className="form-help">
              Select your preferred language
            </small>
          )}
        </div>

        {/* Notifications Preference */}
        <div className="form-field form-field-full-width">
          <label htmlFor="notifications" className="form-label">
            Email Notifications
          </label>
          {editing ? (
            <div className="checkbox-container">
              <input
                id="notifications"
                type="checkbox"
                checked={editForm.preferences.notifications}
                onChange={(e) => handlePreferenceChange('notifications', e.target.checked)}
                className="checkbox"
                disabled={isLoading}
                aria-describedby="notifications-help"
              />
              <label htmlFor="notifications" className="checkbox-label">
                Receive email notifications about account activity and updates
              </label>
            </div>
          ) : (
            <div className="form-value">
              <span className={`status-badge ${editForm.preferences.notifications ? 'status-enabled' : 'status-disabled'}`}>
                {editForm.preferences.notifications ? '🔔 Enabled' : '🔕 Disabled'}
              </span>
            </div>
          )}
          {editing && (
            <small id="notifications-help" className="form-help">
              You can always change this later in your account settings
            </small>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;
