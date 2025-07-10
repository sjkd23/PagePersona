import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock environment variables
const mockEnv = {
  VITE_AUTH0_DOMAIN: 'test.auth0.com',
  VITE_AUTH0_CLIENT_ID: 'test-client-id',
  VITE_AUTH0_AUDIENCE: 'https://api.test.com',
}

// Mock import.meta.env
vi.stubGlobal('importMeta', {
  env: mockEnv,
})

Object.defineProperty(import.meta, 'env', {
  value: mockEnv,
  writable: true,
})

// Mock window.location
const mockLocation = {
  origin: 'https://app.test.com',
  href: 'https://app.test.com/',
  protocol: 'https:',
  host: 'app.test.com',
  hostname: 'app.test.com',
  port: '',
  pathname: '/',
  search: '',
  hash: '',
}

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

describe('auth config', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should export auth0 domain from environment', async () => {
    const { domain } = await import('../auth')
    expect(domain).toBe('dev-hnoh845pekh6xkbd.us.auth0.com')
  })

  it('should export auth0 client ID from environment', async () => {
    const { clientId } = await import('../auth')
    expect(clientId).toBe('wRe1XsXoWeRCpEy526K8yLzGoWKhjlLt')
  })

  it('should export auth0 audience from environment', async () => {
    const { audience } = await import('../auth')
    expect(audience).toBe('https://pagepersonai.dev/api')
  })

  it('should export redirect URI from window location origin', async () => {
    const { redirectUri } = await import('../auth')
    expect(redirectUri).toBe('https://app.test.com')
  })
})
