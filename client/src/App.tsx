/**
 * Main Application Component
 *
 * Root component that orchestrates the entire application layout and routing.
 * Handles authentication states, page navigation, and provides context providers
 * for theme management and Auth0 integration. Manages user session state and
 * navigation between landing page, transformer, and user profile views.
 *
 * Features:
 * - Authentication state management
 * - Client-side routing between views
 * - User profile extraction and display
 * - Loading states and error boundaries
 * - Responsive layout with header and footer
 * - SEO optimization with structured data
 */

import { useState, useMemo, useEffect, Suspense, lazy } from 'react';
import { Auth0Provider } from './providers/Auth0Provider';
import { useAuth } from './hooks/useAuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/Transformer/ErrorBoundary';
import Header from './components/Header';
import Footer from './components/Footer';
import { SEOUtils } from './utils/seoUtils';
import Spinner from './components/common/Spinner';

// Lazy load heavy components
const PageTransformer = lazy(() => import('./components/Transformer/TransformationPage'));
const LandingPage = lazy(() => import('./components/Landing/LandingPage'));
const UserProfile = lazy(() => import('./components/auth/UserProfile'));

/**
 * Application Content Component
 *
 * Contains the main application logic and routing between different views
 * based on authentication status and user navigation choices.
 */
function AppContent() {
  const { user, isAuthenticated, isLoading, login, signup } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [currentPage, setCurrentPage] = useState<'landing' | 'transformer'>('landing');

  /**
   * Extract and format user's full name from Auth0 user object
   *
   * Attempts multiple fallback strategies to provide a user-friendly
   * display name from available Auth0 user properties.
   */
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

    // Prioritize email, then fallback to nickname
    return user.email || user.nickname || 'User';
  }, [user]);

  // Set up SEO and structured data based on current page
  useEffect(() => {
    if (currentPage === 'landing') {
      // Landing page SEO
      SEOUtils.updateMetaTags({
        title: 'PagePersonAI - Transform Web Content with AI-Powered Personas',
        description:
          'Transform any webpage into engaging content with AI-powered personas. Convert articles into Hemingway-style prose, medieval knight tales, ELI5 explanations, and more. Free online tool with instant results.',
        keywords:
          'AI content transformation, webpage rewriter, AI personas, content summarizer, text style converter, AI writing assistant, webpage analyzer, content personalization',
        url: '/',
        type: 'website',
      });

      // Add How-To structured data for the landing page
      SEOUtils.addHowToStructuredData(
        'How to Transform Web Content with AI Personas',
        'Learn how to use PagePersonAI to transform any webpage or text into different writing styles using AI-powered personas.',
        [
          {
            name: 'Choose Your Persona',
            text: 'Select from various AI personas like Hemingway, Medieval Knight, Anime Hero, or ELI5 to match your desired writing style.',
            image: '/images/persona-selection.png',
          },
          {
            name: 'Enter URL or Text',
            text: 'Paste a webpage URL or directly input the text you want to transform.',
            image: '/images/url-input.png',
          },
          {
            name: 'Generate Transformation',
            text: 'Click the generate button to let AI transform your content in the selected persona style.',
            image: '/images/generate-button.png',
          },
          {
            name: 'Read Your New Content',
            text: 'Review and enjoy your transformed content, now written in your chosen persona style.',
            image: '/images/output-result.png',
          },
        ],
      );
    } else if (currentPage === 'transformer') {
      // Transformer page SEO
      SEOUtils.updateMetaTags({
        title: 'AI Content Transformer - PagePersonAI',
        description:
          'Transform webpages and text with AI-powered personas. Choose from multiple writing styles and see your content transformed instantly.',
        keywords:
          'AI content transformer, webpage converter, text rewriter, AI personas, content analysis',
        url: '/transform',
        type: 'website',
      });
    } else if (showProfile) {
      // Profile page SEO
      SEOUtils.updateMetaTags({
        title: `${fullName}'s Profile - PagePersonAI`,
        description:
          'Manage your PagePersonAI account settings, view transformation history, and customize your experience.',
        keywords: 'user profile, account settings, transformation history, PagePersonAI',
        url: '/profile',
        type: 'website',
      });
    }
  }, [currentPage, showProfile, fullName]);

  // Render loading state during authentication initialization
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center">
        <div className="text-center" role="status" aria-live="polite">
          <div
            className="w-16 h-16 border-4 border-purple-200 dark:border-purple-400 border-t-purple-600 dark:border-t-purple-300 rounded-full animate-spin mx-auto mb-4"
            aria-hidden="true"
          ></div>
          <p className="text-gray-600 dark:text-gray-300">Loading PagePersonAI...</p>
        </div>
      </div>
    );
  }

  // Render unauthenticated view with landing page and login options
  if (!isAuthenticated || !user) {
    return (
      <div>
        <Header
          isAuthenticated={false}
          onLogin={login}
          onSignup={signup}
          onTransform={login} // Transform action triggers login for unauthenticated users
        />
        <main role="main">
          <Suspense fallback={<Spinner size="large" message="Loading landing page..." />}>
            <LandingPage onShowLogin={login} onShowSignup={signup} />
          </Suspense>
        </main>
        <Footer />
      </div>
    );
  }

  // Render user profile view when profile navigation is active
  if (showProfile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header
          isAuthenticated={true}
          userName={fullName}
          isOnProfilePage={true}
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
        <main role="main" className="max-w-4xl mx-auto px-6 pt-8">
          <Suspense fallback={<Spinner size="large" message="Loading profile..." />}>
            <UserProfile />
          </Suspense>
        </main>
        <Footer />
      </div>
    );
  }

  // Render landing page for authenticated users
  if (currentPage === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
        <Header
          isAuthenticated={true}
          userName={fullName}
          isOnProfilePage={false}
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
        <main role="main">
          <Suspense fallback={<Spinner size="large" message="Loading landing page..." />}>
            <LandingPage
              onShowLogin={() => setCurrentPage('transformer')}
              onShowSignup={() => setCurrentPage('transformer')}
              isAuthenticated={true}
              userName={fullName}
            />
          </Suspense>
        </main>
        <Footer />
      </div>
    );
  }

  // Default view: render the main transformation interface
  return (
    <div className="min-h-screen bg-blue-50 dark:bg-gray-900">
      <Header
        isAuthenticated={true}
        userName={fullName}
        isOnProfilePage={false}
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
      <main role="main">
        <Suspense fallback={<Spinner size="large" message="Loading transformer..." />}>
          <PageTransformer />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

/**
 * Root Application Component
 *
 * Provides essential context providers and error boundaries for the entire
 * application. Wraps the main application content with theme management,
 * Auth0 authentication, and error handling capabilities.
 *
 * @returns JSX element containing the fully configured application
 */
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
