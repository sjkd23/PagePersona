import { useState } from 'react';
import { Auth0Provider } from './hooks/useAuth0';
import { useAuth } from './hooks/useAuthContext';
import PageTransformer from './components/Transformer/TransformationPage';
import LandingPage from './components/Landing/LandingPage';
import UserProfileEnhanced from './components/auth/UserProfileEnhanced';
import ErrorBoundary from './components/Transformer/ErrorBoundary';
import Header from './components/Header';
import Footer from './components/Footer';

function AppContent() {
  const { user, isAuthenticated, isLoading, login, signup, logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [currentPage, setCurrentPage] = useState<'landing' | 'transformer'>('landing');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
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
          onTransform={login} // Changed: Transform triggers login when unauthenticated
        />
        <LandingPage 
          onShowLogin={login}
          onShowSignup={signup}
        />
        <Footer />
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
          onTransform={() => {
            setShowProfile(false);
            setCurrentPage('transformer');
          }}
        />
        <div className="max-w-4xl mx-auto px-6 pt-8">
          <UserProfileEnhanced />
        </div>
        <Footer />
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
          onTransform={() => {
            setShowProfile(false);
            setCurrentPage('transformer');
          }}
        />
        <LandingPage 
          onShowLogin={() => setCurrentPage('transformer')}
          onShowSignup={() => setCurrentPage('transformer')}
          isAuthenticated={true}
          userName={user.name || user.nickname || 'User'}
        />
        <Footer />
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
        onTransform={() => {
          setShowProfile(false);
          setCurrentPage('transformer');
        }}
      />
      <PageTransformer />
      <Footer />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Auth0Provider>
        <AppContent />
      </Auth0Provider>
    </ErrorBoundary>
  );
}

export default App;
