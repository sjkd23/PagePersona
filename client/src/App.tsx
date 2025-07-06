import { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth0';
import PageTransformer from './components/TransformationPage';
import LandingPage from './components/LandingPage';
import Auth0Login from './components/auth/Auth0Login';
import UserProfileEnhanced from './components/auth/UserProfileEnhanced';
import ErrorBoundary from './components/ErrorBoundary';

function AppContent() {
  const { user, isAuthenticated, isLoading, login, signup, logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
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
    if (showAuth) {
      return <Auth0Login onBack={() => setShowAuth(false)} />;
    }

    return (
      <LandingPage 
        onShowLogin={login}
        onShowSignup={signup}
      />
    );
  }

  // If user wants to see profile, show profile component
  if (showProfile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b px-6 py-4 mb-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button 
              onClick={() => setShowProfile(false)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <span>←</span>
              <span>Back to Transformer</span>
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
          </div>
        </nav>
        <div className="max-w-4xl mx-auto px-6">
          <UserProfileEnhanced />
        </div>
      </div>
    );
  }

  // If on landing page (when authenticated)
  if (currentPage === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <nav className="bg-white shadow-sm px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <h1 className="text-xl font-bold text-gray-800">PagePersona</h1>
            </div>
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => setCurrentPage('transformer')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md transition-colors text-sm"
              >
                Get Started
              </button>
              <button 
                onClick={logout}
                className="text-gray-700 hover:text-gray-900 font-medium px-3 py-2 rounded-md transition-colors text-sm"
              >
                Log Out
              </button>
            </div>
          </div>
        </nav>
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
      <nav className="bg-white shadow-sm px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800">PagePersona</h1>
          </div>
          <div className="flex items-center space-x-1">
            <button 
              onClick={() => setCurrentPage('landing')}
              className="text-gray-700 hover:text-gray-900 font-medium px-3 py-2 rounded-md transition-colors text-sm"
            >
              Home
            </button>
            <button 
              onClick={() => setShowProfile(true)}
              className="text-gray-700 hover:text-gray-900 font-medium px-3 py-2 rounded-md transition-colors text-sm"
            >
              Profile
            </button>
            <button 
              onClick={logout}
              className="text-gray-700 hover:text-gray-900 font-medium px-3 py-2 rounded-md transition-colors text-sm"
            >
              Log Out
            </button>
          </div>
        </div>
      </nav>
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
