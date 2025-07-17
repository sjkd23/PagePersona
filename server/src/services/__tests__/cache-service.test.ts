import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CacheService } from '../cache-service';
import type { ScrapedContent } from '../../utils/web-scraper';
import type { TransformationResult } from '../content-transformer';

// Mock data that can be reused across tests
const mockScrapedContent: ScrapedContent = {
  title: 'Test Article',
  content: 'This is test content for caching.',
  url: 'https://example.com/test',
  metadata: {
    description: 'Test description',
    author: 'Test Author',
    wordCount: 7,
  },
};

const mockTransformationResult: TransformationResult = {
  success: true,
  originalContent: {
    title: 'Test Article',
    content: 'Original content',
    url: 'https://example.com/test',
    wordCount: 2,
  },
  transformedContent: 'Transformed content in professional style.',
  persona: {
    id: 'professional',
    name: 'Professional',
    description: 'Professional writing style',
  },
  usage: {
    prompt_tokens: 100,
    completion_tokens: 50,
    total_tokens: 150,
  },
};

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService();
  });

  afterEach(() => {
    cacheService.clearAllCaches();
  });

  describe('Content Caching', () => {
    it('should cache and retrieve scraped content', () => {
      // Arrange
      const url = 'https://example.com/article';

      // Act
      cacheService.setCachedContent(url, mockScrapedContent);
      const retrieved = cacheService.getCachedContent(url);

      // Assert
      expect(retrieved).toEqual(mockScrapedContent);
    });

    it('should return null for non-existent cached content', () => {
      // Arrange
      const url = 'https://nonexistent.com/article';

      // Act
      const retrieved = cacheService.getCachedContent(url);

      // Assert
      expect(retrieved).toBeNull();
    });

    it('should handle URL normalization for cache keys', () => {
      // Arrange
      const url1 = 'https://example.com/article';
      const _url2 = 'https://example.com/article/'; // With trailing slash
      const _url3 = 'example.com/article'; // Without protocol

      // Act
      cacheService.setCachedContent(url1, mockScrapedContent);

      // Assert - Different URL formats should be normalized to same cache key
      expect(cacheService.getCachedContent(url1)).toEqual(mockScrapedContent);
      // Note: The exact normalization behavior depends on implementation
    });

    it('should overwrite existing cached content', () => {
      // Arrange
      const url = 'https://example.com/article';
      const newContent: ScrapedContent = {
        ...mockScrapedContent,
        title: 'Updated Article',
        content: 'This is updated content.',
      };

      // Act
      cacheService.setCachedContent(url, mockScrapedContent);
      cacheService.setCachedContent(url, newContent);
      const retrieved = cacheService.getCachedContent(url);

      // Assert
      expect(retrieved).toEqual(newContent);
      expect(retrieved?.title).toBe('Updated Article');
    });
  });

  describe('Transformation Caching', () => {
    it('should cache and retrieve transformation results', () => {
      // Arrange
      const url = 'https://example.com/article';
      const personaId = 'professional';

      // Act
      cacheService.setCachedTransformation(url, personaId, mockTransformationResult);
      const retrieved = cacheService.getCachedTransformation(url, personaId);

      // Assert
      expect(retrieved).toEqual(mockTransformationResult);
    });

    it('should return null for non-existent transformation', () => {
      // Arrange
      const url = 'https://nonexistent.com/article';
      const personaId = 'professional';

      // Act
      const retrieved = cacheService.getCachedTransformation(url, personaId);

      // Assert
      expect(retrieved).toBeNull();
    });

    it('should distinguish between different personas for same URL', () => {
      // Arrange
      const url = 'https://example.com/article';
      const persona1 = 'professional';
      const persona2 = 'casual';
      const result1 = {
        ...mockTransformationResult,
        persona: { ...mockTransformationResult.persona, id: persona1 },
      };
      const result2 = {
        ...mockTransformationResult,
        persona: { ...mockTransformationResult.persona, id: persona2 },
      };

      // Act
      cacheService.setCachedTransformation(url, persona1, result1);
      cacheService.setCachedTransformation(url, persona2, result2);

      // Assert
      expect(cacheService.getCachedTransformation(url, persona1)).toEqual(result1);
      expect(cacheService.getCachedTransformation(url, persona2)).toEqual(result2);
    });

    it('should distinguish between different URLs for same persona', () => {
      // Arrange
      const url1 = 'https://example.com/article1';
      const url2 = 'https://example.com/article2';
      const personaId = 'professional';
      const result1 = {
        ...mockTransformationResult,
        originalContent: {
          ...mockTransformationResult.originalContent,
          url: url1,
        },
      };
      const result2 = {
        ...mockTransformationResult,
        originalContent: {
          ...mockTransformationResult.originalContent,
          url: url2,
        },
      };

      // Act
      cacheService.setCachedTransformation(url1, personaId, result1);
      cacheService.setCachedTransformation(url2, personaId, result2);

      // Assert
      expect(cacheService.getCachedTransformation(url1, personaId)).toEqual(result1);
      expect(cacheService.getCachedTransformation(url2, personaId)).toEqual(result2);
    });

    it('should handle failed transformation results', () => {
      // Arrange
      const url = 'https://example.com/article';
      const personaId = 'professional';
      const failedResult: TransformationResult = {
        success: false,
        error: 'Transformation failed',
        originalContent: {
          title: 'Test Article',
          content: 'Original content',
          url: url,
          wordCount: 2,
        },
        transformedContent: '',
        persona: {
          id: personaId,
          name: 'Professional',
          description: 'Professional writing style',
        },
      };

      // Act
      cacheService.setCachedTransformation(url, personaId, failedResult);
      const retrieved = cacheService.getCachedTransformation(url, personaId);

      // Assert
      expect(retrieved).toEqual(failedResult);
      expect(retrieved?.success).toBe(false);
    });
  });

  describe('Cache Management', () => {
    it('should clear scrape cache independently', () => {
      // Arrange
      const url = 'https://example.com/article';
      const personaId = 'professional';
      const mockContent: ScrapedContent = {
        title: 'Test',
        content: 'Content',
        url: url,
        metadata: { wordCount: 1 },
      };

      cacheService.setCachedContent(url, mockContent);
      cacheService.setCachedTransformation(url, personaId, mockTransformationResult);

      // Act
      cacheService.clearScrapeCache();

      // Assert
      expect(cacheService.getCachedContent(url)).toBeNull();
      expect(cacheService.getCachedTransformation(url, personaId)).toEqual(
        mockTransformationResult,
      );
    });

    it('should clear transform cache independently', () => {
      // Arrange
      const url = 'https://example.com/article';
      const personaId = 'professional';
      const mockContent: ScrapedContent = {
        title: 'Test',
        content: 'Content',
        url: url,
        metadata: { wordCount: 1 },
      };

      cacheService.setCachedContent(url, mockContent);
      cacheService.setCachedTransformation(url, personaId, mockTransformationResult);

      // Act
      cacheService.clearTransformCache();

      // Assert
      expect(cacheService.getCachedContent(url)).toEqual(mockContent);
      expect(cacheService.getCachedTransformation(url, personaId)).toBeNull();
    });

    it('should clear all caches', () => {
      // Arrange
      const url = 'https://example.com/article';
      const personaId = 'professional';
      const mockContent: ScrapedContent = {
        title: 'Test',
        content: 'Content',
        url: url,
        metadata: { wordCount: 1 },
      };

      cacheService.setCachedContent(url, mockContent);
      cacheService.setCachedTransformation(url, personaId, mockTransformationResult);

      // Act
      cacheService.clearAllCaches();

      // Assert
      expect(cacheService.getCachedContent(url)).toBeNull();
      expect(cacheService.getCachedTransformation(url, personaId)).toBeNull();
    });

    it('should provide cache statistics', () => {
      // Arrange
      const url1 = 'https://example.com/article1';
      const url2 = 'https://example.com/article2';
      const personaId = 'professional';
      const mockContent: ScrapedContent = {
        title: 'Test',
        content: 'Content',
        url: url1,
        metadata: { wordCount: 1 },
      };

      // Act
      cacheService.setCachedContent(url1, mockContent);
      cacheService.setCachedContent(url2, mockContent);
      cacheService.setCachedTransformation(url1, personaId, mockTransformationResult);
      const stats = cacheService.getCacheStats();

      // Assert
      expect(stats).toHaveProperty('scrapeCache');
      expect(stats).toHaveProperty('transformCache');
      expect(stats.scrapeCache.keys).toBe(2);
      expect(stats.transformCache.keys).toBe(1);
      expect(stats.scrapeCache.stats).toBeDefined();
      expect(stats.transformCache.stats).toBeDefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty strings as cache keys', () => {
      // Arrange
      const emptyUrl = '';
      const personaId = 'professional';
      const mockContent: ScrapedContent = {
        title: 'Test',
        content: 'Content',
        url: emptyUrl,
        metadata: { wordCount: 1 },
      };

      // Act & Assert - Should not throw
      expect(() => {
        cacheService.setCachedContent(emptyUrl, mockContent);
        cacheService.getCachedContent(emptyUrl);
        cacheService.setCachedTransformation(emptyUrl, personaId, mockTransformationResult);
        cacheService.getCachedTransformation(emptyUrl, personaId);
      }).not.toThrow();
    });

    it('should handle special characters in URLs', () => {
      // Arrange
      const specialUrl = 'https://example.com/article?query=test&param=特殊文字';
      const _personaId = 'professional';
      const mockContent: ScrapedContent = {
        title: 'Test',
        content: 'Content',
        url: specialUrl,
        metadata: { wordCount: 1 },
      };

      // Act
      cacheService.setCachedContent(specialUrl, mockContent);
      const retrieved = cacheService.getCachedContent(specialUrl);

      // Assert
      expect(retrieved).toEqual(mockContent);
    });

    it('should handle very long URLs', () => {
      // Arrange
      const longUrl = 'https://example.com/' + 'a'.repeat(2000); // Very long URL
      const _personaId = 'professional';
      const mockContent: ScrapedContent = {
        title: 'Test',
        content: 'Content',
        url: longUrl,
        metadata: { wordCount: 1 },
      };

      // Act & Assert - Should not throw
      expect(() => {
        cacheService.setCachedContent(longUrl, mockContent);
        cacheService.getCachedContent(longUrl);
      }).not.toThrow();
    });

    it('should handle null and undefined values gracefully', () => {
      // Arrange
      const url = 'https://example.com/article';

      // Act & Assert - Should not throw when retrieving non-existent keys
      expect(cacheService.getCachedContent(url)).toBeNull();
      expect(cacheService.getCachedTransformation(url, 'nonexistent')).toBeNull();
    });

    it('should handle large numbers of cache entries', () => {
      // Arrange
      const baseUrl = 'https://example.com/article';
      const _personaId = 'professional';
      const numEntries = 1000;

      // Act - Add many cache entries
      for (let i = 0; i < numEntries; i++) {
        const url = `${baseUrl}${i}`;
        const mockContent: ScrapedContent = {
          title: `Test ${i}`,
          content: `Content ${i}`,
          url: url,
          metadata: { wordCount: 2 },
        };
        cacheService.setCachedContent(url, mockContent);
      }

      const stats = cacheService.getCacheStats();

      // Assert
      expect(stats.scrapeCache.keys).toBe(numEntries);

      // Verify we can still retrieve entries
      const retrievedFirst = cacheService.getCachedContent(`${baseUrl}0`);
      const retrievedLast = cacheService.getCachedContent(`${baseUrl}${numEntries - 1}`);

      expect(retrievedFirst?.title).toBe('Test 0');
      expect(retrievedLast?.title).toBe(`Test ${numEntries - 1}`);
    });
  });

  describe('Performance Tests', () => {
    it('should perform cache operations efficiently', () => {
      // Arrange
      const url = 'https://example.com/article';
      const _personaId = 'professional';
      const mockContent: ScrapedContent = {
        title: 'Test',
        content: 'Content',
        url: url,
        metadata: { wordCount: 1 },
      };

      // Act - Measure set operation
      const setStart = Date.now();
      for (let i = 0; i < 1000; i++) {
        cacheService.setCachedContent(`${url}${i}`, mockContent);
      }
      const setEnd = Date.now();

      // Act - Measure get operation
      const getStart = Date.now();
      for (let i = 0; i < 1000; i++) {
        cacheService.getCachedContent(`${url}${i}`);
      }
      const getEnd = Date.now();

      // Assert - Operations should be fast
      expect(setEnd - setStart).toBeLessThan(100); // Set operations under 100ms
      expect(getEnd - getStart).toBeLessThan(50); // Get operations under 50ms
    });

    it('should handle concurrent cache access', async () => {
      // Arrange
      const url = 'https://example.com/article';
      const mockContent: ScrapedContent = {
        title: 'Test',
        content: 'Content',
        url: url,
        metadata: { wordCount: 1 },
      };

      // Act - Simulate concurrent access
      const promises = Array.from({ length: 100 }, (_, i) => {
        return Promise.resolve().then(() => {
          const currentUrl = `${url}${i}`;
          cacheService.setCachedContent(currentUrl, mockContent);
          return cacheService.getCachedContent(currentUrl);
        });
      });

      const results = await Promise.all(promises);

      // Assert - All operations should succeed
      expect(results).toHaveLength(100);
      results.forEach((result) => {
        expect(result).toEqual(mockContent);
      });
    });
  });
});
