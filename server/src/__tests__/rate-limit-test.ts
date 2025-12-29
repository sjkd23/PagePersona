/**
 * Rate Limiting Test
 *
 * This test verifies that the rate limiting middleware works correctly
 * with Redis store and proper fallback to memory store.
 */

import axios from "axios";

const BASE_URL = "http://localhost:5000";

async function testRateLimiting() {
  console.log("🧪 Testing Rate Limiting...\n");

  try {
    // Test 1: Basic rate limiting (should work for first few requests)
    console.log("📝 Test 1: Basic requests (should succeed)");
    for (let i = 1; i <= 5; i++) {
      try {
        const response = await axios.get(`${BASE_URL}/api/health`);
        console.log(
          `  Request ${i}: ${response.status} - ${response.data.status}`,
        );
      } catch (error) {
        console.log(
          `  Request ${i}: Error - ${error.response?.status || error.message}`,
        );
      }
    }

    // Test 2: Rapid requests to trigger rate limiting (free tier: 100 requests per 15 minutes)
    console.log("\n🔥 Test 2: Rapid requests (should trigger rate limiting)");
    const rapidRequests = 105; // Exceed free tier limit
    let successCount = 0;
    let rateLimitedCount = 0;

    for (let i = 1; i <= rapidRequests; i++) {
      try {
        const response = await axios.get(`${BASE_URL}/api/health`);
        if (response.status === 200) {
          successCount++;
        }
      } catch (error) {
        if (error.response?.status === 429) {
          rateLimitedCount++;
          console.log(`  Request ${i}: 429 - Rate limited`);
        } else {
          console.log(
            `  Request ${i}: Error - ${error.response?.status || error.message}`,
          );
        }
      }
    }

    console.log(`\n📊 Results:`);
    console.log(`  Success: ${successCount}`);
    console.log(`  Rate Limited: ${rateLimitedCount}`);
    console.log(`  Total: ${rapidRequests}`);

    // Test 3: Test transform endpoint with premium limits
    console.log("\n🔄 Test 3: Transform endpoint rate limiting");
    for (let i = 1; i <= 5; i++) {
      try {
        const response = await axios.get(`${BASE_URL}/api/transform/health`);
        console.log(`  Transform request ${i}: ${response.status}`);
      } catch (error) {
        if (error.response?.status === 429) {
          console.log(`  Transform request ${i}: 429 - Rate limited`);
        } else {
          console.log(
            `  Transform request ${i}: Error - ${error.response?.status || error.message}`,
          );
        }
      }
    }

    console.log("\n✅ Rate limiting test completed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testRateLimiting();
