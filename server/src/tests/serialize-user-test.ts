// Test script to validate serializeUser robustness
// Run this with: npm run dev (and then call a test endpoint)

import { serializeMongoUser, safeLogUser, safeToISOString, safeDate } from '../utils/userSerializer';

/**
 * Test serializeUser with various incomplete user objects
 */
export function testSerializeUser() {
  console.log('🧪 Testing serializeUser robustness...\n');

  // Test case 1: Completely empty object
  console.log('Test 1: Empty object');
  try {
    const result1 = serializeMongoUser({} as any);
    console.log('✅ Empty object handled successfully:', result1.id);
  } catch (error) {
    console.log('❌ Empty object failed:', (error as Error).message);
  }

  // Test case 2: Missing _id
  console.log('\nTest 2: Missing _id');
  try {
    const user2 = {
      auth0Id: 'auth0|123',
      email: 'test@example.com',
      username: 'testuser',
      role: 'user',
      preferences: { theme: 'light', language: 'en', notifications: true },
      usage: { totalTransformations: 0, monthlyUsage: 0, usageResetDate: new Date() },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result2 = serializeMongoUser(user2 as any);
    console.log('✅ Missing _id handled successfully:', result2.id);
  } catch (error) {
    console.log('❌ Missing _id failed:', (error as Error).message);
  }

  // Test case 3: Missing usage object
  console.log('\nTest 3: Missing usage object');
  try {
    const user3 = {
      _id: '507f1f77bcf86cd799439011',
      auth0Id: 'auth0|123',
      email: 'test@example.com',
      username: 'testuser',
      role: 'user',
      preferences: { theme: 'light', language: 'en', notifications: true },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result3 = serializeMongoUser(user3 as any);
    console.log('✅ Missing usage handled successfully:', result3.usage.totalTransformations);
  } catch (error) {
    console.log('❌ Missing usage failed:', (error as Error).message);
  }

  // Test case 4: Missing dates
  console.log('\nTest 4: Missing dates');
  try {
    const user4 = {
      _id: '507f1f77bcf86cd799439011',
      auth0Id: 'auth0|123',
      email: 'test@example.com',
      username: 'testuser',
      role: 'user',
      preferences: { theme: 'light', language: 'en', notifications: true },
      usage: { totalTransformations: 5, monthlyUsage: 2 }
    };
    const result4 = serializeMongoUser(user4 as any);
    console.log('✅ Missing dates handled successfully:', result4.createdAt);
  } catch (error) {
    console.log('❌ Missing dates failed:', (error as Error).message);
  }

  // Test case 6: Invalid dates
  console.log('\nTest 6: Invalid dates');
  try {
    const user6 = {
      _id: '507f1f77bcf86cd799439011',
      auth0Id: 'auth0|123',
      email: 'test@example.com',
      username: 'testuser',
      role: 'user',
      preferences: { theme: 'light', language: 'en', notifications: true },
      usage: { 
        totalTransformations: 5, 
        monthlyUsage: 2,
        lastTransformation: 'invalid-date-string',
        usageResetDate: 'another-invalid-date'
      },
      createdAt: 'not-a-valid-date',
      updatedAt: new Date('invalid'),
      lastLoginAt: 12345 // number instead of date
    };
    const result6 = serializeMongoUser(user6 as any);
    console.log('✅ Invalid dates handled successfully:', {
      createdAt: result6.createdAt,
      usageResetDate: result6.usage.usageResetDate,
      lastLoginAt: result6.lastLoginAt
    });
  } catch (error) {
    console.log('❌ Invalid dates failed:', (error as Error).message);
  }

  // Test case 7: Null/undefined user
  console.log('\nTest 7: Null user');
  try {
    const result7 = serializeMongoUser(null as any);
    console.log('✅ Null user handled successfully:', result7.id);
  } catch (error) {
    console.log('❌ Null user failed:', (error as Error).message);
  }

  // Test case 9: Test safe date utilities directly
  console.log('\nTest 9: Safe date utilities');
  try {
    console.log('safeToISOString with null:', safeToISOString(null));
    console.log('safeToISOString with invalid string:', safeToISOString('not-a-date'));
    console.log('safeToISOString with valid date:', safeToISOString('2024-01-01'));
    console.log('safeToISOString with number timestamp:', safeToISOString(1704067200000));
    
    const testDate = safeDate('invalid-date');
    console.log('safeDate with invalid input returns valid Date:', testDate instanceof Date && !isNaN(testDate.getTime()));
    
    console.log('✅ Safe date utilities working correctly');
  } catch (error) {
    console.log('❌ Safe date utilities failed:', (error as Error).message);
  }

  // Test safe logging
  console.log('\nTest 8: Safe logging');
  safeLogUser(null, 'Null user test');
  safeLogUser({}, 'Empty object test');
  safeLogUser({ _id: '123', circular: {} }, 'Object with potential issues test');

  console.log('\n🏁 SerializeUser robustness tests completed!');
}
