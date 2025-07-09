import { useState, useMemo } from 'react';
import { Auth0Provider } from './hooks/useAuth0';
import { useAuth } from './hooks/useAuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import PageTransformer from './components/Transformer/TransformationPage';
import LandingPage from './components/Landing/LandingPage';
import UserProfile from './components/auth/UserProfile';
import ErrorBoundary from './components/Transformer/ErrorBoundary';
import Header from './components/Header';
import Footer from './components/Footer';

function AppContent() {
  const { user, isAuthenticated, isLoading, login, signup } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [currentPage, setCurrentPage] = useState<'landing' | 'transformer'>('landing');
  
  // Extract full name from user object
  const fullName = useMemo(() => {
    if (!user) return 'User';
    
    // First try to use given_name and family_name
    if (user.given_name && user.family_name) {
      return `${user.given_name} ${user.family_name}`;
    }
    
    // If not available, try to parse the name field
    if (user.name) {
      return user.name;
    }
    
    // Fallback to nickname or email
    return user.nickname || user.email?.split('@')[0] || 'User';
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 dark:border-purple-400 border-t-purple-600 dark:border-t-purple-300 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header 
          isAuthenticated={true}
          userName={fullName}
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
          <UserProfile />
        </div>
        <Footer />
      </div>
    );
  }

  // If on landing page (when authenticated)
  if (currentPage === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
        <Header 
          isAuthenticated={true}
          userName={fullName}
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
          userName={fullName}
        />
        <Footer />
      </div>
    );
  }

  // Default: show the main page transformer
  return (
    <div className="min-h-screen bg-blue-50 dark:bg-gray-900">
      <Header 
        isAuthenticated={true}
        userName={fullName}
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
      <ThemeProvider>
        <Auth0Provider>
          <AppContent />
        </Auth0Provider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
