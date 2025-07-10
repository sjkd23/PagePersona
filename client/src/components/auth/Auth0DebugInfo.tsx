/**
 * Auth0 Debug Information Component
 * 
 * This component displays detailed Auth0 user data for development and
 * debugging purposes. It shows the raw Auth0 user object, MongoDB profile
 * data, and extracted name information to help developers understand
 * data flow and troubleshoot authentication issues.
 * 
 * @module Auth0DebugInfo
 * @dev-only This component only renders in development mode
 */

import React from 'react';
import { useAuth } from '../../hooks/useAuthContext';
import './Auth0DebugInfo.css';

/**
 * Auth0DebugInfo component for development debugging
 * 
 * Displays comprehensive debugging information including:
 * - Raw Auth0 user object with key fields
 * - MongoDB user profile data
 * - Name extraction logic results
 * - Verification status and metadata
 * 
 * This component is automatically hidden in production builds.
 * 
 * @returns JSX element displaying debug information or null in production
 */
export const Auth0DebugInfo: React.FC = () => {
  const { user, userProfile } = useAuth();

  // Only show in development environment
  if (import.meta.env.PROD) {
    return null;
  }

  // Show message when no user is authenticated
  if (!user) {
    return (
      <div className="debug-container-no-user">
        <h3>🔍 Auth0 Debug: No user authenticated</h3>
        <p>Please sign in to view debug information</p>
      </div>
    );
  }

  /**
   * Extract names from Auth0 user object using different methods
   */
  const extractNamesFromAuth0 = () => {
    const nameFromSplit = user.name ? user.name.split(' ') : [];
    return {
      givenName: user.given_name,
      familyName: user.family_name,
      splitFirst: nameFromSplit[0] || '',
      splitLast: nameFromSplit.slice(1).join(' ') || '',
      nickname: user.nickname,
      fullName: user.name
    };
  };

  const extractedNames = extractNamesFromAuth0();

  return (
    <div className="debug-container">
      <h3 className="debug-title">🔍 Auth0 Debug Information</h3>
      
      <div className="debug-grid">
        {/* Auth0 User Object */}
        <div>
          <h4 className="debug-section-title">Auth0 User Object:</h4>
          <pre className="debug-pre">
            {JSON.stringify({
              sub: user.sub,
              name: user.name,
              given_name: user.given_name,
              family_name: user.family_name,
              nickname: user.nickname,
              email: user.email,
              email_verified: user.email_verified,
              picture: user.picture,
              updated_at: user.updated_at,
              locale: user.locale
            }, null, 2)}
          </pre>
        </div>

        {/* MongoDB Profile */}
        <div>
          <h4 className="debug-section-title">MongoDB Profile:</h4>
          <pre className="debug-pre">
            {userProfile ? JSON.stringify({
              id: userProfile.id,
              firstName: userProfile.firstName,
              lastName: userProfile.lastName,
              email: userProfile.email,
              username: userProfile.username,
              isEmailVerified: userProfile.isEmailVerified,
              role: userProfile.role,
              createdAt: userProfile.createdAt,
              updatedAt: userProfile.updatedAt
            }, null, 2) : 'Loading profile data...'}
          </pre>
        </div>
      </div>

      {/* Name Extraction Analysis */}
      <div className="debug-extracted">
        <h4 className="debug-section-title">Name Extraction Analysis:</h4>
        <div className="debug-extracted-content">
          <p><strong>Auth0 given_name:</strong> {extractedNames.givenName || 'Not provided'}</p>
          <p><strong>Auth0 family_name:</strong> {extractedNames.familyName || 'Not provided'}</p>
          <p><strong>Full name from Auth0:</strong> {extractedNames.fullName || 'Not provided'}</p>
          <p><strong>Split name - First:</strong> {extractedNames.splitFirst || 'N/A'}</p>
          <p><strong>Split name - Last:</strong> {extractedNames.splitLast || 'N/A'}</p>
          <p><strong>Nickname:</strong> {extractedNames.nickname || 'Not provided'}</p>
          <p><strong>MongoDB firstName:</strong> {userProfile?.firstName || 'Not in database'}</p>
          <p><strong>MongoDB lastName:</strong> {userProfile?.lastName || 'Not in database'}</p>
        </div>
      </div>

      {/* Verification Status */}
      <div className="debug-extracted">
        <h4 className="debug-section-title">Verification & Status:</h4>
        <div className="debug-extracted-content">
          <p><strong>Email verified (Auth0):</strong> 
            <span className={user.email_verified ? 'text-green-600' : 'text-red-600'}>
              {user.email_verified ? ' ✅ Yes' : ' ❌ No'}
            </span>
          </p>
          <p><strong>Email verified (MongoDB):</strong> 
            <span className={userProfile?.isEmailVerified ? 'text-green-600' : 'text-red-600'}>
              {userProfile?.isEmailVerified ? ' ✅ Yes' : ' ❌ No'}
            </span>
          </p>
          <p><strong>Has profile picture:</strong> 
            <span className={user.picture ? 'text-green-600' : 'text-gray-600'}>
              {user.picture ? ' ✅ Yes' : ' ❌ No'}
            </span>
          </p>
          <p><strong>Profile sync status:</strong> 
            <span className={userProfile ? 'text-green-600' : 'text-yellow-600'}>
              {userProfile ? ' ✅ Synced' : ' ⏳ Loading...'}
            </span>
          </p>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="debug-extracted">
        <h4 className="debug-section-title">Debug Instructions:</h4>
        <div className="debug-extracted-content">
          <p>• This component only appears in development mode</p>
          <p>• Check name extraction if profile names are missing</p>
          <p>• Verify email status matches between Auth0 and MongoDB</p>
          <p>• Use this data to troubleshoot authentication issues</p>
        </div>
      </div>
    </div>
  );
};

export default Auth0DebugInfo;
