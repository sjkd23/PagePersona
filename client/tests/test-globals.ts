import { vi } from 'vitest'

// Mock fetch globally for tests
global.fetch = vi.fn()

// Mock Auth0 React SDK
vi.mock('@auth0/auth0-react', () => ({
  useAuth0: vi.fn(() => ({
    isLoading: false,
    isAuthenticated: false,
    user: null,
    error: null,
    loginWithRedirect: vi.fn(),
    logout: vi.fn(),
    getAccessTokenSilently: vi.fn(),
    getAccessTokenWithPopup: vi.fn(),
    getIdTokenClaims: vi.fn(),
    loginWithPopup: vi.fn(),
    handleRedirectCallback: vi.fn()
  })),
  Auth0Provider: ({ children }: { children: React.ReactNode }) => children,
  withAuthenticationRequired: (component: React.ComponentType) => component
}))

// Mock environment variables
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000'
  },
  writable: true
})

// Default environment setup
process.env.VITE_API_BASE_URL = 'http://localhost:5000'
process.env.VITE_AUTH0_DOMAIN = 'test-domain.auth0.com'
process.env.VITE_AUTH0_CLIENT_ID = 'test-client-id'
