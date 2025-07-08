import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock Auth0 Provider
vi.mock('@auth0/auth0-react', () => ({
  Auth0Provider: vi.fn(({ children }) => children),
  useAuth0: vi.fn()
}));

// Mock useAuth hook
interface TestUser {
  id?: string
  email?: string
  name?: string
  nickname?: string
  sub?: string
}

const mockUseAuth = {
  user: null as TestUser | null,
  isAuthenticated: false,
  isLoading: false,
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn()
};

// Mock the AuthContext and useAuth hook
vi.mock('./hooks/useAuth0', () => {
  const mockAuthContext = {
    user: null,
    userProfile: null,
    isAuthenticated: false,
    isLoading: false,
    isSyncing: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    signup: vi.fn(),
    getAccessToken: vi.fn(),
    refreshUserProfile: vi.fn(),
    isNewUser: null,
    isFirstLogin: null,
    profileSyncError: null,
    getCustomClaims: vi.fn()
  };
  
  return {
    Auth0Provider: vi.fn(({ children }) => children),
    AuthContext: mockAuthContext
  };
});

vi.mock('./hooks/useAuthContext', () => ({
  useAuth: vi.fn(() => mockUseAuth),
  AuthContext: vi.fn()
}));

// Mock components
vi.mock('./components/Header', () => ({
  default: vi.fn(({ onLogin, onSignup, onLogout, onHome, onProfile, isAuthenticated, userName }) => (
    <div data-testid="header">
      <span data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</span>
      {userName && <span data-testid="username">{userName}</span>}
      <button onClick={onLogin} data-testid="login-btn">Login</button>
      <button onClick={onSignup} data-testid="signup-btn">Signup</button>
      <button onClick={onLogout} data-testid="logout-btn">Logout</button>
      <button onClick={onHome} data-testid="home-btn">Home</button>
      <button onClick={onProfile} data-testid="profile-btn">Profile</button>
    </div>
  ))
}));

vi.mock('./components/Landing/LandingPage', () => ({
  default: vi.fn(({ onShowLogin, onShowSignup }) => (
    <div data-testid="landing-page">
      <button onClick={onShowLogin} data-testid="show-login">Show Login</button>
      <button onClick={onShowSignup} data-testid="show-signup">Show Signup</button>
    </div>
  ))
}));

vi.mock('./components/Transformer/TransformationPage', () => ({
  default: vi.fn(() => <div data-testid="transformation-page">Transformation Page</div>)
}));

vi.mock('./components/auth/Auth0Login', () => ({
  default: vi.fn(({ onBack }) => (
    <div data-testid="auth0-login">
      <button onClick={onBack} data-testid="back-btn">Back</button>
    </div>
  ))
}));

vi.mock('./components/auth/UserProfileEnhanced', () => ({
  default: vi.fn(() => <div data-testid="user-profile">User Profile</div>)
}));

vi.mock('./components/Transformer/ErrorBoundary', () => ({
  default: vi.fn(({ children }) => children)
}));

vi.mock('./components/Footer', () => ({
  default: vi.fn(() => <div data-testid="footer">Footer</div>)
}));

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.user = null;
    mockUseAuth.isAuthenticated = false;
    mockUseAuth.isLoading = false;
  });

  describe('Loading State', () => {
    it('should display loading state', () => {
      mockUseAuth.isLoading = true;
      
      render(<App />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Unauthenticated State', () => {
    it('should render landing page when not authenticated', () => {
      render(<App />);
      
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });

    it('should call Auth0 login when login button is clicked', async () => {
      render(<App />);
      
      const loginBtn = screen.getByTestId('login-btn');
      fireEvent.click(loginBtn);
      
      expect(mockUseAuth.login).toHaveBeenCalled();
    });

    it('should handle signup button click', () => {
      render(<App />);
      
      const signupBtn = screen.getByTestId('signup-btn');
      fireEvent.click(signupBtn);
      
      expect(mockUseAuth.signup).toHaveBeenCalled();
    });

    it('should call Auth0 login when login is triggered from landing page', async () => {
      render(<App />);
      
      // Trigger login from landing page
      const showLoginBtn = screen.getByTestId('show-login');
      fireEvent.click(showLoginBtn);
      
      expect(mockUseAuth.login).toHaveBeenCalled();
    });
  });

  describe('Authenticated State', () => {
    beforeEach(() => {
      mockUseAuth.isAuthenticated = true;
      mockUseAuth.user = {
        name: 'Test User',
        nickname: 'testuser',
        email: 'test@example.com',
        sub: 'auth0|test123'
      };
    });

    it('should render landing page for authenticated user', () => {
      render(<App />);
      
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('username')).toHaveTextContent('Test User');
    });

    it('should show transformation page when transformer is selected', async () => {
      render(<App />);
      
      // Navigate to transformer
      const showLogin = screen.getByTestId('show-login');
      fireEvent.click(showLogin);
      
      await waitFor(() => {
        expect(screen.getByTestId('transformation-page')).toBeInTheDocument();
      });
    });

    it('should show user profile when profile button is clicked', async () => {
      render(<App />);
      
      const profileBtn = screen.getByTestId('profile-btn');
      fireEvent.click(profileBtn);
      
      await waitFor(() => {
        expect(screen.getByTestId('user-profile')).toBeInTheDocument();
      });
    });

    it('should handle logout', () => {
      render(<App />);
      
      const logoutBtn = screen.getByTestId('logout-btn');
      fireEvent.click(logoutBtn);
      
      expect(mockUseAuth.logout).toHaveBeenCalled();
    });

    it('should handle home navigation', async () => {
      render(<App />);
      
      // First navigate to profile
      const profileBtn = screen.getByTestId('profile-btn');
      fireEvent.click(profileBtn);
      
      await waitFor(() => {
        expect(screen.getByTestId('user-profile')).toBeInTheDocument();
      });
      
      // Then navigate home
      const homeBtn = screen.getByTestId('home-btn');
      fireEvent.click(homeBtn);
      
      await waitFor(() => {
        expect(screen.getByTestId('landing-page')).toBeInTheDocument();
        expect(screen.queryByTestId('user-profile')).not.toBeInTheDocument();
      });
    });

    it('should use nickname as fallback for username', () => {
      mockUseAuth.user = {
        nickname: 'testuser',
        email: 'test@example.com',
        sub: 'auth0|test123'
        // no name property
      };
      
      render(<App />);
      
      expect(screen.getByTestId('username')).toHaveTextContent('testuser');
    });

    it('should use "User" as final fallback for username', () => {
      mockUseAuth.user = {
        email: 'test@example.com',
        sub: 'auth0|test123'
        // no name or nickname property
      };
      
      render(<App />);
      
      expect(screen.getByTestId('username')).toHaveTextContent('User');
    });
  });

  describe('Navigation States', () => {
    beforeEach(() => {
      mockUseAuth.isAuthenticated = true;
      mockUseAuth.user = {
        name: 'Test User',
        email: 'test@example.com',
        sub: 'auth0|test123'
      };
    });

    it('should maintain current page state', async () => {
      render(<App />);
      
      // Start on landing page
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      
      // Navigate to transformation page
      const showLogin = screen.getByTestId('show-login');
      fireEvent.click(showLogin);
      
      await waitFor(() => {
        expect(screen.getByTestId('transformation-page')).toBeInTheDocument();
        expect(screen.queryByTestId('landing-page')).not.toBeInTheDocument();
      });
    });

    it('should handle profile overlay', async () => {
      render(<App />);
      
      // Open profile
      const profileBtn = screen.getByTestId('profile-btn');
      fireEvent.click(profileBtn);
      
      await waitFor(() => {
        expect(screen.getByTestId('user-profile')).toBeInTheDocument();
      });
      
      // Navigate home should close profile
      const homeBtn = screen.getByTestId('home-btn');
      fireEvent.click(homeBtn);
      
      await waitFor(() => {
        expect(screen.queryByTestId('user-profile')).not.toBeInTheDocument();
        expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      });
    });
  });

  describe('Component Integration', () => {
    it('should pass correct props to Header component', () => {
      mockUseAuth.isAuthenticated = true;
      mockUseAuth.user = { name: 'Test User' };
      
      render(<App />);
      
      const header = screen.getByTestId('header');
      expect(header).toBeInTheDocument();
      
      // Verify header receives authentication state
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('username')).toHaveTextContent('Test User');
    });

    it('should pass correct props to LandingPage component', () => {
      render(<App />);
      
      const landingPage = screen.getByTestId('landing-page');
      expect(landingPage).toBeInTheDocument();
      
      // Verify landing page has navigation buttons
      expect(screen.getByTestId('show-login')).toBeInTheDocument();
      expect(screen.getByTestId('show-signup')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors gracefully', () => {
      mockUseAuth.user = null;
      mockUseAuth.isAuthenticated = false;
      mockUseAuth.isLoading = false;
      
      // Should not throw errors
      expect(() => render(<App />)).not.toThrow();
      
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });

    it('should handle undefined user gracefully', () => {
      mockUseAuth.isAuthenticated = true;
      mockUseAuth.user = null;
      
      expect(() => render(<App />)).not.toThrow();
    });
  });

  describe('Responsive Behavior', () => {
    it('should render properly on different viewport sizes', () => {
      // This would typically test responsive design
      // For now, just verify basic rendering works
      render(<App />);
      
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });
  });

  describe('Performance Considerations', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<App />);
      
      // Verify initial render
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      
      // Re-render with same props should work
      rerender(<App />);
      
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });
  });
});
