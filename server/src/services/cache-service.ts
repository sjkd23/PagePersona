/**
 * Content Caching Service Documentation
 *
 * This service provides intelligent caching for web scraping results and AI
 * transformations using NodeCache (in-memory) rather than Redis.
 *
 * CACHING STRATEGY:
 *
 * 1. SCRAPED CONTENT CACHE
 *    - Purpose: Cache raw website content to avoid re-scraping
 *    - TTL: 1 hour (content can change frequently)
 *    - Max Keys: 1000 pages
 *    - Key Format: scrape:{normalizedUrl}
 *    - Cleanup: Every 10 minutes
 *
 * 2. TRANSFORMATION CACHE
 *    - Purpose: Cache AI transformation results for same URL+persona
 *    - TTL: 24 hours (transformations are expensive and stable)
 *    - Max Keys: 5000 transformations
 *    - Key Format: transform:{normalizedUrl}:{personaId}
 *    - Cleanup: Every hour
 *
 * PERFORMANCE BENEFITS:
 * - Reduces OpenAI API calls (cost savings)
 * - Faster response times for repeated requests
 * - Reduces load on web scraping services
 *
 * MEMORY CONSIDERATIONS:
 * - Uses in-memory storage (lost on restart)
 * - Memory usage monitored via cache statistics
 * - Automatic cleanup prevents memory leaks
 *
 * @example
 * // Check for cached content first
 * const cached = cacheService.getCachedContent(url)
 * if (cached) return cached
 *
 * // Scrape and cache
 * const content = await scraper.scrape(url)
 * cacheService.setCachedContent(url, content)
 */

/**
 * Cache Service for Performance Optimization
 *
 * Provides intelligent caching for web scraping results and content
 * transformations to reduce API calls, improve response times, and
 * optimize resource usage. Implements separate cache stores with
 * different TTL strategies for optimal performance.
 *
 * Features:
 * - Dual-layer caching for scraping and transformations
 * - Configurable TTL and size limits
 * - Cache statistics and management utilities
 * - URL normalization for consistent cache keys
 */

import NodeCache from "node-cache";
import type { ScrapedContent } from "../utils/web-scraper";
import type { TransformationResult } from "../services/content-transformer";

/**
 * Cache Service Class
 *
 * Manages two separate cache stores with optimized configurations
 * for different data types and access patterns.
 */
export class CacheService {
  private scrapeCache: NodeCache;
  private transformCache: NodeCache;

  constructor() {
    // Cache scraped content for 1 hour with periodic cleanup
    this.scrapeCache = new NodeCache({
      stdTTL: 3600,
      checkperiod: 600, // Check for expired keys every 10 minutes
      maxKeys: 1000, // Limit to 1000 cached pages
    });

    // Cache transformations for 24 hours with extended retention
    this.transformCache = new NodeCache({
      stdTTL: 86400,
      checkperiod: 3600, // Check for expired keys every hour
      maxKeys: 5000, // Limit to 5000 cached transformations
    });
  }

  /**
   * Retrieve cached scraped content by URL
   *
   * @param url - Target webpage URL
   * @returns Cached scraped content or null if not found
   */
  getCachedContent(url: string): ScrapedContent | null {
    const cacheKey = this.createScrapeKey(url);
    return this.scrapeCache.get<ScrapedContent>(cacheKey) || null;
  }

  /**
   * Store scraped content in cache
   *
   * @param url - Target webpage URL
   * @param content - Scraped content structure to cache
   */
  setCachedContent(url: string, content: ScrapedContent): void {
    const cacheKey = this.createScrapeKey(url);
    this.scrapeCache.set(cacheKey, content);
  }

  /**
   * Retrieve cached transformation result by URL and persona
   *
   * @param url - Source webpage URL
   * @param personaId - Persona identifier used for transformation
   * @returns Cached transformation result or null if not found
   */
  getCachedTransformation(
    url: string,
    personaId: string,
  ): TransformationResult | null {
    const cacheKey = this.createTransformKey(url, personaId);
    return this.transformCache.get<TransformationResult>(cacheKey) || null;
  }

  /**
   * Store transformation result in cache
   *
   * @param url - Source webpage URL
   * @param personaId - Persona identifier used for transformation
   * @param result - Transformation result to cache
   */
  setCachedTransformation(
    url: string,
    personaId: string,
    result: TransformationResult,
  ): void {
    const cacheKey = this.createTransformKey(url, personaId);
    this.transformCache.set(cacheKey, result);
  }

  /**
   * Clear all scraped content from cache
   */
  clearScrapeCache(): void {
    this.scrapeCache.flushAll();
  }

  /**
   * Clear all transformation results from cache
   */
  clearTransformCache(): void {
    this.transformCache.flushAll();
  }

  /**
   * Clear both scraping and transformation caches
   */
  clearAllCaches(): void {
    this.clearScrapeCache();
    this.clearTransformCache();
  }

  /**
   * Get comprehensive cache statistics and performance metrics
   *
   * @returns Cache statistics including key counts and hit/miss ratios
   */
  getCacheStats(): {
    scrapeCache: { keys: number; stats: object };
    transformCache: { keys: number; stats: object };
  } {
    return {
      scrapeCache: {
        keys: this.scrapeCache.keys().length,
        stats: this.scrapeCache.getStats(),
      },
      transformCache: {
        keys: this.transformCache.keys().length,
        stats: this.transformCache.getStats(),
      },
    };
  }

  /**
   * Create normalized cache key for scraped content
   *
   * @param url - Source URL to normalize
   * @returns Consistent cache key for scraping operations
   */
  private createScrapeKey(url: string): string {
    // Normalize URL for consistent caching
    try {
      const normalizedUrl = new URL(url).toString();
      return `scrape:${normalizedUrl}`;
    } catch {
      return `scrape:${url}`;
    }
  }

  /**
   * Create normalized cache key for transformation results
   *
   * @param url - Source URL to normalize
   * @param personaId - Persona identifier for key uniqueness
   * @returns Consistent cache key for transformation operations
   */
  private createTransformKey(url: string, personaId: string): string {
    try {
      const normalizedUrl = new URL(url).toString();
      return `transform:${normalizedUrl}:${personaId}`;
    } catch {
      return `transform:${url}:${personaId}`;
    }
  }
}

/**
 * Singleton Cache Service Instance
 *
 * Provides application-wide access to caching functionality
 * while maintaining consistent state across all modules.
 */
export const cacheService = new CacheService();
