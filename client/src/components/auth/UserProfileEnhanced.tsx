import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth0';
import ApiService, { setTokenGetter } from '../../utils/api';
import type { UserProfile } from '../../utils/api';

export default function UserProfileEnhanced() {
  const { user, logout, getAccessToken } = useAuth();
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
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

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
      <div className="flex justify-center items-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-600 px-6 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {user.picture ? (
              <img 
                src={user.picture} 
                alt={user.name || 'User'} 
                className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg bg-gray-300 flex items-center justify-center">
                <span className="text-gray-600 text-2xl font-bold">
                  {(user.name || user.nickname || 'U')[0].toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-white">
                {profile?.firstName && profile?.lastName 
                  ? `${profile.firstName} ${profile.lastName}`
                  : user.name || user.nickname || 'User'
                }
              </h1>
              <p className="text-purple-100">{profile?.email || user.email}</p>
              <p className="text-purple-200 text-sm">
                Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="bg-white/20 hover:bg-white/30 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="bg-white/20 hover:bg-white/30 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter first name"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    {profile?.firstName || 'Not provided'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter last name"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    {profile?.lastName || 'Not provided'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  {profile?.email || 'Not provided'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  {profile?.username || 'Auto-generated'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Verified
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    profile?.isEmailVerified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {profile?.isEmailVerified ? '✓ Verified' : '⚠ Not verified'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Role
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                    {profile?.role || 'User'}
                  </span>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Theme
                  </label>
                  {editing ? (
                    <select
                      value={editForm.preferences.theme}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, theme: e.target.value as 'light' | 'dark' }
                      }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg border capitalize">
                      {profile?.preferences.theme || 'Light'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Language
                  </label>
                  {editing ? (
                    <select
                      value={editForm.preferences.language}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, language: e.target.value }
                      }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      {profile?.preferences.language === 'en' ? 'English' : 
                       profile?.preferences.language === 'es' ? 'Spanish' :
                       profile?.preferences.language === 'fr' ? 'French' :
                       profile?.preferences.language === 'de' ? 'German' :
                       profile?.preferences.language || 'English'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notifications
                  </label>
                  {editing ? (
                    <label className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg">
                      <input
                        type="checkbox"
                        checked={editForm.preferences.notifications}
                        onChange={(e) => setEditForm(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, notifications: e.target.checked }
                        }))}
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Enable notifications</span>
                    </label>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        profile?.preferences.notifications 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {profile?.preferences.notifications ? '✓ Enabled' : '✗ Disabled'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Usage Stats */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage Statistics</h2>
            
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {profile?.usage.totalTransformations || 0}
                  </div>
                  <div className="text-sm text-purple-800 font-medium">
                    Total Transformations
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {profile?.usage.monthlyUsage || 0}
                  </div>
                  <div className="text-sm text-blue-800 font-medium">
                    This Month
                  </div>
                </div>
              </div>

              {profile?.usage.lastTransformation && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Last transformation:</div>
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(profile.usage.lastTransformation).toLocaleDateString()}
                  </div>
                </div>
              )}

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600">Usage resets:</div>
                <div className="text-sm font-medium text-gray-900">
                  {profile?.usage.usageResetDate ? 
                    new Date(profile.usage.usageResetDate).toLocaleDateString() : 
                    'Unknown'
                  }
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h3>
              
              <div className="space-y-3">
                <button
                  onClick={logout}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
