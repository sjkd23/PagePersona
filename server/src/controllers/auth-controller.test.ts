import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Request, Response } from 'express'
import { getUser, getUserUsage, getUserSummary } from '../controllers/authController'
import { IMongoUser } from '../models/mongo-user'
import { logger } from '../utils/logger'
import { HttpStatus } from '../constants/http-status'
import type { AuthenticatedRequest } from '../types/common'

// Mock dependencies
vi.mock('../utils/logger')
vi.mock('../utils/userSerializer', () => ({
  serializeMongoUser: vi.fn(),
  serializeUserUsage: vi.fn(),
  serializeUserSummary: vi.fn(),
  createSuccessResponse: vi.fn(),
  createErrorResponse: vi.fn()
}))

describe('AuthController', () => {
  let mockRequest: Partial<AuthenticatedRequest>
  let mockResponse: Partial<Response>
  let mockUser: IMongoUser

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock user data
    mockUser = {
      _id: 'user123',
      auth0Id: 'auth0|123456789',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
      isEmailVerified: true,
      role: 'user',
      preferences: {
        theme: 'light',
        language: 'en',
        notifications: true
      },
      usage: {
        totalTransformations: 10,
        monthlyUsage: 5,
        lastTransformation: new Date(),
        usageResetDate: new Date()
      },
      createdAt: new Date(),
      updatedAt: new Date()
    } as IMongoUser

    // Mock request with user context
    mockRequest = {
      userContext: {
        mongoUser: mockUser,
        auth0User: {
          sub: 'auth0|123456789',
          email: 'test@example.com',
          name: 'John Doe'
        },
        userId: 'user123'
      }
    }

    // Mock response
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getUser', () => {
    it('should return user data successfully', async () => {
      // Arrange
      const { serializeMongoUser, createSuccessResponse } = await import('../utils/userSerializer')
      const serializedUser = {
        id: 'user123',
        email: 'test@example.com',
        username: 'johndoe',
        firstName: 'John',
        lastName: 'Doe',
        isEmailVerified: true,
        role: 'user',
        preferences: {
          theme: 'light',
          language: 'en',
          notifications: true
        }
      }

      vi.mocked(serializeMongoUser).mockReturnValue(serializedUser)
      vi.mocked(createSuccessResponse).mockReturnValue({
        success: true,
        data: { user: serializedUser }
      })

      // Act
      await getUser(mockRequest as AuthenticatedRequest, mockResponse as Response)

      // Assert
      expect(serializeMongoUser).toHaveBeenCalledWith(mockUser)
      expect(createSuccessResponse).toHaveBeenCalledWith({ user: serializedUser })
      expect(mockResponse.json).toHaveBeenCalled()
    })

    it('should handle missing user context', async () => {
      // Arrange
      const { createErrorResponse } = await import('../utils/userSerializer')
      mockRequest.userContext = undefined

      vi.mocked(createErrorResponse).mockReturnValue({
        success: false,
        error: 'User not found'
      })

      // Act
      await getUser(mockRequest as AuthenticatedRequest, mockResponse as Response)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND)
      expect(createErrorResponse).toHaveBeenCalledWith('User not found')
      expect(mockResponse.json).toHaveBeenCalled()
    })

    it('should handle missing mongo user', async () => {
      // Arrange
      const { createErrorResponse } = await import('../utils/userSerializer')
      mockRequest.userContext!.mongoUser = undefined as any

      vi.mocked(createErrorResponse).mockReturnValue({
        success: false,
        error: 'User not found'
      })

      // Act
      await getUser(mockRequest as AuthenticatedRequest, mockResponse as Response)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND)
      expect(createErrorResponse).toHaveBeenCalledWith('User not found')
    })

    it('should handle serialization errors', async () => {
      // Arrange
      const { serializeMongoUser, createErrorResponse } = await import('../utils/userSerializer')
      const error = new Error('Serialization failed')

      vi.mocked(serializeMongoUser).mockImplementation(() => {
        throw error
      })
      vi.mocked(createErrorResponse).mockReturnValue({
        success: false,
        error: 'Internal server error'
      })

      // Act
      await getUser(mockRequest as AuthenticatedRequest, mockResponse as Response)

      // Assert
      expect(logger.auth.error).toHaveBeenCalledWith('Error fetching user', error)
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR)
      expect(createErrorResponse).toHaveBeenCalledWith('Internal server error')
    })
  })

  describe('getUserUsage', () => {
    it('should return user usage data successfully', async () => {
      // Arrange
      const { serializeUserUsage, createSuccessResponse } = await import('../utils/userSerializer')
      const usageData = {
        totalTransformations: 10,
        monthlyUsage: 5,
        lastTransformation: '2024-01-01T00:00:00.000Z',
        usageResetDate: '2024-01-01T00:00:00.000Z'
      }

      vi.mocked(serializeUserUsage).mockReturnValue(usageData)
      vi.mocked(createSuccessResponse).mockReturnValue({
        success: true,
        data: usageData
      })

      // Act
      await getUserUsage(mockRequest as AuthenticatedRequest, mockResponse as Response)

      // Assert
      expect(serializeUserUsage).toHaveBeenCalledWith(mockUser)
      expect(createSuccessResponse).toHaveBeenCalledWith(usageData)
      expect(mockResponse.json).toHaveBeenCalled()
    })

    it('should handle missing user context for usage', async () => {
      // Arrange
      const { createErrorResponse } = await import('../utils/userSerializer')
      mockRequest.userContext = undefined

      vi.mocked(createErrorResponse).mockReturnValue({
        success: false,
        error: 'User not found'
      })

      // Act
      await getUserUsage(mockRequest as AuthenticatedRequest, mockResponse as Response)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND)
      expect(createErrorResponse).toHaveBeenCalledWith('User not found')
    })

    it('should handle usage serialization errors', async () => {
      // Arrange
      const { serializeUserUsage, createErrorResponse } = await import('../utils/userSerializer')
      const error = new Error('Usage serialization failed')

      vi.mocked(serializeUserUsage).mockImplementation(() => {
        throw error
      })
      vi.mocked(createErrorResponse).mockReturnValue({
        success: false,
        error: 'Internal server error'
      })

      // Act
      await getUserUsage(mockRequest as AuthenticatedRequest, mockResponse as Response)

      // Assert
      expect(logger.auth.error).toHaveBeenCalledWith('Error fetching user usage', error)
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR)
    })
  })

  describe('getUserSummary', () => {
    it('should return user summary data successfully', async () => {
      // Arrange
      const { serializeUserSummary, createSuccessResponse } = await import('../utils/userSerializer')
      const summaryData = {
        id: 'user123',
        email: 'test@example.com',
        username: 'johndoe',
        totalTransformations: 10,
        memberSince: '2024-01-01T00:00:00.000Z',
        lastActivity: '2024-01-01T00:00:00.000Z',
        accountStatus: 'active'
      }

      vi.mocked(serializeUserSummary).mockReturnValue(summaryData)
      vi.mocked(createSuccessResponse).mockReturnValue({
        success: true,
        data: summaryData
      })

      // Act
      await getUserSummary(mockRequest as AuthenticatedRequest, mockResponse as Response)

      // Assert
      expect(serializeUserSummary).toHaveBeenCalledWith(mockUser)
      expect(createSuccessResponse).toHaveBeenCalledWith(summaryData)
      expect(mockResponse.json).toHaveBeenCalled()
    })

    it('should handle missing user context for summary', async () => {
      // Arrange
      const { createErrorResponse } = await import('../utils/userSerializer')
      mockRequest.userContext = undefined

      vi.mocked(createErrorResponse).mockReturnValue({
        success: false,
        error: 'User not found'
      })

      // Act
      await getUserSummary(mockRequest as AuthenticatedRequest, mockResponse as Response)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND)
      expect(createErrorResponse).toHaveBeenCalledWith('User not found')
    })

    it('should handle summary serialization errors', async () => {
      // Arrange
      const { serializeUserSummary, createErrorResponse } = await import('../utils/userSerializer')
      const error = new Error('Summary serialization failed')

      vi.mocked(serializeUserSummary).mockImplementation(() => {
        throw error
      })
      vi.mocked(createErrorResponse).mockReturnValue({
        success: false,
        error: 'Internal server error'
      })

      // Act
      await getUserSummary(mockRequest as AuthenticatedRequest, mockResponse as Response)

      // Assert
      expect(logger.auth.error).toHaveBeenCalledWith('Error fetching user summary', error)
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle null user gracefully', async () => {
      // Arrange
      const { createErrorResponse } = await import('../utils/userSerializer')
      mockRequest.userContext!.mongoUser = null as any

      vi.mocked(createErrorResponse).mockReturnValue({
        success: false,
        error: 'User not found'
      })

      // Act
      await getUser(mockRequest as AuthenticatedRequest, mockResponse as Response)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND)
      expect(createErrorResponse).toHaveBeenCalledWith('User not found')
    })

    it('should handle malformed user context', async () => {
      // Arrange
      const { createErrorResponse } = await import('../utils/userSerializer')
      mockRequest.userContext = {} as any // Empty object

      vi.mocked(createErrorResponse).mockReturnValue({
        success: false,
        error: 'User not found'
      })

      // Act
      await getUser(mockRequest as AuthenticatedRequest, mockResponse as Response)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND)
      expect(createErrorResponse).toHaveBeenCalledWith('User not found')
    })

    it('should handle partial user data', async () => {
      // Arrange
      const { serializeMongoUser, createSuccessResponse } = await import('../utils/userSerializer')
      const partialUser = {
        _id: 'user123',
        auth0Id: 'auth0|123456789',
        email: 'test@example.com'
        // Missing other fields
      } as Partial<IMongoUser>

      mockRequest.userContext!.mongoUser = partialUser as IMongoUser

      const serializedUser = {
        id: 'user123',
        email: 'test@example.com',
        username: undefined,
        firstName: undefined,
        lastName: undefined
      }

      vi.mocked(serializeMongoUser).mockReturnValue(serializedUser)
      vi.mocked(createSuccessResponse).mockReturnValue({
        success: true,
        data: { user: serializedUser }
      })

      // Act
      await getUser(mockRequest as AuthenticatedRequest, mockResponse as Response)

      // Assert
      expect(serializeMongoUser).toHaveBeenCalledWith(partialUser)
      expect(mockResponse.json).toHaveBeenCalled()
    })

    it('should handle concurrent requests safely', async () => {
      // Arrange
      const { serializeMongoUser, createSuccessResponse } = await import('../utils/userSerializer')
      const serializedUser = { id: 'user123', email: 'test@example.com' }

      vi.mocked(serializeMongoUser).mockReturnValue(serializedUser)
      vi.mocked(createSuccessResponse).mockReturnValue({
        success: true,
        data: { user: serializedUser }
      })

      // Act - Simulate concurrent requests
      const promises = Array.from({ length: 10 }, () => 
        getUser(mockRequest as AuthenticatedRequest, mockResponse as Response)
      )

      await Promise.all(promises)

      // Assert - All requests should complete successfully
      expect(serializeMongoUser).toHaveBeenCalledTimes(10)
      expect(mockResponse.json).toHaveBeenCalledTimes(10)
    })

    it('should handle user with missing usage data', async () => {
      // Arrange
      const { serializeUserUsage, createSuccessResponse } = await import('../utils/userSerializer')
      const userWithoutUsage = {
        ...mockUser,
        usage: undefined
      } as IMongoUser

      mockRequest.userContext!.mongoUser = userWithoutUsage

      const defaultUsageData = {
        totalTransformations: 0,
        monthlyUsage: 0,
        lastTransformation: null,
        usageResetDate: null
      }

      vi.mocked(serializeUserUsage).mockReturnValue(defaultUsageData)
      vi.mocked(createSuccessResponse).mockReturnValue({
        success: true,
        data: defaultUsageData
      })

      // Act
      await getUserUsage(mockRequest as AuthenticatedRequest, mockResponse as Response)

      // Assert
      expect(serializeUserUsage).toHaveBeenCalledWith(userWithoutUsage)
      expect(createSuccessResponse).toHaveBeenCalledWith(defaultUsageData)
    })
  })
})
