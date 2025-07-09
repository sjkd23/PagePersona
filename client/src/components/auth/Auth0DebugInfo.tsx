import React from 'react';
import { useAuth } from '../../hooks/useAuthContext';
import './Auth0DebugInfo.css';

/**
 * Debug component to display Auth0 user data
 * Temporarily add this to your profile page to see what data is available
 */
export const Auth0DebugInfo: React.FC = () => {
  const { user, userProfile } = useAuth();

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  if (!user) {
    return (
      <div className="debug-container-no-user">
        <h3>🔍 Auth0 Debug: No user data</h3>
      </div>
    );
  }

  return (
    <div className="debug-container">
      <h3 className="debug-title">🔍 Auth0 Debug Info</h3>
      
      <div className="debug-grid">
        <div>
          <h4 className="debug-section-title">Auth0 User Object:</h4>
          <pre className="debug-pre">
            {JSON.stringify({
              name: user.name,
              given_name: user.given_name,
              family_name: user.family_name,
              nickname: user.nickname,
              email: user.email,
              picture: user.picture,
              sub: user.sub,
              email_verified: user.email_verified
            }, null, 2)}
          </pre>
        </div>

        <div>
          <h4 className="debug-section-title">MongoDB Profile:</h4>
          <pre className="debug-pre">
            {userProfile ? JSON.stringify({
              firstName: userProfile.firstName,
              lastName: userProfile.lastName,
              email: userProfile.email,
              username: userProfile.username
            }, null, 2) : 'Loading...'}
          </pre>
        </div>
      </div>

      <div className="debug-extracted">
        <h4 className="debug-section-title">Extracted Names:</h4>
        <div className="debug-extracted-content">
          <p><strong>From Auth0 given_name:</strong> {user.given_name || 'Not provided'}</p>
          <p><strong>From Auth0 family_name:</strong> {user.family_name || 'Not provided'}</p>
          <p><strong>From Auth0 name split:</strong> 
            First: {user.name ? user.name.split(' ')[0] : 'N/A'}, 
            Last: {user.name ? user.name.split(' ').slice(1).join(' ') : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth0DebugInfo;
