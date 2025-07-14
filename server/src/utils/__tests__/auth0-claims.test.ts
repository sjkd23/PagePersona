import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  safeGetAuth0Claims,
  safeGetCustomClaims,
  safeGetEmail,
  safeGetDisplayName,
  validateAuth0User,
  debugAuth0Claims,
} from '../auth0-claims'
import type { Auth0JwtPayload } from '../../types/common'

// Mock the logger
vi.mock('../logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }
}))

// Import the mocked logger
import { logger } from '../logger'

// Mock environment variables
const mockEnv = {
  AUTH0_CUSTOM_USER_ID_CLAIM: 'https://test.com/user_id',
  AUTH0_ROLES_CLAIM: 'https://test.com/roles',
  AUTH0_PERMISSIONS_CLAIM: 'https://test.com/permissions',
  AUTH0_DOMAIN: 'test.auth0.com',
  NODE_ENV: 'test',
}

// Set environment variables before any imports
Object.assign(process.env, mockEnv)

// Mock console methods (for any remaining console calls)
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

describe('auth0-claims', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConsoleLog.mockClear()
    mockConsoleError.mockClear()
  })

  const createMockAuth0User = (overrides: Partial<Auth0JwtPayload> = {}): Auth0JwtPayload => ({
    sub: 'auth0|123456789',
    email: 'test@example.com',
    email_verified: true,
    name: 'Test User',
    given_name: 'Test',
    family_name: 'User',
    nickname: 'testuser',
    picture: 'https://example.com/avatar.png',
    locale: 'en',
    updated_at: '2023-01-01T00:00:00Z',
    iss: 'https://test.auth0.com/',
    aud: 'test-audience',
    iat: 1640995200,
    exp: 1641081600,
    ...overrides,
  })

  describe('safeGetAuth0Claims', () => {
    it('should extract standard claims correctly', () => {
      const auth0User = createMockAuth0User()
      const claims = safeGetAuth0Claims(auth0User)

      expect(claims).toEqual({
        sub: 'auth0|123456789',
        email: 'test@example.com',
        emailVerified: true,
        name: 'Test User',
        givenName: 'Test',
        familyName: 'User',
        nickname: 'testuser',
        picture: 'https://example.com/avatar.png',
        locale: 'en',
        updatedAt: '2023-01-01T00:00:00Z',
      })
    })

    it('should handle missing optional claims', () => {
      const auth0User = createMockAuth0User({
        email: undefined,
        email_verified: undefined,
        name: undefined,
        given_name: undefined,
        family_name: undefined,
        nickname: undefined,
        picture: undefined,
        locale: undefined,
        updated_at: undefined,
      })

      const claims = safeGetAuth0Claims(auth0User)

      expect(claims.sub).toBe('auth0|123456789')
      expect(claims.email).toBeUndefined()
      expect(claims.emailVerified).toBe(false) // Boolean conversion of undefined
      expect(claims.name).toBeUndefined()
    })

    it('should throw error for missing auth0User', () => {
      expect(() => safeGetAuth0Claims(null as any)).toThrow('Auth0 user object is required')
    })

    it('should throw error for missing sub claim', () => {
      const auth0User = createMockAuth0User({ sub: undefined as any })
      expect(() => safeGetAuth0Claims(auth0User)).toThrow('Auth0 sub claim is missing - invalid JWT token')
    })

    it('should convert emailVerified to boolean', () => {
      const auth0User1 = createMockAuth0User({ email_verified: 'true' as any })
      const auth0User2 = createMockAuth0User({ email_verified: 0 as any })
      const auth0User3 = createMockAuth0User({ email_verified: null as any })

      expect(safeGetAuth0Claims(auth0User1).emailVerified).toBe(true)
      expect(safeGetAuth0Claims(auth0User2).emailVerified).toBe(false)
      expect(safeGetAuth0Claims(auth0User3).emailVerified).toBe(false)
    })
  })

  describe('safeGetCustomClaims', () => {
    it('should extract custom claims correctly', () => {
      const auth0User = createMockAuth0User({
        'https://test.com/user_id': 'custom-123',
        'https://test.com/roles': ['admin', 'user'],
        'https://test.com/permissions': ['read', 'write'],
      })

      const customClaims = safeGetCustomClaims(auth0User)

      expect(customClaims).toEqual({
        customUserId: 'custom-123',
        roles: ['admin', 'user'],
        permissions: ['read', 'write'],
      })
    })

    it('should provide defaults for missing custom claims', () => {
      const auth0User = createMockAuth0User()
      const customClaims = safeGetCustomClaims(auth0User)

      expect(customClaims).toEqual({
        customUserId: undefined,
        roles: [],
        permissions: [],
      })
    })

    it('should handle null auth0User', () => {
      const customClaims = safeGetCustomClaims(null as any)
      expect(customClaims).toEqual({})
    })
  })

  describe('safeGetEmail', () => {
    it('should return standard email claim', () => {
      const auth0User = createMockAuth0User()
      const email = safeGetEmail(auth0User)
      expect(email).toBe('test@example.com')
    })

    it('should fallback to sub if it looks like email', () => {
      const auth0User = createMockAuth0User({
        email: undefined,
        sub: 'user@domain.com',
      })
      const email = safeGetEmail(auth0User)
      expect(email).toBe('user@domain.com')
    })

    it('should not use auth0| sub as email', () => {
      const auth0User = createMockAuth0User({
        email: undefined,
        sub: 'auth0|123@fake.com',
      })
      const email = safeGetEmail(auth0User)
      expect(email).toBeNull()
    })

    it('should fallback to environment-specific email claim', () => {
      const auth0User = createMockAuth0User({
        email: undefined,
        sub: 'auth0|123',
        'test.auth0.com/email': 'env@example.com',
      })
      const email = safeGetEmail(auth0User)
      expect(email).toBe('env@example.com')
    })

    it('should validate email format', () => {
      const auth0User = createMockAuth0User({
        email: 'not-an-email',
      })
      const email = safeGetEmail(auth0User)
      expect(email).toBeNull()
    })

    it('should return null for null auth0User', () => {
      expect(safeGetEmail(null as any)).toBeNull()
    })
  })

  describe('safeGetDisplayName', () => {
    it('should return name when available', () => {
      const auth0User = createMockAuth0User()
      const displayName = safeGetDisplayName(auth0User)
      expect(displayName).toBe('Test User')
    })

    it('should combine given and family names', () => {
      const auth0User = createMockAuth0User({
        name: undefined,
        given_name: 'John',
        family_name: 'Doe',
      })
      const displayName = safeGetDisplayName(auth0User)
      expect(displayName).toBe('John Doe')
    })

    it('should use only given name if family name missing', () => {
      const auth0User = createMockAuth0User({
        name: undefined,
        given_name: 'John',
        family_name: undefined,
      })
      const displayName = safeGetDisplayName(auth0User)
      expect(displayName).toBe('John')
    })

    it('should fallback to nickname', () => {
      const auth0User = createMockAuth0User({
        name: undefined,
        given_name: undefined,
        family_name: undefined,
        nickname: 'johndoe',
      })
      const displayName = safeGetDisplayName(auth0User)
      expect(displayName).toBe('johndoe')
    })

    it('should use email username as fallback', () => {
      const auth0User = createMockAuth0User({
        name: undefined,
        given_name: undefined,
        family_name: undefined,
        nickname: undefined,
        email: 'username@domain.com',
      })
      const displayName = safeGetDisplayName(auth0User)
      expect(displayName).toBe('username')
    })

    it('should format auth0 sub nicely', () => {
      const auth0User = createMockAuth0User({
        name: undefined,
        given_name: undefined,
        family_name: undefined,
        nickname: undefined,
        email: undefined,
        sub: 'auth0|123456789abcdef',
      })
      const displayName = safeGetDisplayName(auth0User)
      expect(displayName).toBe('User abcdef')
    })

    it('should truncate long non-auth0 subs', () => {
      const auth0User = createMockAuth0User({
        name: undefined,
        given_name: undefined,
        family_name: undefined,
        nickname: undefined,
        email: undefined,
        sub: 'very-long-identifier-that-should-be-truncated',
      })
      const displayName = safeGetDisplayName(auth0User)
      expect(displayName).toBe('very-long-identifie')
    })

    it('should return "Anonymous User" for null auth0User', () => {
      const displayName = safeGetDisplayName(null as any)
      expect(displayName).toBe('Anonymous User')
    })
  })

  describe('validateAuth0User', () => {
    it('should validate correct auth0User', () => {
      const auth0User = createMockAuth0User()
      const result = validateAuth0User(auth0User)

      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should detect null/undefined auth0User', () => {
      const result1 = validateAuth0User(null as any)
      const result2 = validateAuth0User(undefined as any)

      expect(result1.isValid).toBe(false)
      expect(result1.errors).toContain('Auth0 user object is null or undefined')
      expect(result2.isValid).toBe(false)
      expect(result2.errors).toContain('Auth0 user object is null or undefined')
    })

    it('should detect non-object auth0User', () => {
      const result = validateAuth0User('not-an-object' as any)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Auth0 user is not an object')
    })

    it('should detect missing sub claim', () => {
      const auth0User = createMockAuth0User({ sub: undefined as any })
      const result = validateAuth0User(auth0User)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Missing required "sub" claim')
    })

    it('should detect non-string sub claim', () => {
      const auth0User = createMockAuth0User({ sub: 123 as any })
      const result = validateAuth0User(auth0User)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Sub claim must be a string')
    })

    it('should detect invalid email format', () => {
      const auth0User = createMockAuth0User({ email: 'not-an-email' })
      const result = validateAuth0User(auth0User)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Email claim is present but invalid format')
    })
  })

  describe('debugAuth0Claims', () => {
    it('should log debug information in non-production environment', () => {
      const auth0User = createMockAuth0User()
      debugAuth0Claims(auth0User, 'user-123')

      expect(logger.debug).toHaveBeenCalledWith('Auth0 Claims Debug for user user-123:')
      expect(logger.debug).toHaveBeenCalledWith('Standard Claims:', { claims: expect.any(Object) })
      expect(logger.debug).toHaveBeenCalledWith('Custom Claims:', { claims: expect.any(Object) })
      expect(logger.debug).toHaveBeenCalledWith('Safe Email:', { email: 'test@example.com' })
      expect(logger.debug).toHaveBeenCalledWith('Display Name:', { displayName: 'Test User' })
    })

    it('should not log in production environment', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const auth0User = createMockAuth0User()
      debugAuth0Claims(auth0User)

      expect(mockConsoleLog).not.toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
    })

    it('should handle debug errors gracefully', () => {
      const invalidAuth0User = null as any
      debugAuth0Claims(invalidAuth0User)

      expect(logger.error).toHaveBeenCalledWith(
        'Error debugging Auth0 claims:',
        expect.any(Error)
      )
    })

    it('should identify unknown claims', () => {
      const auth0User = createMockAuth0User({
        'unknown-claim': 'unknown-value',
        'another-unknown': 'another-value',
      })
      debugAuth0Claims(auth0User)

      expect(logger.debug).toHaveBeenCalledWith(
        'Unknown Claims:',
        { claims: expect.arrayContaining([
          'unknown-claim: unknown-value',
          'another-unknown: another-value',
        ]) }
      )
    })

    it('should work without userId parameter', () => {
      const auth0User = createMockAuth0User()
      debugAuth0Claims(auth0User)

      expect(logger.debug).toHaveBeenCalledWith('Auth0 Claims Debug:')
    })
  })
})
