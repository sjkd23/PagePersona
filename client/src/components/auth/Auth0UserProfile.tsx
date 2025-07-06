import { useAuth } from '../../hooks/useAuth0';

export default function Auth0UserProfile() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-600 px-6 py-8">
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
              {user.name || user.nickname || 'User'}
            </h1>
            <p className="text-purple-100">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="p-3 bg-gray-50 rounded-lg border">
                {user.name || 'Not provided'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="p-3 bg-gray-50 rounded-lg border">
                {user.email || 'Not provided'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <div className="p-3 bg-gray-50 rounded-lg border">
                {user.nickname || 'Not provided'}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User ID
              </label>
              <div className="p-3 bg-gray-50 rounded-lg border text-sm font-mono">
                {user.sub}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Verified
              </label>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.email_verified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {user.email_verified ? '✓ Verified' : '⚠ Not verified'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Updated
              </label>
              <div className="p-3 bg-gray-50 rounded-lg border">
                {user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'Unknown'}
              </div>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h3>
          
          <div className="flex flex-wrap gap-4">
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2 rounded-lg transition-colors duration-200"
            >
              Sign Out
            </button>
            
            <button
              className="bg-gray-600 hover:bg-gray-700 text-white font-medium px-6 py-2 rounded-lg transition-colors duration-200"
              onClick={() => window.open('https://auth0.com/docs/manage-users/user-accounts/manage-user-profiles', '_blank')}
            >
              Manage Account
            </button>
          </div>
        </div>

        {/* Usage Information */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Information</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              💡 Your usage statistics will be available once you start using PagePersona AI to transform content.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
