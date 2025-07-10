/**
 * User Service Layer
 * 
 * Handles all user-related business logic including profile management,
 * usage statistics, and user data synchronization. Provides a clean
 * interface between route handlers and data models with proper error
 * handling and validation.
 * 
 * Features:
 * - User profile retrieval and updates
 * - Usage statistics tracking
 * - User data synchronization
 * - Secure field filtering for updates
 */

import { MongoUser, type IMongoUser } from '../models/mongo-user'
import { serializeMongoUser, serializeUserUsage } from '../utils/userSerializer'
import { logger } from '../utils/logger'
import type { Document } from 'mongoose'

/**
 * User profile update request structure
 * 
 * Defines the allowed fields for user profile updates with optional
 * typing to ensure only safe modifications are permitted.
 */
export interface UserProfileUpdateRequest {
  firstName?: string
  lastName?: string
  preferences?: Record<string, unknown>
}

/**
 * Standardized service result interface
 * 
 * Provides consistent response structure across all user service
 * operations with success/error states and optional data payload.
 */
export interface UserServiceResult<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

/**
 * User Service Class
 * 
 * Centralized business logic for user operations with comprehensive
 * error handling, logging, and data validation. Maintains separation
 * of concerns between HTTP layer and data persistence.
 */
export class UserService {
  /**
   * Retrieve user profile information by ID
   * 
   * Fetches complete user profile data and returns serialized version
   * with sensitive information filtered out for client consumption.
   * 
   * @param userId - MongoDB user document ID
   * @returns Promise resolving to user profile data or error
   */
  async getUserProfile(userId: string): Promise<UserServiceResult> {
    try {
      const user = await MongoUser.findById(userId)
      
      if (!user) {
        return {
          success: false,
          error: 'User profile not found'
        }
      }

      return {
        success: true,
        data: serializeMongoUser(user)
      }

    } catch (error) {
      logger.transform.error('Error fetching user profile', error)
      return {
        success: false,
        error: 'Failed to fetch user profile'
      }
    }
  }

  /**
   * Update user profile with validated field restrictions
   * 
   * Applies partial updates to user profile while enforcing field
   * restrictions and merging preferences safely. Validates updates
   * before applying and logs successful modifications.
   * 
   * @param user - Existing user document from database
   * @param updates - Partial update object with allowed fields
   * @returns Promise resolving to updated user data or error
   */
  async updateUserProfile(
    user: Document & Record<string, unknown>, 
    updates: UserProfileUpdateRequest
  ): Promise<UserServiceResult> {
    try {
      // Only allow updating certain fields
      const allowedUpdates = ['firstName', 'lastName', 'preferences']
      const filteredUpdates: Record<string, unknown> = {}

      for (const key of allowedUpdates) {
        if (updates[key as keyof UserProfileUpdateRequest] !== undefined) {
          filteredUpdates[key] = updates[key as keyof UserProfileUpdateRequest]
        }
      }

      // Special handling for preferences (merge instead of replace)
      if (updates.preferences) {
        filteredUpdates.preferences = {
          ...(user.preferences || {}),
          ...updates.preferences
        }
      }

      const updatedUser = await MongoUser.findByIdAndUpdate(
        user._id,
        filteredUpdates,
        { new: true, runValidators: true }
      )

      if (!updatedUser) {
        return {
          success: false,
          error: 'User not found'
        }
      }

      logger.transform.info('Profile updated successfully', {
        userId: updatedUser._id,
        username: updatedUser.username
      })

      return {
        success: true,
        data: serializeMongoUser(updatedUser),
        message: 'Profile updated successfully'
      }

    } catch (error) {
      logger.transform.error('Error updating user profile', error)
      return {
        success: false,
        error: 'Failed to update user profile'
      }
    }
  }

  /**
   * Retrieve user usage statistics and metrics
   * 
   * Extracts and serializes user usage data including transformation
   * counts, rate limiting status, and activity tracking for display
   * in user dashboards and admin panels.
   * 
   * @param user - User document with usage information
   * @returns Promise resolving to usage statistics or error
   */
  async getUserUsage(user: Document & Record<string, unknown>): Promise<UserServiceResult> {
    try {
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        }
      }

      return {
        success: true,
        data: serializeUserUsage(user as unknown as IMongoUser)
      }

    } catch (error) {
      logger.transform.error('Error fetching user usage', error)
      return {
        success: false,
        error: 'Failed to fetch user usage'
      }
    }
  }

  /**
   * Synchronize user data across systems
   * 
   * Performs user data synchronization operations, primarily used
   * for MongoDB synchronization after Auth0 authentication. Logs
   * sync operations for audit trails and debugging.
   * 
   * @param user - User document to synchronize
   * @returns Promise resolving to synchronized user data or error
   */
  async syncUser(user: Document & Record<string, unknown>): Promise<UserServiceResult> {
    try {
      if (!user) {
        return {
          success: false,
          error: 'User sync failed - user not found'
        }
      }

      logger.transform.info('User synced successfully', {
        userId: user._id,
        auth0Id: user.auth0Id,
        email: user.email
      })

      return {
        success: true,
        data: serializeMongoUser(user as unknown as IMongoUser),
        message: 'User successfully synced with MongoDB'
      }

    } catch (error) {
      logger.transform.error('Error syncing user', error)
      return {
        success: false,
        error: 'Failed to sync user'
      }
    }
  }
}

/**
 * Singleton User Service Instance
 * 
 * Provides application-wide access to user service functionality
 * while maintaining single instance pattern for consistent state
 * and resource management.
 */
export const userService = new UserService()
