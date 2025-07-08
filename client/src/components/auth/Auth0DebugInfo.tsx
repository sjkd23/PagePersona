import React from 'react';
import { useAuth } from '../../hooks/useAuthContext';

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
      <div style={{ 
        background: '#f0f0f0', 
        padding: '1rem', 
        margin: '1rem 0', 
        borderRadius: '8px',
        fontSize: '0.875rem'
      }}>
        <h3>🔍 Auth0 Debug: No user data</h3>
      </div>
    );
  }

  return (
    <div style={{ 
      background: '#f8f9fa', 
      padding: '1rem', 
      margin: '1rem 0', 
      borderRadius: '8px',
      fontSize: '0.875rem',
      border: '1px solid #dee2e6'
    }}>
      <h3 style={{ margin: '0 0 1rem 0', color: '#495057' }}>🔍 Auth0 Debug Info</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#6c757d' }}>Auth0 User Object:</h4>
          <pre style={{ 
            background: 'white', 
            padding: '0.5rem', 
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '0.75rem'
          }}>
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
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#6c757d' }}>MongoDB Profile:</h4>
          <pre style={{ 
            background: 'white', 
            padding: '0.5rem', 
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '0.75rem'
          }}>
            {userProfile ? JSON.stringify({
              firstName: userProfile.firstName,
              lastName: userProfile.lastName,
              email: userProfile.email,
              username: userProfile.username
            }, null, 2) : 'Loading...'}
          </pre>
        </div>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#6c757d' }}>Extracted Names:</h4>
        <div style={{ 
          background: 'white', 
          padding: '0.5rem', 
          borderRadius: '4px',
          fontSize: '0.875rem'
        }}>
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
