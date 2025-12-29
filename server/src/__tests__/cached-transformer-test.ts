/**
 * Simple Redis Test (without Docker)
 *
 * This script tests Redis caching functionality with graceful fallback
 */

import { CachedContentTransformer } from "../services/cached-content-transformer";

async function testCachedTransformer() {
  console.log("🧪 Testing Cached Content Transformer...\n");

  try {
    // Create transformer instance
    const transformer = new CachedContentTransformer("test-api-key");

    // Mock scraped content
    const mockScrapedContent = {
      title: "Test Article",
      content:
        "This is a test article content for testing Redis caching functionality.",
      url: "https://example.com/test-article",
      metadata: {
        description: "Test article",
        author: "Test Author",
        publishDate: "2023-01-01",
        wordCount: 12,
      },
    };

    console.log("📝 Mock scraped content prepared");
    console.log("URL:", mockScrapedContent.url);
    console.log("Title:", mockScrapedContent.title);
    console.log("Content length:", mockScrapedContent.content.length);
    console.log("");

    // Test 1: First transformation (should be a cache miss)
    console.log("🔄 Test 1: First transformation (expected cache miss)");
    const start1 = Date.now();
    let duration1 = 0;

    try {
      const result1 = await transformer.transformContent(
        mockScrapedContent,
        "professional",
      );
      duration1 = Date.now() - start1;

      console.log("✅ First transformation result:");
      console.log("  - Success:", result1.success);
      console.log("  - Duration:", duration1 + "ms");
      console.log("  - Has error:", !!result1.error);
      if (result1.error) {
        console.log("  - Error:", result1.error);
      }
    } catch (error) {
      duration1 = Date.now() - start1;
      console.log("❌ First transformation failed:", error);
    }

    console.log("");

    // Test 2: Second transformation (should be a cache hit if Redis is available)
    console.log(
      "🎯 Test 2: Second transformation (expected cache hit if Redis available)",
    );
    const start2 = Date.now();

    try {
      const result2 = await transformer.transformContent(
        mockScrapedContent,
        "professional",
      );
      const duration2 = Date.now() - start2;

      console.log("✅ Second transformation result:");
      console.log("  - Success:", result2.success);
      console.log("  - Duration:", duration2 + "ms");
      console.log("  - Has error:", !!result2.error);
      if (result2.error) {
        console.log("  - Error:", result2.error);
      }

      // If Redis is working, second call should be significantly faster
      if (duration2 < duration1 * 0.5) {
        console.log("🚀 Cache hit likely (significantly faster)");
      } else {
        console.log("🔄 Cache miss or Redis not available (similar duration)");
      }
    } catch (error) {
      console.log("❌ Second transformation failed:", error);
    }

    console.log("");

    // Test 3: Test text transformation
    console.log("📝 Test 3: Text transformation caching");
    const testText = "This is a test text for transformation caching.";

    try {
      const textResult1 = await transformer.transformText(testText, "casual");
      console.log("✅ Text transformation result:");
      console.log("  - Success:", textResult1.success);
      console.log("  - Has error:", !!textResult1.error);
      if (textResult1.error) {
        console.log("  - Error:", textResult1.error);
      }
    } catch (error) {
      console.log("❌ Text transformation failed:", error);
    }

    console.log("\n🎉 Cached transformer test completed!");
    console.log(
      "ℹ️  Note: If Redis is not available, the system will fall back to direct transformation",
    );
    console.log(
      "ℹ️  To test Redis caching, ensure Redis is running on redis://localhost:6379",
    );
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testCachedTransformer();
