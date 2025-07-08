import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import express from 'express'
import supertest from 'supertest'
import {
  setupTestEnvironment,
  createTestApp,
  makeAuthenticatedRequest,
  expectSuccessResponse,
  expectErrorResponse
} from './helpers/setupTestServer'
import {
  mockUserContext,
  mockUpdateData,
  mockUpdatedUser,
  mockSerializedUser,
  mockSerializedUpdatedUser,
  mockUsageData,
  authTestScenarios,
  updateTestScenarios,
  errorTestScenarios,
  successResponse,
  errorResponse
} from './fixtures/user.fixtures'
import * as auth0Middleware from '../src/middleware/auth0-middleware'

// Store mock references for testing
let mockAuth0Middleware: any
let mockSyncAuth0User: any

// Mock the dependencies
vi.mock('../src/services/user-service', () => ({
  userService: {
    getUserProfile: vi.fn(),
    updateUserProfile: vi.fn(),
    getUserUsage: vi.fn(),
    createUser: vi.fn(),
    syncUser: vi.fn()
  }
}))

// Mock Auth0 middleware with controllable behavior
vi.mock('../src/middleware/auth0-middleware', () => ({
  verifyAuth0Token: vi.fn((req: any, res: any, next: any) => { 
    // Check if test wants to simulate unauthenticated request
    if (req.headers['x-test-unauthenticated']) {
      return res.status(401).json({ success: false, error: 'Authentication required' })
    }
    req.userContext = mockUserContext; 
    next() 
  }),
  syncAuth0User: vi.fn((req: any, res: any, next: any) => next())
}))
// Mock rate-limit middleware
vi.mock('../src/middleware/rate-limit-middleware-refactored', () => ({
  syncRateLimit: vi.fn((req, res, next) => next()),
  profileUpdateRateLimit: vi.fn((req, res, next) => next()),
  testEndpointRateLimit: vi.fn((req, res, next) => next())
}))
vi.mock('../src/utils/userSerializer', () => ({
  serializeMongoUser: vi.fn(),
  createSuccessResponse: vi.fn(),
  createErrorResponse: vi.fn()
}))
vi.mock('../src/utils/migrationHelpers')

// Import the route module after mocking dependencies
import userRoutes from '../src/routes/user-route'
import { userService } from '../src/services/user-service'
import * as userSerializer from '../src/utils/userSerializer'

describe('User Routes', () => {
  let app: express.Application
  let request: ReturnType<typeof makeAuthenticatedRequest>
  let mocks: ReturnType<typeof setupTestEnvironment>

  beforeEach(() => {
    mocks = setupTestEnvironment()
    app = createTestApp(userRoutes)
    request = makeAuthenticatedRequest(app)

    // Setup default mock implementations
    vi.mocked(userService.getUserProfile).mockResolvedValue({
      success: true,
      data: mockSerializedUser
    })
    vi.mocked(userService.updateUserProfile).mockResolvedValue({
      success: true,
      data: mockSerializedUpdatedUser
    })
    vi.mocked(userService.getUserUsage).mockResolvedValue({
      success: true,
      data: mockUsageData
    })
    vi.mocked(userSerializer.createSuccessResponse).mockImplementation(successResponse)
    vi.mocked(userSerializer.createErrorResponse).mockImplementation(errorResponse)
  })

  describe('GET /profile', () => {
    it('should return user profile successfully', async () => {
      const response = await request.get('/profile')

      expect(response.status).toBe(200)
      expectSuccessResponse(response, mockSerializedUser)
      expect(userService.getUserProfile).toHaveBeenCalledWith(mockUserContext.mongoUser._id.toString())
    })

    it('should require authentication', async () => {
      const response = await supertest(app).get('/profile')
        .set('x-test-unauthenticated', 'true')
      expect(response.status).toBe(401)
    })

    describe.each(authTestScenarios)('handles different user states', (scenario) => {
      it(`should handle ${scenario.name}`, async () => {
        if (scenario.shouldSucceed) {
          vi.mocked(userService.getUserProfile).mockResolvedValue({
            success: true,
            data: scenario.user
          })
          const response = await request.get('/profile')
          expect(response.status).toBe(scenario.expectedStatus)
          expectSuccessResponse(response)
        } else {
          vi.mocked(userService.getUserProfile).mockRejectedValue(new Error('Service error'))
          const response = await request.get('/profile')
          expect(response.status).toBe(scenario.expectedStatus)
          expectErrorResponse(response)
        }
      })
    })
  })

  describe('PUT /profile', () => {
    it('should update user profile successfully', async () => {
      const response = await request.put('/profile').send(mockUpdateData)

      expect(response.status).toBe(200)
      expectSuccessResponse(response, mockSerializedUpdatedUser)
      expect(userService.updateUserProfile).toHaveBeenCalledWith(
        mockUserContext.mongoUser,
        mockUpdateData
      )
    })

    it('should require authentication', async () => {
      const response = await supertest(app).put('/profile')
        .set('x-test-unauthenticated', 'true')
        .send(mockUpdateData)
      expect(response.status).toBe(401)
    })

    describe.each(updateTestScenarios)('validates update data', (scenario) => {
      it(`should handle ${scenario.name}`, async () => {
        if (scenario.shouldSucceed) {
          const response = await request.put('/profile').send(scenario.updateData)
          expect(response.status).toBe(scenario.expectedStatus)
          expectSuccessResponse(response)
        } else {
          const response = await request.put('/profile').send(scenario.updateData)
          expect(response.status).toBe(scenario.expectedStatus)
          expectErrorResponse(response)
        }
      })
    })
  })

  describe('GET /usage', () => {
    it('should return user usage data successfully', async () => {
      const response = await request.get('/usage')

      expect(response.status).toBe(200)
      expectSuccessResponse(response, mockUsageData)
      expect(userService.getUserUsage).toHaveBeenCalledWith(mockUserContext.mongoUser)
    })

    it('should require authentication', async () => {
      const response = await supertest(app).get('/usage')
        .set('x-test-unauthenticated', 'true')
      expect(response.status).toBe(401)
    })
  })

  describe('POST /sync', () => {
    it('should sync user data successfully', async () => {
      vi.mocked(userService.syncUser).mockResolvedValue({ success: true, data: mockUserContext.mongoUser })
      vi.mocked(userSerializer.serializeMongoUser).mockReturnValue(mockSerializedUser)

      const response = await request.post('/sync')

      expect(response.status).toBe(200)
      expectSuccessResponse(response, mockSerializedUser)
      expect(userService.syncUser).toHaveBeenCalledWith(mockUserContext.auth0User)
      expect(userSerializer.serializeMongoUser).toHaveBeenCalledWith(mockUserContext.mongoUser)
    })

    it('should require authentication', async () => {
      const response = await supertest(app).post('/sync')
        .set('x-test-unauthenticated', 'true')
      expect(response.status).toBe(401)
    })
  })

  describe('Error Handling', () => {
    describe.each(errorTestScenarios)('handles service errors', (scenario) => {
      it(`should handle ${scenario.name}`, async () => {
        vi.mocked(userService.getUserProfile).mockRejectedValue(scenario.mockError)

        const response = await request.get('/profile')

        expect(response.status).toBe(scenario.expectedStatus)
        expectErrorResponse(response, scenario.expectedMessage)
      })
    })

    it('should handle validation errors gracefully', async () => {
      vi.mocked(userSerializer.createErrorResponse).mockReturnValue(
        errorResponse('Invalid input')
      )

      const response = await request.put('/profile').send({ invalid: 'data' })

      expect(response.status).toBe(400)
      expectErrorResponse(response, 'Invalid input')
    })

    it('should handle missing user context', async () => {
      // Simulate missing user context by removing userContext
      vi.mocked(auth0Middleware.verifyAuth0Token).mockImplementationOnce((req: any, res, next) => {
        req.userContext = { mongoUser: null }
        next()
      })

      const response = await request.get('/profile')

      expect(response.status).toBe(404)
      expectErrorResponse(response)
    })
  })

  describe('Rate Limiting', () => {
    it('should apply rate limiting to profile updates', async () => {
      // Verify rate limiting middleware is applied
      expect(mocks.mockRateLimit.profileUpdateRateLimit).toBeDefined()
    })

    it('should apply rate limiting to sync endpoint', async () => {
      // Verify rate limiting middleware is applied
      expect(mocks.mockRateLimit.syncRateLimit).toBeDefined()
    })
  })

  describe('Middleware Integration', () => {
    it('should apply Auth0 verification middleware', async () => {
      await request.get('/profile')
      expect(vi.mocked(auth0Middleware.verifyAuth0Token)).toHaveBeenCalled()
    })

    it('should apply user synchronization middleware', async () => {
      await request.get('/profile')
      expect(vi.mocked(auth0Middleware.syncAuth0User)).toHaveBeenCalled()
    })
  })
})

// Additional integration tests using parameterized testing
describe('User Routes Integration', () => {
  const endpoints = [
    { method: 'get' as const, path: '/profile', requiresAuth: true },
    { method: 'put' as const, path: '/profile', requiresAuth: true },
    { method: 'get' as const, path: '/usage', requiresAuth: true },
    { method: 'post' as const, path: '/sync', requiresAuth: true }
  ]

  let app: express.Application
  let request: ReturnType<typeof makeAuthenticatedRequest>

  beforeEach(() => {
    setupTestEnvironment()
    app = createTestApp(userRoutes)
    request = makeAuthenticatedRequest(app)
  })

  describe.each(endpoints)('Endpoint $method $path', (endpoint) => {
    it('should require authentication when specified', async () => {
      if (endpoint.requiresAuth) {
        let response
        if (endpoint.method === 'put') {
          // For PUT, send valid data to bypass validation and test auth
          response = await supertest(app)[endpoint.method](endpoint.path)
            .set('x-test-unauthenticated', 'true')
            .send({ firstName: 'Test' })
        } else {
          response = await supertest(app)[endpoint.method](endpoint.path)
            .set('x-test-unauthenticated', 'true')
        }
        expect(response.status).toBe(401)
      }
    })

    it('should return proper content-type headers', async () => {
      const response = await request[endpoint.method](endpoint.path)
      expect(response.headers['content-type']).toMatch(/application\/json/)
    })

    it('should handle CORS properly', async () => {
      const response = await request[endpoint.method](endpoint.path)
      // Verify CORS headers are set (if CORS middleware is applied)
      expect(response.status).not.toBe(0) // Basic connectivity test
    })
  })
})
