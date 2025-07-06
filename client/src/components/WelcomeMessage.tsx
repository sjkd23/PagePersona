import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth0';

/**
 * WelcomeMessage Component
 * 
 * This component demonstrates how to use the custom claims from the Auth0 Post-Login Action
 * to provide a personalized experience for new users.
 */
export const WelcomeMessage: React.FC = () => {
  const { 
    isAuthenticated, 
    isNewUser, 
    isFirstLogin, 
    profileSyncError,
    user,
    getCustomClaims 
  } = useAuth();
  
  const [showWelcome, setShowWelcome] = useState(false);
  const [claims, setClaims] = useState<any>(null);

  useEffect(() => {
    const loadClaims = async () => {
      if (isAuthenticated) {
        const customClaims = await getCustomClaims();
        setClaims(customClaims);
        
        // Show welcome message for new users
        if (customClaims?.['https://pagepersona.com/is_new_user']) {
          setShowWelcome(true);
          
          // Auto-hide after 10 seconds
          setTimeout(() => setShowWelcome(false), 10000);
        }
      }
    };

    loadClaims();
  }, [isAuthenticated, getCustomClaims]);

  if (!isAuthenticated) return null;

  return (
    <div className="space-y-2">
      {/* Welcome message for new users */}
      {showWelcome && isNewUser && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg shadow-lg border-l-4 border-yellow-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🎉</div>
              <div>
                <h3 className="font-bold text-lg">Welcome to PagePersonAI!</h3>
                <p className="text-blue-100">
                  Thanks for joining us, {user?.given_name || user?.name}! Your profile has been automatically created.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowWelcome(false)}
              className="text-blue-100 hover:text-white text-xl"
            >
              ×
            </button>
          </div>
          <div className="mt-2 text-sm text-blue-100">
            🚀 Ready to transform your first webpage? Let's get started!
          </div>
        </div>
      )}

      {/* First login indicator */}
      {isFirstLogin && !isNewUser && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
          <div className="flex items-center">
            <div className="text-green-400 text-xl mr-3">👋</div>
            <div>
              <p className="text-green-800 font-medium">Welcome back!</p>
              <p className="text-green-600 text-sm">This is your first login on this device.</p>
            </div>
          </div>
        </div>
      )}

      {/* Profile sync error warning */}
      {profileSyncError && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex items-center">
            <div className="text-yellow-400 text-xl mr-3">⚠️</div>
            <div>
              <p className="text-yellow-800 font-medium">Profile Sync Notice</p>
              <p className="text-yellow-600 text-sm">
                Your profile creation may have encountered an issue, but your account is working normally.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Debug info (only in development) */}
      {import.meta.env.DEV && claims && (
        <details className="bg-gray-50 p-3 rounded text-sm">
          <summary className="cursor-pointer font-medium text-gray-700">
            🔍 Debug: Custom Claims Data
          </summary>
          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(claims, null, 2)}
          </pre>
          <div className="mt-2 space-y-1 text-xs text-gray-600">
            <div>• Is New User: {isNewUser ? '✅ Yes' : '❌ No'}</div>
            <div>• Is First Login: {isFirstLogin ? '✅ Yes' : '❌ No'}</div>
            <div>• Profile Sync Error: {profileSyncError ? '❌ Yes' : '✅ No'}</div>
          </div>
        </details>
      )}
    </div>
  );
};

export default WelcomeMessage;
