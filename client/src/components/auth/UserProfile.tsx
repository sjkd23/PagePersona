import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuthContext';
import { useNameSync } from '../../hooks/useNameSync';
import ApiService, { setTokenGetter } from '../../lib/apiClient';
import type { UserProfile } from '../../lib/apiClient';
import { formatProfileField, hasValidName, formatFullName } from '../../utils/profileUtils';
import './UserProfile.css';

// Usage limits based on membership
const getUsageLimit = (membership: string): number => {
  switch (membership) {
    case 'premium':
      return 500;
    case 'admin':
      return 10000;
    default:
      return 50;
  }
};

// Get membership display information
const getMembershipInfo = (membership: string) => {
  switch (membership) {
    case 'premium':
      return { 
        icon: '⭐', 
        label: 'Premium', 
        class: 'premium',
        benefits: 'All personas • Priority support • Custom personas'
      };
    case 'admin':
      return { 
        icon: '👑', 
        label: 'Admin', 
        class: 'admin',
        benefits: 'Custom integrations • Dedicated support • White-label options'
      };
    default:
      return { 
        icon: '🆓', 
        label: 'Free', 
        class: 'free',
        benefits: 'Basic personas • Community support'
      };
  }
};

export default function UserProfile() {
  const { user, logout, getAccessToken } = useAuth();
  const { forceNameSync, extractNamesFromAuth0 } = useNameSync();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    preferences: {
      theme: 'light' as 'light' | 'dark',
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
        const response = await ApiService.getUserProfile();
        setProfile(response.data);
        
        setEditForm({
          firstName: response.data.firstName || '',
          lastName: response.data.lastName || '',
          preferences: response.data.preferences
        });

        // Auto-sync names if they're missing or empty
        if (!hasValidName(response.data.firstName, response.data.lastName)) {
          const syncResult = await forceNameSync();
          
          if (syncResult.success) {
            // Refetch profile after successful sync
            const updatedResponse = await ApiService.getUserProfile();
            setProfile(updatedResponse.data);
            setEditForm({
              firstName: updatedResponse.data.firstName || '',
              lastName: updatedResponse.data.lastName || '',
              preferences: updatedResponse.data.preferences
            });
          } else {
            // Fallback: try manual update with Auth0 data
            const { firstName, lastName } = extractNamesFromAuth0();
            if (firstName || lastName) {
              try {
                const updateResult = await ApiService.updateUserProfile({
                  firstName,
                  lastName
                });
                if (updateResult.success) {
                  setProfile(updateResult.data);
                  setEditForm({
                    firstName: updateResult.data.firstName || '',
                    lastName: updateResult.data.lastName || '',
                    preferences: updateResult.data.preferences
                  });
                }
              } catch (updateError) {
                console.error('❌ Manual update failed:', updateError);
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, forceNameSync, extractNamesFromAuth0]);

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const response = await ApiService.updateUserProfile({
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        preferences: editForm.preferences
      });
      setProfile(response.data);
      setEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

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

  if (error) {
    return (
      <div className="profile-container">
        <div className="error-container">
          <p className="error-text">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="error-button"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        {/* Header */}
        <div className="profile-header">
          <div className="profile-header-content">
            <div className="profile-info">
              {user.picture ? (
                <img 
                  src={user.picture} 
                  alt={user.name || 'User'} 
                  className="profile-avatar"
                />
              ) : (
                <div className="profile-avatar-placeholder">
                  {(user.name || user.nickname || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="profile-details">
                <h1>
                  {hasValidName(profile?.firstName, profile?.lastName)
                    ? formatFullName(profile?.firstName, profile?.lastName)
                    : user.name || user.nickname || 'User'
                  }
                </h1>
                <p className="email">{profile?.email || user.email}</p>
                <p className="member-since">
                  Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>
            <div className="profile-actions">
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="btn btn-secondary"
                >
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="btn btn-success"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Membership Status Section */}
        <div className="membership-status-section">
          <div className="membership-status-card">
            <div className="membership-info">
              <div className="membership-tier">
                {(() => {
                  const membershipInfo = getMembershipInfo(profile?.membership || 'free');
                  return (
                    <>
                      <span className="membership-icon">{membershipInfo.icon}</span>
                      <span className="membership-name">{membershipInfo.label} Member</span>
                    </>
                  );
                })()}
              </div>
              <div className="membership-benefits">
                {getMembershipInfo(profile?.membership || 'free').benefits}
              </div>
            </div>
            <div className="usage-meter">
              <div className="usage-meter-bar">
                <div 
                  className="usage-meter-fill" 
                  style={
                    {
                      '--usage-width': `${Math.min(100, ((profile?.usage.monthlyUsage || 0) / getUsageLimit(profile?.membership || 'free')) * 100)}%`
                    } as React.CSSProperties
                  }
                ></div>
              </div>
              <div className="usage-meter-text">
                {profile?.usage.monthlyUsage || 0} / {getUsageLimit(profile?.membership || 'free')} transformations used
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="profile-content">
          <div className="content-grid">
            {/* Profile Information */}
            <div>
              <h2 className="section-title">Personal Information</h2>
              
              <div className="form-grid">
                <div className="form-field">
                  <label className="form-label">First Name</label>
                  {editing ? (
                    <input
                      type="text"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                      className="form-input"
                      placeholder="Enter first name"
                    />
                  ) : (
                  <div className="form-value">
                      {formatProfileField(profile?.firstName)}
                    </div>
                  )}
                </div>

                <div className="form-field">
                  <label className="form-label">Last Name</label>
                  {editing ? (
                    <input
                      type="text"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                      className="form-input"
                      placeholder="Enter last name"
                    />
                  ) : (
                  <div className="form-value">
                      {formatProfileField(profile?.lastName)}
                    </div>
                  )}
                </div>

                <div className="form-field">
                  <label className="form-label">Email Address</label>
                  <div className="form-value">
                    {profile?.email || 'Not provided'}
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label">Account Status</label>
                  <div className="form-value">
                    <span className={`status-badge ${
                      profile?.isEmailVerified ? 'status-verified' : 'status-warning'
                    }`}>
                      {profile?.isEmailVerified ? '✓ Verified Account' : '⚠ Pending Verification'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <h3 className="section-subtitle">Account Preferences</h3>
              <div className="form-grid">
                <div className="form-field">
                  <label className="form-label">Display Theme</label>
                  {editing ? (
                    <select
                      value={editForm.preferences.theme}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, theme: e.target.value as 'light' | 'dark' }
                      }))}
                      className="form-input"
                    >
                      <option value="light">Light Theme</option>
                      <option value="dark">Dark Theme</option>
                    </select>
                  ) : (
                    <div className="form-value">
                      {profile?.preferences.theme === 'dark' ? 'Dark Theme' : 'Light Theme'}
                    </div>
                  )}
                </div>

                <div className="form-field">
                  <label className="form-label">Language</label>
                  {editing ? (
                    <select
                      value={editForm.preferences.language}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, language: e.target.value }
                      }))}
                      className="form-input"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  ) : (
                    <div className="form-value">
                      {profile?.preferences.language === 'en' ? 'English' : 
                       profile?.preferences.language === 'es' ? 'Spanish' :
                       profile?.preferences.language === 'fr' ? 'French' :
                       profile?.preferences.language === 'de' ? 'German' :
                       'English'}
                    </div>
                  )}
                </div>

                <div className="form-field">
                  <label className="form-label">Email Notifications</label>
                  {editing ? (
                    <label className="checkbox-container">
                      <input
                        type="checkbox"
                        checked={editForm.preferences.notifications}
                        onChange={(e) => setEditForm(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, notifications: e.target.checked }
                        }))}
                        className="checkbox"
                      />
                      <span>Receive email notifications</span>
                    </label>
                  ) : (
                    <div className="form-value">
                      <span className={`status-badge ${
                        profile?.preferences.notifications ? 'status-enabled' : 'status-disabled'
                      }`}>
                        {profile?.preferences.notifications ? '✓ Enabled' : '✗ Disabled'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div>
              <h2 className="section-title">Usage Overview</h2>
              
              <div className="stats-container">
                <div className="stat-card remaining-transformations">
                  <div className="stat-number">
                    {Math.max(0, getUsageLimit(profile?.membership || 'free') - (profile?.usage.monthlyUsage || 0))}
                  </div>
                  <div className="stat-label">
                    Transformations Remaining This Month
                  </div>
                  <div className="stat-sublabel">
                    {profile?.usage.monthlyUsage || 0} / {getUsageLimit(profile?.membership || 'free')} used
                  </div>
                </div>
              </div>

              {/* Account Actions */}
              <h3 className="section-title mt-12">Account Settings</h3>
              
              <button
                onClick={logout}
                className="btn btn-danger w-full"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
