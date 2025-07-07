import { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth0';
import PageTransformer from './components/TransformationPage';
import LandingPage from './components/LandingPage';
import UserProfileEnhanced from './components/auth/UserProfileEnhanced';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';

function AppContent() {
  const { user, isAuthenticated, isLoading, login, signup, logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [currentPage, setCurrentPage] = useState<'landing' | 'transformer'>('landing');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-2xl">P</span>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div>
        <Header 
          isAuthenticated={false}
          onLogin={login}
          onSignup={signup}
        />
        <LandingPage 
          onShowLogin={login}
          onShowSignup={signup}
        />
      </div>
    );
  }

  // If user wants to see profile, show profile component
  if (showProfile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          isAuthenticated={true}
          userName={user.name || user.nickname || 'User'}
          onLogout={logout}
          onHome={() => {
            setShowProfile(false);
            setCurrentPage('landing');
          }}
          onProfile={() => setShowProfile(true)}
        />
        <div className="max-w-4xl mx-auto px-6 pt-8">
          <UserProfileEnhanced />
        </div>
      </div>
    );
  }

  // If on landing page (when authenticated)
  if (currentPage === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <Header 
          isAuthenticated={true}
          userName={user.name || user.nickname || 'User'}
          onLogout={logout}
          onHome={() => {
            setShowProfile(false);
            setCurrentPage('landing');
          }}
          onProfile={() => setShowProfile(true)}
        />
        <LandingPage 
          onShowLogin={() => setCurrentPage('transformer')}
          onShowSignup={() => setCurrentPage('transformer')}
          isAuthenticated={true}
          userName={user.name || user.nickname || 'User'}
        />
      </div>
    );
  }

  // Default: show the main page transformer with home and logout buttons
  return (
    <div className="min-h-screen bg-blue-50">
      <Header 
        isAuthenticated={true}
        userName={user.name || user.nickname || 'User'}
        onLogout={logout}
        onHome={() => {
          setShowProfile(false);
          setCurrentPage('landing');
        }}
        onProfile={() => setShowProfile(true)}
      />
      <PageTransformer />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
