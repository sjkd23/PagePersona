/**
 * User Profile Component
 *
 * This is the main user profile component that orchestrates the display
 * of user information, membership status, and profile editing capabilities.
 * It integrates with Auth0 for authentication and provides a comprehensive
 * user profile management interface.
 *
 * @module UserProfile
 */

import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuthContext";
import { useNameSync } from "../../hooks/useNameSync";
import { useProfileTheme } from "../../hooks/useProfileTheme";
import ApiService, { setTokenGetter } from "../../lib/apiClient";
import type { UserProfile as UserProfileType } from "../../lib/apiClient";
import {
  formatProfileField,
  hasValidName,
  formatFullName,
} from "../../utils/profileUtils";
import ErrorDisplay from "../Transformer/ErrorDisplay";
import { ErrorMapper, type UserFriendlyError } from "@pagepersonai/shared";
import type { ProfileEditForm } from "./types";

// Import utilities for the legacy component
import { getMembershipInfo, getUsageLimit } from "./utils/membershipUtils";

// Import styles
import "./UserProfile.css";

/**
 * Main UserProfile component that provides comprehensive user profile management
 *
 * This component orchestrates the display of user information, handles profile
 * editing, manages loading and error states, and integrates with Auth0 for
 * authentication. It uses modular sub-components for better maintainability.
 *
 * @returns JSX element containing the complete user profile interface
 */
export default function UserProfile() {
  const { user, logout, getAccessToken } = useAuth();
  const { forceNameSync, extractNamesFromAuth0 } = useNameSync();
  const { currentTheme, syncThemeFromProfile } = useProfileTheme();
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enhancedError, setEnhancedError] = useState<UserFriendlyError | null>(
    null,
  );
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<ProfileEditForm>({
    firstName: "",
    lastName: "",
    preferences: {
      theme: "light",
      language: "en",
      notifications: true,
    },
  });

  // Set up the token getter for API calls
  useEffect(() => {
    setTokenGetter(getAccessToken);
  }, [getAccessToken]);

  // Fetch user profile data - run only once on mount to prevent multiple API calls
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

          setEditForm({
            firstName: response.data.firstName || "",
            lastName: response.data.lastName || "",
            preferences: response.data.preferences,
          });

          // Sync the global theme with the user's profile theme preference
          syncThemeFromProfile(response.data.preferences.theme);

          // Auto-sync names if they're missing or empty
          if (!hasValidName(response.data.firstName, response.data.lastName)) {
            const syncResult = await forceNameSync();

            if (syncResult.success) {
              // Refetch profile after successful sync
              const updatedResponse = await ApiService.getUserProfile();
              if (updatedResponse.data) {
                setProfile(updatedResponse.data);
                setEditForm({
                  firstName: updatedResponse.data.firstName || "",
                  lastName: updatedResponse.data.lastName || "",
                  preferences: updatedResponse.data.preferences,
                });
                // Re-sync theme after profile update
                syncThemeFromProfile(updatedResponse.data.preferences.theme);
              }
            } else {
              // Fallback: try manual update with Auth0 data
              const { firstName, lastName } = extractNamesFromAuth0();
              if (firstName || lastName) {
                try {
                  const updateResult = await ApiService.updateUserProfile({
                    firstName,
                    lastName,
                  });
                  if (updateResult.success && updateResult.data) {
                    setProfile(updateResult.data);
                    setEditForm({
                      firstName: updateResult.data.firstName || "",
                      lastName: updateResult.data.lastName || "",
                      preferences: updateResult.data.preferences,
                    });
                  }
                } catch {
                  // Manual update failed - continue
                }
              }
            }
          }
        }
      } catch (err) {
        const mappedError = ErrorMapper.mapError(err);
        setEnhancedError(mappedError);
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, syncThemeFromProfile, forceNameSync, extractNamesFromAuth0]); // Added missing dependencies

  // Listen for header theme toggle events when editing
  useEffect(() => {
    const handleHeaderThemeToggle = (event: globalThis.Event) => {
      const customEvent = event as globalThis.CustomEvent<{
        theme: "light" | "dark";
      }>;
      const newTheme = customEvent.detail.theme;

      // Update the edit form to reflect the header theme change
      if (editing) {
        setEditForm((prev) => ({
          ...prev,
          preferences: {
            ...prev.preferences,
            theme: newTheme,
          },
        }));
      }
    };

    window.addEventListener("headerThemeToggle", handleHeaderThemeToggle);

    return () => {
      window.removeEventListener("headerThemeToggle", handleHeaderThemeToggle);
    };
  }, [editing]);

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      setEnhancedError(null);
      const response = await ApiService.updateUserProfile({
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        preferences: editForm.preferences,
      });

      if (response.data) {
        setProfile(response.data);
        setEditing(false);
        // Apply the saved theme immediately
        syncThemeFromProfile(response.data.preferences.theme);
      }
    } catch (err) {
      const mappedError = ErrorMapper.mapError(err);
      setEnhancedError(mappedError);
      setError("Failed to update profile");
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
        {/* Header */}
        <div className="profile-header">
          <div className="profile-header-content">
            <div className="profile-info">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name || "User"}
                  className="profile-avatar"
                  loading="lazy"
                />
              ) : (
                <div className="profile-avatar-placeholder">
                  {(user.name || user.nickname || "U")[0].toUpperCase()}
                </div>
              )}
              <div className="profile-details">
                <h1>
                  {hasValidName(profile?.firstName, profile?.lastName)
                    ? formatFullName(profile?.firstName, profile?.lastName)
                    : user.name || user.nickname || "User"}
                </h1>
                <p className="email">{profile?.email || user.email}</p>
                <p className="member-since">
                  Member since{" "}
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString()
                    : "Unknown"}
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
                  const membershipInfo = getMembershipInfo(
                    profile?.membership || "free",
                  );
                  return (
                    <>
                      <span className="membership-icon">
                        {membershipInfo.icon}
                      </span>
                      <span className="membership-name">
                        {membershipInfo.label} Member
                      </span>
                    </>
                  );
                })()}
              </div>
              <div className="membership-benefits">
                {getMembershipInfo(profile?.membership || "free").benefits}
              </div>
            </div>
            <div className="usage-meter">
              <div className="usage-meter-bar">
                <div
                  className="usage-meter-fill"
                  style={
                    {
                      "--usage-width": `${Math.min(100, ((profile?.usage.monthlyUsage || 0) / getUsageLimit(profile?.membership || "free")) * 100)}%`,
                    } as React.CSSProperties
                  }
                ></div>
              </div>
              <div className="usage-meter-text">
                {profile?.usage.monthlyUsage || 0} /{" "}
                {getUsageLimit(profile?.membership || "free")} transformations
                used
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
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          firstName: e.target.value,
                        }))
                      }
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
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          lastName: e.target.value,
                        }))
                      }
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
                    {profile?.email || "Not provided"}
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label">Username</label>
                  <div className="form-value">
                    {profile?.username || "Not set"}
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label">Account Status</label>
                  <div className="form-value">
                    <span
                      className={`status-badge ${
                        profile?.isEmailVerified
                          ? "status-verified"
                          : "status-warning"
                      }`}
                    >
                      {profile?.isEmailVerified
                        ? "✓ Verified Account"
                        : "⚠ Pending Verification"}
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
                      onChange={(e) => {
                        const newTheme = e.target.value as "light" | "dark";
                        setEditForm((prev) => ({
                          ...prev,
                          preferences: {
                            ...prev.preferences,
                            theme: newTheme,
                          },
                        }));
                        // Only sync for live preview, don't persist until Save is clicked
                        // This prevents conflicts with the header theme toggle
                        syncThemeFromProfile(newTheme);
                      }}
                      className="form-input"
                    >
                      <option value="light">Light Theme</option>
                      <option value="dark">Dark Theme</option>
                    </select>
                  ) : (
                    <div className="form-value">
                      {currentTheme === "dark" ? "Dark Theme" : "Light Theme"}
                    </div>
                  )}
                </div>

                <div className="form-field">
                  <label className="form-label">Language</label>
                  {editing ? (
                    <select
                      value={editForm.preferences.language}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          preferences: {
                            ...prev.preferences,
                            language: e.target.value,
                          },
                        }))
                      }
                      className="form-input"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  ) : (
                    <div className="form-value">
                      {profile?.preferences.language === "en"
                        ? "English"
                        : profile?.preferences.language === "es"
                          ? "Spanish"
                          : profile?.preferences.language === "fr"
                            ? "French"
                            : profile?.preferences.language === "de"
                              ? "German"
                              : "English"}
                    </div>
                  )}
                </div>

                <div className="form-field">
                  <label className="form-label">Notifications</label>
                  {editing ? (
                    <label className="checkbox-container">
                      <input
                        type="checkbox"
                        checked={editForm.preferences.notifications}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              notifications: e.target.checked,
                            },
                          }))
                        }
                        className="form-checkbox"
                      />
                      <span className="checkmark"></span>
                      Enable email notifications
                    </label>
                  ) : (
                    <div className="form-value">
                      {profile?.preferences.notifications
                        ? "Enabled"
                        : "Disabled"}
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
                    {Math.max(
                      0,
                      getUsageLimit(profile?.membership || "free") -
                        (profile?.usage.monthlyUsage || 0),
                    )}
                  </div>
                  <div className="stat-label">
                    Transformations Remaining This Month
                  </div>
                  <div className="stat-sublabel">
                    {profile?.usage.monthlyUsage || 0} /{" "}
                    {getUsageLimit(profile?.membership || "free")} used
                  </div>
                </div>
              </div>

              {/* Account Actions */}
              <h3 className="section-title mt-12">Account Settings</h3>

              <button onClick={logout} className="btn btn-danger w-full">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
