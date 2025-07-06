import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import './UserProfile.css';

export default function UserProfile() {
  const { user, logout, updateProfile, isLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    preferences: {
      theme: user?.preferences.theme || 'light',
      language: user?.preferences.language || 'en',
      notifications: user?.preferences.notifications ?? true
    }
  });

  if (!user) return null;

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      preferences: {
        theme: user.preferences.theme,
        language: user.preferences.language,
        notifications: user.preferences.notifications
      }
    });
  };

  const handleSave = async () => {
    const result = await updateProfile(editData);
    if (result.success) {
      setIsEditing(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('preferences.')) {
      const prefKey = name.split('.')[1];
      setEditData({
        ...editData,
        preferences: {
          ...editData.preferences,
          [prefKey]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }
      });
    } else {
      setEditData({
        ...editData,
        [name]: value
      });
    }
  };

  return (
    <div className="user-profile">
      <div className="profile-header">
        <div className="profile-avatar">
          {user.firstName ? user.firstName[0].toUpperCase() : user.username[0].toUpperCase()}
        </div>
        <div className="profile-info">
          <h2>{user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}</h2>
          <p className="profile-email">{user.email}</p>
          <span className={`profile-badge ${user.role}`}>{user.role}</span>
        </div>
        <button onClick={logout} className="logout-button">
          Sign Out
        </button>
      </div>

      <div className="profile-stats">
        <div className="stat-card">
          <div className="stat-number">{user.usage.totalTransformations}</div>
          <div className="stat-label">Total Transformations</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{user.usage.monthlyTransformations}</div>
          <div className="stat-label">This Month</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
          </div>
          <div className="stat-label">Last Login</div>
        </div>
      </div>

      <div className="profile-section">
        <div className="section-header">
          <h3>Profile Information</h3>
          {!isEditing && (
            <button onClick={handleEdit} className="edit-button">
              Edit
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="edit-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={editData.firstName}
                  onChange={handleInputChange}
                  placeholder="First name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={editData.lastName}
                  onChange={handleInputChange}
                  placeholder="Last name"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="preferences.theme">Theme</label>
              <select
                id="preferences.theme"
                name="preferences.theme"
                value={editData.preferences.theme}
                onChange={handleInputChange}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="preferences.language">Language</label>
              <select
                id="preferences.language"
                name="preferences.language"
                value={editData.preferences.language}
                onChange={handleInputChange}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>

            <div className="form-group checkbox-group">
              <label htmlFor="preferences.notifications">
                <input
                  type="checkbox"
                  id="preferences.notifications"
                  name="preferences.notifications"
                  checked={editData.preferences.notifications}
                  onChange={handleInputChange}
                />
                Enable notifications
              </label>
            </div>

            <div className="button-group">
              <button
                onClick={handleSave}
                className="save-button"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleCancel}
                className="cancel-button"
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="profile-details">
            <div className="detail-row">
              <span className="detail-label">Username:</span>
              <span className="detail-value">{user.username}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">First Name:</span>
              <span className="detail-value">{user.firstName || 'Not set'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Last Name:</span>
              <span className="detail-value">{user.lastName || 'Not set'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Theme:</span>
              <span className="detail-value">{user.preferences.theme}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Language:</span>
              <span className="detail-value">{user.preferences.language}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Notifications:</span>
              <span className="detail-value">{user.preferences.notifications ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Member since:</span>
              <span className="detail-value">{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
