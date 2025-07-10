/**
 * Auth0 Login Component
 * 
 * This component provides a comprehensive authentication interface that
 * integrates with Auth0 service. It includes both sign-up and sign-in
 * options with modern UI design, loading states, error handling, and
 * accessibility features.
 * 
 * Features:
 * - Responsive design with gradient backgrounds
 * - Loading states with disabled buttons
 * - Error display with retry mechanisms
 * - Accessibility compliance (ARIA labels, keyboard navigation)
 * - Modern glassmorphism design aesthetic
 * 
 * @module Auth0Login
 */

import { useAuth } from '../../hooks/useAuthContext';

/**
 * Props for the Auth0Login component
 */
interface Auth0LoginProps {
  /** Handler for navigation back to previous screen */
  onBack: () => void;
}

/**
 * Auth0Login component that provides secure authentication interface
 * 
 * Renders a styled login form with sign-up and sign-in options, comprehensive
 * error display, loading states, and navigation controls. Features modern
 * design with glassmorphism effects and full accessibility compliance.
 * 
 * @param props - Component props containing navigation handlers
 * @returns JSX element containing the complete authentication interface
 */
export default function Auth0Login({ onBack }: Auth0LoginProps) {
  const { login, signup, isLoading, error } = useAuth();

  /**
   * Handle authentication action with error prevention
   */
  const handleAuthAction = (action: () => void) => {
    if (!isLoading) {
      action();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Back Button */}
        <button 
          onClick={onBack}
          disabled={isLoading}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mb-6 disabled:opacity-50"
          aria-label="Navigate back to home page"
        >
          <span aria-hidden="true">←</span>
          <span>Back to Home</span>
        </button>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-white font-bold text-2xl" aria-hidden="true">P</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to PagePersona AI
            </h1>
            <p className="text-gray-600">
              Sign in to start transforming your content with AI-powered personas
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div 
              className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
              role="alert"
              aria-live="polite"
            >
              <div className="flex items-start">
                <span className="text-red-500 mr-2" aria-hidden="true">⚠️</span>
                <div>
                  <h3 className="text-red-800 font-medium text-sm mb-1">Authentication Error</h3>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Authentication Actions */}
          <div className="space-y-4">
            {/* Sign Up Button */}
            <button
              onClick={() => handleAuthAction(signup)}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed shadow-lg"
              aria-label={isLoading ? 'Creating account...' : 'Create new account'}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" aria-hidden="true"></div>
                  Creating Account...
                </div>
              ) : (
                <>
                  <span className="mr-2" aria-hidden="true">🚀</span>
                  Sign Up - Get Started Free
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              onClick={() => handleAuthAction(login)}
              disabled={isLoading}
              className="w-full bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 px-6 rounded-lg border border-gray-300 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed shadow-md"
              aria-label={isLoading ? 'Signing in...' : 'Sign in to existing account'}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" aria-hidden="true"></div>
                  Signing In...
                </div>
              ) : (
                <>
                  <span className="mr-2" aria-hidden="true">🔑</span>
                  Sign In to Existing Account
                </>
              )}
            </button>
          </div>

          {/* Footer Information */}
          <div className="mt-8">
            {/* Security Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <span className="text-blue-500 mr-2" aria-hidden="true">🔒</span>
                <div>
                  <h4 className="text-blue-800 font-medium text-sm mb-1">Secure Authentication</h4>
                  <p className="text-blue-700 text-xs">
                    Your data is protected with industry-standard encryption and Auth0 security.
                  </p>
                </div>
              </div>
            </div>

            {/* Terms and Privacy */}
            <div className="text-center text-sm text-gray-500">
              <p>
                By continuing, you agree to our{' '}
                <a 
                  href="/terms" 
                  className="text-purple-600 hover:text-purple-800 hover:underline transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms of Service
                </a>
                {' '}and{' '}
                <a 
                  href="/privacy" 
                  className="text-purple-600 hover:text-purple-800 hover:underline transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Additional Help */}
        <div className="text-center mt-6">
          <p className="text-gray-600 text-sm">
            Need help?{' '}
            <a 
              href="mailto:support@pagepersona.ai" 
              className="text-purple-600 hover:text-purple-800 hover:underline transition-colors"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
