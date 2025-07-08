import { MongoUser } from '../models/mongo-user'
import { serializeMongoUser, serializeUserUsage } from '../utils/userSerializer'
import { logger } from '../utils/logger'
import type { Document } from 'mongoose'

export interface UserProfileUpdateRequest {
  firstName?: string
  lastName?: string
  preferences?: Record<string, unknown>
}

export interface UserServiceResult<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export class UserService {
  /**
   * Get user profile information
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
   * Update user profile with validated fields
   */
  async updateUserProfile(
    user: Document & any, 
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
          ...user.preferences,
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
   * Get user usage statistics
   */
  async getUserUsage(user: Document & any): Promise<UserServiceResult> {
    try {
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        }
      }

      return {
        success: true,
        data: serializeUserUsage(user)
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
   * Sync user data (mainly for MongoDB sync operations)
   */
  async syncUser(user: Document & any): Promise<UserServiceResult> {
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
        data: serializeMongoUser(user),
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
 * Singleton instance for user service
 */
export const userService = new UserService()
