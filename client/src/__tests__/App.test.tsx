/**
 * Test suite for the main App component
 *
 * This test suite verifies the proper rendering and behavior of the main
 * App component, including authentication state handling, routing logic,
 * and provider wrapping. Uses mocked dependencies for isolated testing.
 *
 * @module App.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';
import type { AuthContextType } from '../contexts/AuthContext';

// Mock all components
vi.mock('../providers/Auth0Provider', () => ({
  Auth0Provider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth0-provider">{children}</div>
  ),
}));

vi.mock('../hooks/useAuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
}));

vi.mock('../components/Transformer/TransformationPage', () => ({
  default: () => <div data-testid="page-transformer">PageTransformer</div>,
}));

vi.mock('../components/Landing/LandingPage', () => ({
  default: ({ isAuthenticated, userName }: { isAuthenticated?: boolean; userName?: string }) => (
    <div data-testid="landing-page">
      LandingPage - Auth: {String(isAuthenticated)} - User: {userName}
    </div>
  ),
}));

vi.mock('../components/auth/UserProfile', () => ({
  default: () => <div data-testid="user-profile">UserProfile</div>,
}));

vi.mock('../components/Transformer/ErrorBoundary', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  ),
}));

vi.mock('../components/Header', () => ({
  default: ({
    isAuthenticated,
    userName,
    onHome,
    onProfile,
    onTransform,
  }: {
    isAuthenticated: boolean;
    userName: string;
    onHome: () => void;
    onProfile: () => void;
    onTransform: () => void;
  }) => (
    <div data-testid="header">
      Header - Auth: {String(isAuthenticated)} - User: {userName}
      <button onClick={onHome} data-testid="home-btn">
        Home
      </button>
      <button onClick={onProfile} data-testid="profile-btn">
        Profile
      </button>
      <button onClick={onTransform} data-testid="transform-btn">
        Transform
      </button>
    </div>
  ),
}));

vi.mock('../components/Footer', () => ({
  default: () => <div data-testid="footer">Footer</div>,
}));

const mockUseAuth = vi.hoisted(() => vi.fn());
vi.mock('../hooks/useAuthContext', () => ({
  useAuth: mockUseAuth,
}));

describe('App', () => {
  const mockLogin = vi.fn();
  const mockSignup = vi.fn();
  const mockLogout = vi.fn();
  const mockGetAccessToken = vi.fn();
  const mockRefreshUserProfile = vi.fn();
  const mockGetCustomClaims = vi.fn();

  const createMockAuthContext = (overrides: Partial<AuthContextType> = {}): AuthContextType => ({
    user: null,
    userProfile: null,
    isAuthenticated: false,
    isLoading: false,
    isSyncing: false,
    error: null,
    login: mockLogin,
    logout: mockLogout,
    signup: mockSignup,
    getAccessToken: mockGetAccessToken,
    refreshUserProfile: mockRefreshUserProfile,
    isNewUser: null,
    isFirstLogin: null,
    profileSyncError: null,
    getCustomClaims: mockGetCustomClaims,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state', () => {
    mockUseAuth.mockReturnValue(
      createMockAuthContext({
        isLoading: true,
      }),
    );

    render(<App />);

    expect(screen.getByText('Loading PagePersonAI...')).toBeInTheDocument();
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
  });

  it('should render landing page when not authenticated', async () => {
    mockUseAuth.mockReturnValue(createMockAuthContext());

    render(<App />);

    expect(screen.getByTestId('header')).toBeInTheDocument();
    // Wait for lazy-loaded landing page to render
    await waitFor(() => {
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByText(/Auth: false/)).toBeInTheDocument();
  });

  it('should render authenticated landing page with user name', () => {
    const mockUser = {
      given_name: 'John',
      family_name: 'Doe',
      email: 'john@example.com',
    };

    mockUseAuth.mockReturnValue(
      createMockAuthContext({
        user: mockUser,
        isAuthenticated: true,
      }),
    );

    render(<App />);

    expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    expect(screen.getByTestId('landing-page')).toHaveTextContent('Auth: true');
    expect(screen.getByTestId('landing-page')).toHaveTextContent('User: John Doe');
  });

  it('should handle user name fallbacks correctly', () => {
    const mockUser = {
      name: 'Jane Smith',
      email: 'jane@example.com',
    };

    mockUseAuth.mockReturnValue(
      createMockAuthContext({
        user: mockUser,
        isAuthenticated: true,
      }),
    );

    render(<App />);

    expect(screen.getByTestId('landing-page')).toHaveTextContent('User: Jane Smith');
  });

  it('should use email fallback when no name available', () => {
    const mockUser = {
      email: 'test@example.com',
    };

    mockUseAuth.mockReturnValue(
      createMockAuthContext({
        user: mockUser,
        isAuthenticated: true,
      }),
    );

    render(<App />);

    expect(screen.getByTestId('landing-page')).toHaveTextContent('User: test');
  });

  it('should wrap content with providers', () => {
    mockUseAuth.mockReturnValue(createMockAuthContext());

    render(<App />);

    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
    expect(screen.getByTestId('auth0-provider')).toBeInTheDocument();
  });
});
