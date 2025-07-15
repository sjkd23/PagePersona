/**
 * Integration Test for Redis Caching
 *
 * This test shows the complete flow including proper persona usage
 */

import { config } from 'dotenv';
import {
  getCachedTransformResult,
  setCachedTransformResult,
  getCachedTextTransformResult,
  setCachedTextTransformResult,
} from '../services/transform-cache';

// Load environment variables
config({ path: '../../../.env.development' });

async function testIntegration() {
  console.log('🧪 Testing Redis Caching Integration...\n');

  // Mock a successful transformation result
  const mockTransformResult = {
    success: true,
    originalContent: {
      title: 'Test Article',
      content:
        'This is a test article content that meets the minimum length requirements for processing.',
      url: 'https://example.com/test-article',
      wordCount: 15,
    },
    transformedContent: 'This is the transformed content in the requested persona style.',
    persona: {
      id: 'casual',
      name: 'Casual',
      description: 'Casual writing style',
    },
    usage: {
      prompt_tokens: 100,
      completion_tokens: 50,
      total_tokens: 150,
    },
  };

  try {
    const testUrl = 'https://example.com/test-article';
    const testPersona = 'casual';

    console.log('📝 Testing URL transformation caching...');

    // Test 1: Check cache miss
    console.log('🔍 Testing cache miss...');
    const cachedResult1 = await getCachedTransformResult(testUrl, testPersona);
    console.log(
      'Cache miss result:',
      cachedResult1 === null ? '✅ Null (expected)' : '❌ Found data',
    );

    // Test 2: Set cache
    console.log('💾 Setting cache...');
    await setCachedTransformResult(testUrl, testPersona, mockTransformResult);
    console.log('✅ Cache set completed');

    // Test 3: Check cache hit
    console.log('🎯 Testing cache hit...');
    const cachedResult2 = await getCachedTransformResult(testUrl, testPersona);
    console.log('Cache hit result:', cachedResult2 ? '✅ Found data' : '❌ No data');

    if (cachedResult2) {
      console.log('📊 Cached data verification:');
      console.log('  - Success:', cachedResult2.success);
      console.log('  - Title:', cachedResult2.originalContent.title);
      console.log('  - URL:', cachedResult2.originalContent.url);
      console.log('  - Persona:', cachedResult2.persona.name);
      console.log('  - Transformed Content Length:', cachedResult2.transformedContent.length);
      console.log('  - Usage Tokens:', cachedResult2.usage?.total_tokens);
    }

    console.log('\n📝 Testing text transformation caching...');

    const testText =
      'This is a test text that is long enough to meet the minimum requirements for processing and transformation.';

    // Test 4: Text cache miss
    console.log('🔍 Testing text cache miss...');
    const textCachedResult1 = await getCachedTextTransformResult(testText, testPersona);
    console.log(
      'Text cache miss result:',
      textCachedResult1 === null ? '✅ Null (expected)' : '❌ Found data',
    );

    // Test 5: Set text cache
    console.log('💾 Setting text cache...');
    const mockTextResult = {
      ...mockTransformResult,
      originalContent: {
        title: 'Direct Text Input',
        content: testText,
        url: 'Direct Text Input',
        wordCount: testText.split(' ').length,
      },
    };
    await setCachedTextTransformResult(testText, testPersona, mockTextResult);
    console.log('✅ Text cache set completed');

    // Test 6: Check text cache hit
    console.log('🎯 Testing text cache hit...');
    const textCachedResult2 = await getCachedTextTransformResult(testText, testPersona);
    console.log('Text cache hit result:', textCachedResult2 ? '✅ Found data' : '❌ No data');

    if (textCachedResult2) {
      console.log('📊 Text cached data verification:');
      console.log('  - Success:', textCachedResult2.success);
      console.log('  - Content Length:', textCachedResult2.originalContent.content.length);
      console.log('  - Word Count:', textCachedResult2.originalContent.wordCount);
      console.log('  - Persona:', textCachedResult2.persona.name);
    }

    console.log('\n🎉 Integration test completed successfully!');

    // Show cache key format
    console.log('\n🔑 Cache Key Information:');
    console.log('- URL transforms use: transform:{persona}:{base64_url}');
    console.log('- Text transforms use: transform:text:{persona}:{base64_text_sample}');
    console.log('- TTL:', process.env.CACHE_TTL_SECONDS || 3600, 'seconds');
  } catch (error) {
    console.error('❌ Integration test failed:', error);
  }
}

// Run the test
testIntegration();
