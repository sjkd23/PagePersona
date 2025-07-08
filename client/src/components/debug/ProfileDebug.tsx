import { useState } from 'react';
import { useAuth } from '../../hooks/useAuthContext';
import ApiService from '../../lib/apiClient';
import type { UserProfile } from '../../lib/apiClient';

interface ProfileDebugProps {
  profile: UserProfile | null;
  onProfileUpdate: (newProfile: UserProfile) => void;
}

interface DebugTestResult {
  [key: string]: unknown;
}

interface DebugResults {
  timestamp: string;
  auth0User: unknown;
  currentProfile: UserProfile | null;
  tests: {
    currentProfileData?: DebugTestResult;
    auth0Data?: DebugTestResult;
    freshApiCall?: DebugTestResult;
    forceSync?: DebugTestResult;
    manualUpdate?: DebugTestResult;
  };
  error?: unknown;
}

export default function ProfileDebug({ profile, onProfileUpdate }: ProfileDebugProps) {
  const { user, getAccessToken } = useAuth();
  const [debugResults, setDebugResults] = useState<DebugResults | null>(null);
  const [loading, setLoading] = useState(false);

  const runDebugTests = async () => {
    setLoading(true);
    setDebugResults(null);

    try {
      const results: DebugResults = {
        timestamp: new Date().toISOString(),
        auth0User: user,
        currentProfile: profile,
        tests: {}
      };

      // Test 1: Current profile data
      results.tests.currentProfileData = {
        firstName: profile?.firstName,
        lastName: profile?.lastName,
        firstNameType: typeof profile?.firstName,
        lastNameType: typeof profile?.lastName,
        firstNameTruthy: !!profile?.firstName,
        lastNameTruthy: !!profile?.lastName,
        firstNameEmpty: profile?.firstName === '',
        lastNameEmpty: profile?.lastName === ''
      };

      // Test 2: Auth0 user data
      results.tests.auth0Data = {
        name: user?.name,
        givenName: user?.given_name,
        familyName: user?.family_name,
        email: user?.email,
        picture: user?.picture
      };

      // Test 3: Fresh API call
      console.log('🔍 Making fresh API call...');
      const freshProfile = await ApiService.getUserProfile();
      results.tests.freshApiCall = {
        success: freshProfile.success,
        data: freshProfile.data
      };

      // Test 4: Force name sync
      console.log('🔄 Attempting force name sync...');
      try {
        const token = await getAccessToken();
        const syncResponse = await fetch('/api/user/debug/force-name-sync', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const syncData = await syncResponse.json();
        results.tests.forceSync = syncData;
      } catch (syncError) {
        results.tests.forceSync = { error: syncError };
      }

      // Test 5: Manual name update
      if (user?.given_name || user?.family_name || user?.name) {
        console.log('✏️ Attempting manual name update...');
        
        let firstName = user.given_name || '';
        let lastName = user.family_name || '';
        
        if (!firstName && !lastName && user.name) {
          const nameParts = user.name.split(' ');
          firstName = nameParts[0] || '';
          lastName = nameParts.slice(1).join(' ') || '';
        }

        if (firstName || lastName) {
          try {
            const updateResult = await ApiService.updateUserProfile({
              firstName: firstName,
              lastName: lastName
            });
            results.tests.manualUpdate = {
              attempted: true,
              firstName,
              lastName,
              result: updateResult
            };

            if (updateResult.success) {
              onProfileUpdate(updateResult.data);
            }
          } catch (updateError) {
            results.tests.manualUpdate = { error: updateError };
          }
        } else {
          results.tests.manualUpdate = { error: 'No names available in Auth0 data' };
        }
      }

      setDebugResults(results);
      console.log('🔍 Debug Results:', results);

    } catch (error) {
      console.error('❌ Debug error:', error);
      setDebugResults({
        timestamp: new Date().toISOString(),
        auth0User: null,
        currentProfile: null,
        tests: {},
        error: error
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: '#f0f0f0',
      border: '1px solid #ccc',
      borderRadius: '8px',
      padding: '16px',
      maxWidth: '400px',
      fontSize: '12px',
      zIndex: 1000,
      maxHeight: '80vh',
      overflowY: 'auto'
    }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Profile Debug</h3>
      
      <button 
        onClick={runDebugTests}
        disabled={loading}
        style={{
          background: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '10px'
        }}
      >
        {loading ? 'Running Tests...' : 'Run Debug Tests'}
      </button>

      {debugResults && (
        <div style={{ marginTop: '10px' }}>
          <pre style={{
            background: '#fff',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '10px',
            overflow: 'auto',
            maxHeight: '300px'
          }}>
            {JSON.stringify(debugResults, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ marginTop: '10px', fontSize: '10px', color: '#666' }}>
        Current State:
        <br />
        First: {profile?.firstName ? `"${profile.firstName}"` : 'null/undefined'}
        <br />
        Last: {profile?.lastName ? `"${profile.lastName}"` : 'null/undefined'}
      </div>
    </div>
  );
}
