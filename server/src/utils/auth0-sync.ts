/**
 * Auth0 to MongoDB User Synchronization Utilities
 *
 * This module provides robust synchronization between Auth0 user data and MongoDB
 * user records, ensuring data consistency across authentication and application
 * storage systems.
 *
 * Key Features:
 * - Bidirectional field mapping between Auth0 and MongoDB schemas
 * - Intelligent sync rules to prevent unnecessary database writes
 * - Comprehensive error handling and logging
 * - Type-safe transformation functions
 * - Configurable field mappings for easy maintenance
 * - Development-focused logging with production safety
 *
 * Usage:
 * ```typescript
 * const result = syncAuth0Fields(mongoUser, auth0User);
 * logSyncResults(userId, result);
 * ```
 *
 * @module auth0-sync
 * @version 1.0.0
 * @since 1.0.0
 */

import { IMongoUser } from '../models/mongo-user';
import { logger } from './logger';
import type {
  ProcessedAuth0User,
  FieldMapping,
  SyncResult,
  SyncRuleFunction,
  TransformFunction,
} from '../types/common';

/**
 * Synchronizes Auth0 user data with MongoDB user record
 *
 * Performs intelligent field-by-field synchronization between Auth0 user
 * data and MongoDB user documents. Only updates fields that have actually
 * changed to minimize database writes and maintain data integrity.
 *
 * @param mongoUser - The MongoDB user document to update
 * @param auth0User - The processed Auth0 user data
 * @returns Detailed synchronization result with change tracking
 * @throws Does not throw - all errors are captured in result.errors
 *
 * @example
 * ```typescript
 * const syncResult = syncAuth0Fields(user, auth0Data);
 * if (syncResult.updated) {
 *   await user.save();
 * }
 * ```
 */
export function syncAuth0Fields(mongoUser: IMongoUser, auth0User: ProcessedAuth0User): SyncResult {
  const changedFields: string[] = [];
  const errors: string[] = [];
  let updated = false;

  // Define field mappings and sync rules with proper typing
  const fieldMappings: FieldMapping[] = [
    {
      auth0Field: 'email',
      mongoField: 'email',
      syncRule: ((auth0Val: unknown, mongoVal: unknown) =>
        typeof auth0Val === 'string' && auth0Val && auth0Val !== mongoVal) as SyncRuleFunction,
      transform: ((val: unknown) => val as string) as TransformFunction,
    },
    {
      auth0Field: 'givenName',
      mongoField: 'firstName',
      syncRule: ((auth0Val: unknown, mongoVal: unknown) =>
        typeof auth0Val === 'string' && auth0Val && auth0Val !== mongoVal) as SyncRuleFunction,
      transform: ((val: unknown) => val as string) as TransformFunction,
    },
    {
      auth0Field: 'familyName',
      mongoField: 'lastName',
      syncRule: ((auth0Val: unknown, mongoVal: unknown) =>
        typeof auth0Val === 'string' && auth0Val && auth0Val !== mongoVal) as SyncRuleFunction,
      transform: ((val: unknown) => val as string) as TransformFunction,
    },
    {
      auth0Field: 'picture',
      mongoField: 'avatar',
      syncRule: ((auth0Val: unknown, mongoVal: unknown) =>
        typeof auth0Val === 'string' && auth0Val && auth0Val !== mongoVal) as SyncRuleFunction,
      transform: ((val: unknown) => val as string) as TransformFunction,
    },
    {
      auth0Field: 'emailVerified',
      mongoField: 'isEmailVerified',
      syncRule: ((auth0Val: unknown, mongoVal: unknown) =>
        auth0Val !== undefined && auth0Val !== mongoVal) as SyncRuleFunction,
      transform: ((val: unknown) => Boolean(val)) as TransformFunction,
    },
  ];

  // Process each field mapping
  for (const mapping of fieldMappings) {
    try {
      const auth0Value = (auth0User as unknown as Record<string, unknown>)[mapping.auth0Field];
      // Safe dynamic property access with type checking
      const mongoValue = (mongoUser as unknown as Record<string, unknown>)[mapping.mongoField];

      if (mapping.syncRule(auth0Value, mongoValue)) {
        const transformedValue = mapping.transform(auth0Value);
        // Safe dynamic property assignment
        (mongoUser as unknown as Record<string, unknown>)[mapping.mongoField] = transformedValue;
        changedFields.push(`${mapping.mongoField} (${mongoValue} → ${transformedValue})`);
        updated = true;
      }
    } catch (error) {
      errors.push(
        `Failed to sync field ${mapping.mongoField}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // Always update lastLoginAt (but don't count as field change for logging)
  mongoUser.lastLoginAt = new Date();
  updated = true;

  return {
    updated,
    changedFields,
    errors,
    timestamp: new Date(),
  };
}

/**
 * Logs synchronization results for debugging and monitoring
 *
 * Provides comprehensive logging of sync operations in development and test
 * environments while maintaining silence in production for performance.
 * Includes detailed change tracking and error reporting.
 *
 * @param userId - The user ID for context in log messages
 * @param result - The synchronization result object to log
 * @returns void
 *
 * @example
 * ```typescript
 * const result = syncAuth0Fields(mongoUser, auth0User);
 * logSyncResults(user.auth0Id, result);
 * ```
 *
 * @since 1.0.0
 */
export function logSyncResults(userId: string, result: SyncResult): void {
  // Only log in non-production environments
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  try {
    const { updated, changedFields, errors } = result;

    // Log field changes if any (debug only)
    if (changedFields && changedFields.length > 0) {
      if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
        console.log(`🔄 User ${userId} - Fields updated:`, changedFields);
      }
    }

    // Log errors if any (debug only)
    if (errors && errors.length > 0) {
      if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
        console.log(`⚠️  User ${userId} - Sync errors:`, errors);
      }
    }

    // Log no changes needed if updated but no field changes (debug only)
    if (
      updated &&
      (!changedFields || changedFields.length === 0) &&
      (!errors || errors.length === 0)
    ) {
      if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
        console.log(`✅ User ${userId} - No changes needed (lastLoginAt updated)`);
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
      logger.error(`❌ Error logging sync results for ${userId}:`, error);
    }
  }
}
