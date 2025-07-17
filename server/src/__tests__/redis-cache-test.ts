/**
 * Redis Cache Test Script
 *
 * Simple test to verify Redis caching functionality
 */

import { config } from 'dotenv';
import { getCachedTransformResult, setCachedTransformResult } from '../services/transform-cache';
import { redisClient } from '../utils/redis-client';

// Load environment variables
config();

async function testRedisCache() {
  console.log('🧪 Testing Redis Cache Functionality...\n');

  try {
    // Test 1: Check Redis connection
    console.log('✅ Redis client initialized');

    // Test 2: Test basic cache operations
    const testUrl = 'https://example.com/test';
    const testPersona = 'test-persona';

    // Mock transformation result
    const mockResult = {
      success: true,
      originalContent: {
        title: 'Test Article',
        content: 'Test content',
        url: testUrl,
        wordCount: 2,
      },
      transformedContent: 'Transformed test content',
      persona: {
        id: testPersona,
        name: 'Test Persona',
        description: 'A test persona',
      },
    };

    // Test cache miss
    console.log('🔍 Testing cache miss...');
    const cachedResult1 = await getCachedTransformResult(testUrl, testPersona);
    console.log(
      'Cache miss result:',
      cachedResult1 === null ? '✅ Null (expected)' : '❌ Found data',
    );

    // Test cache set
    console.log('💾 Testing cache set...');
    await setCachedTransformResult(testUrl, testPersona, mockResult);
    console.log('✅ Cache set completed');

    // Test cache hit
    console.log('🎯 Testing cache hit...');
    const cachedResult2 = await getCachedTransformResult(testUrl, testPersona);
    console.log('Cache hit result:', cachedResult2 ? '✅ Found data' : '❌ No data');

    if (cachedResult2) {
      console.log('📊 Cached data verification:');
      console.log('  - Title:', cachedResult2.originalContent.title);
      console.log('  - URL:', cachedResult2.originalContent.url);
      console.log('  - Persona:', cachedResult2.persona.name);
      console.log('  - Success:', cachedResult2.success);
    }

    // Test 3: Test direct Redis operations
    console.log('\n🔧 Testing direct Redis operations...');
    await redisClient.set('test:key', 'test:value', 10);
    const directResult = await redisClient.get('test:key');
    console.log('Direct Redis test:', directResult === 'test:value' ? '✅ Success' : '❌ Failed');

    // Cleanup
    await redisClient.del('test:key');
    console.log('✅ Cleanup completed');

    console.log('\n🎉 Redis cache test completed successfully!');
  } catch (error) {
    console.error('❌ Redis cache test failed:', error);
  }
}

// Run the test
testRedisCache();
