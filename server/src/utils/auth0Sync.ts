// Auth0 to MongoDB field synchronization utilities

import { IMongoUser } from '../models/MongoUser';

interface Auth0User {
  sub: string;
  email?: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
  name?: string;
  nickname?: string;
  picture?: string;
  locale?: string;
  updated_at?: string;
  [key: string]: any;
}

interface SyncResult {
  updated: boolean;
  changedFields: string[];
  ignoredFields: string[];
}

/**
 * Sync Auth0 user data with MongoDB user, with comprehensive field handling
 */
export function syncAuth0Fields(mongoUser: IMongoUser, auth0User: Auth0User): SyncResult {
  const changedFields: string[] = [];
  const ignoredFields: string[] = [];
  let updated = false;

  // Define field mappings and sync rules
  const fieldMappings = [
    {
      auth0Field: 'email',
      mongoField: 'email',
      syncRule: (auth0Val: any, mongoVal: any) => auth0Val && auth0Val !== mongoVal,
      transform: (val: any) => val
    },
    {
      auth0Field: 'given_name',
      mongoField: 'firstName', 
      syncRule: (auth0Val: any, mongoVal: any) => auth0Val && auth0Val !== mongoVal,
      transform: (val: any) => val
    },
    {
      auth0Field: 'family_name',
      mongoField: 'lastName',
      syncRule: (auth0Val: any, mongoVal: any) => auth0Val && auth0Val !== mongoVal,
      transform: (val: any) => val
    },
    {
      auth0Field: 'picture',
      mongoField: 'avatar',
      syncRule: (auth0Val: any, mongoVal: any) => auth0Val && auth0Val !== mongoVal,
      transform: (val: any) => val
    },
    {
      auth0Field: 'email_verified',
      mongoField: 'isEmailVerified',
      syncRule: (auth0Val: any, mongoVal: any) => auth0Val !== undefined && auth0Val !== mongoVal,
      transform: (val: any) => Boolean(val)
    }
  ];

  // Process each field mapping
  for (const mapping of fieldMappings) {
    const auth0Value = auth0User[mapping.auth0Field];
    const mongoValue = (mongoUser as any)[mapping.mongoField];

    if (mapping.syncRule(auth0Value, mongoValue)) {
      const transformedValue = mapping.transform(auth0Value);
      (mongoUser as any)[mapping.mongoField] = transformedValue;
      changedFields.push(`${mapping.mongoField} (${mongoValue} → ${transformedValue})`);
      updated = true;
    }
  }

  // Check for fields present in Auth0 but not being synced
  const syncedAuth0Fields = fieldMappings.map(m => m.auth0Field);
  const standardAuth0Fields = ['sub', 'iss', 'aud', 'exp', 'iat', 'azp', 'scope'];
  
  for (const [key, value] of Object.entries(auth0User)) {
    if (!syncedAuth0Fields.includes(key) && 
        !standardAuth0Fields.includes(key) && 
        value !== undefined) {
      ignoredFields.push(`${key}: ${value}`);
    }
  }

  // Always update lastLoginAt (but don't count as field change for logging)
  mongoUser.lastLoginAt = new Date();
  updated = true;

  return { updated, changedFields, ignoredFields };
}

/**
 * Log sync results for debugging and monitoring
 */
export function logSyncResults(userId: string, result: SyncResult): void {
  if (result.changedFields.length > 0) {
    console.log(`🔄 User ${userId} - Fields updated:`, result.changedFields);
  }
  
  if (result.ignoredFields.length > 0) {
    console.log(`ℹ️  User ${userId} - Auth0 fields not synced:`, result.ignoredFields);
  }
  
  if (result.changedFields.length === 0 && result.ignoredFields.length === 0) {
    console.log(`✅ User ${userId} - No changes needed (lastLoginAt updated)`);
  }
}
