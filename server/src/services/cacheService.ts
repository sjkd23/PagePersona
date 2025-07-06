import NodeCache from 'node-cache'
import type { ScrapedContent } from '../utilities/webScraper'
import type { TransformationResult } from '../services/contentTransformer'

export class CacheService {
  private scrapeCache: NodeCache
  private transformCache: NodeCache

  constructor() {
    // Cache scraped content for 1 hour (3600 seconds)
    this.scrapeCache = new NodeCache({ 
      stdTTL: 3600,
      checkperiod: 600, // Check for expired keys every 10 minutes
      maxKeys: 1000 // Limit to 1000 cached pages
    })

    // Cache transformations for 24 hours (86400 seconds)
    this.transformCache = new NodeCache({ 
      stdTTL: 86400,
      checkperiod: 3600, // Check for expired keys every hour
      maxKeys: 5000 // Limit to 5000 cached transformations
    })
  }

  // Scraped content caching
  getCachedContent(url: string): ScrapedContent | null {
    const cacheKey = this.createScrapeKey(url)
    return this.scrapeCache.get<ScrapedContent>(cacheKey) || null
  }

  setCachedContent(url: string, content: ScrapedContent): void {
    const cacheKey = this.createScrapeKey(url)
    this.scrapeCache.set(cacheKey, content)
  }

  // Transformation caching
  getCachedTransformation(url: string, personaId: string): TransformationResult | null {
    const cacheKey = this.createTransformKey(url, personaId)
    return this.transformCache.get<TransformationResult>(cacheKey) || null
  }

  setCachedTransformation(url: string, personaId: string, result: TransformationResult): void {
    const cacheKey = this.createTransformKey(url, personaId)
    this.transformCache.set(cacheKey, result)
  }

  // Cache management
  clearScrapeCache(): void {
    this.scrapeCache.flushAll()
  }

  clearTransformCache(): void {
    this.transformCache.flushAll()
  }

  clearAllCaches(): void {
    this.clearScrapeCache()
    this.clearTransformCache()
  }

  // Get cache statistics
  getCacheStats() {
    return {
      scrapeCache: {
        keys: this.scrapeCache.keys().length,
        stats: this.scrapeCache.getStats()
      },
      transformCache: {
        keys: this.transformCache.keys().length,
        stats: this.transformCache.getStats()
      }
    }
  }

  private createScrapeKey(url: string): string {
    // Normalize URL for consistent caching
    try {
      const normalizedUrl = new URL(url).toString()
      return `scrape:${normalizedUrl}`
    } catch {
      return `scrape:${url}`
    }
  }

  private createTransformKey(url: string, personaId: string): string {
    try {
      const normalizedUrl = new URL(url).toString()
      return `transform:${normalizedUrl}:${personaId}`
    } catch {
      return `transform:${url}:${personaId}`
    }
  }
}

// Singleton instance
export const cacheService = new CacheService()
