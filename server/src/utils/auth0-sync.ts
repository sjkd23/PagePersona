// Auth0 to MongoDB field synchronization utilities

import { IMongoUser } from '../models/mongo-user';
import type { 
  ProcessedAuth0User, 
  FieldMapping, 
  SyncResult,
  SyncRuleFunction,
  TransformFunction 
} from '../types/common';

/**
 * Sync Auth0 user data with MongoDB user, with comprehensive field handling
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
      transform: ((val: unknown) => val as string) as TransformFunction
    },
    {
      auth0Field: 'givenName',
      mongoField: 'firstName', 
      syncRule: ((auth0Val: unknown, mongoVal: unknown) => 
        typeof auth0Val === 'string' && auth0Val && auth0Val !== mongoVal) as SyncRuleFunction,
      transform: ((val: unknown) => val as string) as TransformFunction
    },
    {
      auth0Field: 'familyName',
      mongoField: 'lastName',
      syncRule: ((auth0Val: unknown, mongoVal: unknown) => 
        typeof auth0Val === 'string' && auth0Val && auth0Val !== mongoVal) as SyncRuleFunction,
      transform: ((val: unknown) => val as string) as TransformFunction
    },
    {
      auth0Field: 'picture',
      mongoField: 'avatar',
      syncRule: ((auth0Val: unknown, mongoVal: unknown) => 
        typeof auth0Val === 'string' && auth0Val && auth0Val !== mongoVal) as SyncRuleFunction,
      transform: ((val: unknown) => val as string) as TransformFunction
    },
    {
      auth0Field: 'emailVerified',
      mongoField: 'isEmailVerified',
      syncRule: ((auth0Val: unknown, mongoVal: unknown) => 
        auth0Val !== undefined && auth0Val !== mongoVal) as SyncRuleFunction,
      transform: ((val: unknown) => Boolean(val)) as TransformFunction
    }
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
      errors.push(`Failed to sync field ${mapping.mongoField}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Always update lastLoginAt (but don't count as field change for logging)
  mongoUser.lastLoginAt = new Date();
  updated = true;

  return { 
    updated, 
    changedFields, 
    errors,
    timestamp: new Date()
  };
}

/**
 * Log sync results for debugging and monitoring
 * Only logs in non-production environments
 */
export function logSyncResults(userId: string, result: SyncResult): void {
  // Only log in non-production environments
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  try {
    const { updated, changedFields, errors } = result;

    // Log field changes if any
    if (changedFields && changedFields.length > 0) {
      console.log(
        `🔄 User ${userId} - Fields updated:`,
        changedFields
      );
    }

    // Log errors if any
    if (errors && errors.length > 0) {
      console.log(
        `⚠️  User ${userId} - Sync errors:`,
        errors
      );
    }

    // Log no changes needed if updated but no field changes
    if (updated && (!changedFields || changedFields.length === 0) && (!errors || errors.length === 0)) {
      console.log(`✅ User ${userId} - No changes needed (lastLoginAt updated)`);
    }
  } catch (error) {
    console.error(`❌ Error logging sync results for ${userId}:`, error);
  }
}
