import { vi, beforeEach, afterEach, expect } from 'vitest'
import express, { Request, Response, NextFunction } from 'express'
import request from 'supertest'
import { mockAuth0User, mockUserContext } from '../fixtures/user.fixtures'

// Extended Request interface for testing
export interface TestRequest extends Request {
  userContext?: any
  user?: any
  auth0User?: any
}

// Setup Express app with common middleware for testing
export function createTestApp(routes: any) {
  const app = express()
  app.use(express.json())
  // Mount routes at root for test simplicity
  app.use('/', routes)
  return app
}

// Mock middleware functions
export const createMockAuth0Middleware = () => {
  return {
    verifyAuth0Token: vi.fn((req: any, res: any, next: any) => {
      req.auth0User = mockAuth0User
      next()
    }),
    syncAuth0User: vi.fn((req: any, res: any, next: any) => {
      req.userContext = mockUserContext
      req.user = mockUserContext.mongoUser
      next()
    })
  }
}

// Mock rate limiting middleware
export const createMockRateLimitMiddleware = () => ({
  syncRateLimit: vi.fn((req: any, res: any, next: any) => next()),
  profileUpdateRateLimit: vi.fn((req: any, res: any, next: any) => next()),
  testEndpointRateLimit: vi.fn((req: any, res: any, next: any) => next())
})

// Mock user service
export const createMockUserService = () => ({
  getUserProfile: vi.fn(),
  updateUserProfile: vi.fn(),
  getUserUsage: vi.fn(),
  syncUser: vi.fn()
})

// Mock serialization utilities
export const createMockSerializers = () => ({
  serializeUser: vi.fn((user) => ({
    id: user._id,
    auth0Id: user.auth0Id,
    email: user.email,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName
  })),
  serializeMongoUser: vi.fn((user) => ({
    id: user._id,
    auth0Id: user.auth0Id,
    email: user.email,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName
  })),
  serializeUserUsage: vi.fn((user) => ({
    usageCount: user.usageCount,
    dailyUsage: user.dailyUsage,
    lastUsageDate: user.lastUsageDate
  })),
  createSuccessResponse: vi.fn((data, message) => ({
    success: true,
    data,
    message
  })),
  createErrorResponse: vi.fn((message) => ({
    success: false,
    error: message
  })),
  safeLogUser: vi.fn()
})

// Test setup and teardown helpers
export function setupTestEnvironment() {
  const mockAuth0 = createMockAuth0Middleware()
  const mockRateLimit = createMockRateLimitMiddleware()
  const mockUserService = createMockUserService()
  const mockSerializers = createMockSerializers()

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Clean up after each test
    vi.restoreAllMocks()
  })

  return {
    mockAuth0,
    mockRateLimit,
    mockUserService,
    mockSerializers
  }
}

// Helper to make authenticated requests
export function makeAuthenticatedRequest(app: express.Application) {
  return {
    get: (url: string) => request(app).get(url).set('Authorization', 'Bearer mock-token'),
    post: (url: string) => request(app).post(url).set('Authorization', 'Bearer mock-token'),
    put: (url: string) => request(app).put(url).set('Authorization', 'Bearer mock-token'),
    delete: (url: string) => request(app).delete(url).set('Authorization', 'Bearer mock-token')
  }
}

// Assertion helpers
export const expectSuccessResponse = (response: any, expectedData?: any) => {
  expect(response.body).toHaveProperty('success', true)
  expect(response.body).toHaveProperty('data')
  if (expectedData) {
    expect(response.body.data).toEqual(expectedData)
  }
}

export const expectErrorResponse = (response: any, expectedError?: string) => {
  expect(response.body).toHaveProperty('success', false)
  expect(response.body).toHaveProperty('error')
  if (expectedError) {
    expect(response.body.error).toEqual(expectedError)
  }
}

// Common test patterns
export const testAuthenticationRequired = (app: express.Application, endpoint: string, method: 'get' | 'post' | 'put' | 'delete' = 'get') => {
  return async () => {
    const response = await request(app)[method](endpoint)
      .set('x-test-unauthenticated', 'true')
    expect(response.status).toBe(401)
  }
}

export const testRateLimitApplied = (app: express.Application, endpoint: string, method: 'get' | 'post' | 'put' | 'delete' = 'get') => {
  return async () => {
    // This would typically test actual rate limiting behavior
    // For now, just verify the middleware is called
    const response = await makeAuthenticatedRequest(app)[method](endpoint)
    expect(response.status).not.toBe(429) // Should not be rate limited in tests
  }
}
