import { ContentTransformer } from './content-transformer'
import { WebScraper } from '../utils/web-scraper'
import { cacheService } from './cache-service'
import { incrementUserUsage, incrementUserFailedAttempt } from '../utils/usage-tracking'
import { logger } from '../utils/logger'
import type { ScrapedContent } from '../utils/web-scraper'
import type { TransformationResult } from './content-transformer'

export interface TransformWebpageRequest {
  url: string
  persona: string
  userId?: string
}

export interface TransformTextRequest {
  text: string
  persona: string
  userId?: string
}

export interface TransformationServiceResult {
  success: boolean
  data?: TransformationResult
  error?: string
  cached?: boolean
}

export class TransformationService {
  private apiKey: string
  private transformer: ContentTransformer

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.transformer = new ContentTransformer(apiKey)
  }

  /**
   * Transform webpage content with caching and usage tracking
   */
  async transformWebpage(request: TransformWebpageRequest): Promise<TransformationServiceResult> {
    const { url, persona, userId } = request

    logger.transform.info('Starting webpage transformation', { url, persona, userId })

    try {
      // Check cache for existing transformation
      const cachedResult = cacheService.getCachedTransformation(url, persona)
      if (cachedResult) {
        logger.transform.info('Cache hit! Returning cached result')
        
        // Track usage even for cached results
        if (userId) {
          await this.trackUsage(userId)
        }
        
        return {
          success: true,
          data: cachedResult,
          cached: true
        }
      }

      // Get scraped content (with caching) - this may throw on scraping errors
      const scrapedContent = await this.getScrapedContent(url)
      
      // Transform the content
      const result = await this.transformer.transformContent(scrapedContent, persona)
      
      // Always return the transformation result, even if it failed
      // The ContentTransformer should handle its own errors and return a proper structure
      
      // Cache successful transformations only
      if (result.success) {
        cacheService.setCachedTransformation(url, persona, result)
        
        // Track usage for successful transformations
        if (userId) {
          await this.trackUsage(userId)
        }
      } else {
        // Track failed attempt for unsuccessful transformations
        if (userId) {
          await this.trackFailedAttempt(userId)
        }
      }

      return {
        success: result.success,
        data: result,
        error: result.error
      }

    } catch (error) {
      logger.transform.error('Error in webpage transformation service', error)
      
      // Re-throw scraping errors so route handler can return appropriate status code
      if (error instanceof Error && (
        error.message.includes('Scraping failed') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('Network') ||
        error.message.includes('timeout')
      )) {
        throw error
      }
      
      // For other errors, return service result
      return {
        success: false,
        error: 'Failed to transform webpage content. Please try again later.'
      }
    }
  }

  /**
   * Transform text content directly
   */
  async transformText(request: TransformTextRequest): Promise<TransformationServiceResult> {
    const { text, persona, userId } = request

    logger.transform.info('Starting text transformation', { 
      textLength: text.length, 
      persona, 
      userId 
    })

    try {
      const result = await this.transformer.transformText(text.trim(), persona)
      
      // Track usage for successful transformations or failed attempts
      if (userId) {
        if (result.success) {
          await this.trackUsage(userId)
        } else {
          await this.trackFailedAttempt(userId)
        }
      }

      return {
        success: result.success,
        data: result,
        error: result.error
      }

    } catch (error) {
      logger.transform.error('Error in text transformation service', error)
      return {
        success: false,
        error: this.formatError(error)
      }
    }
  }

  /**
   * Get scraped content with caching
   */
  private async getScrapedContent(url: string): Promise<ScrapedContent> {
    let scrapedContent = cacheService.getCachedContent(url)
    
    if (!scrapedContent) {
      logger.transform.info('No cached content, scraping webpage', { url })
      try {
        scrapedContent = await WebScraper.scrapeWebpage(url)
        cacheService.setCachedContent(url, scrapedContent)
      } catch (error) {
        logger.transform.error('Failed to scrape webpage', error)
        // Re-throw scraping errors so they can be handled at route level
        throw error
      }
    } else {
      logger.transform.info('Using cached scraped content')
    }

    return scrapedContent
  }

  /**
   * Track user usage with error handling
   */
  private async trackUsage(userId: string): Promise<void> {
    try {
      await incrementUserUsage(userId, { logSuccess: true })
    } catch (error) {
      logger.transform.warn('Failed to track usage', { userId, error })
      // Don't throw - usage tracking failure shouldn't break the main flow
    }
  }

  /**
   * Track failed attempt with error handling
   */
  private async trackFailedAttempt(userId: string): Promise<void> {
    try {
      await incrementUserFailedAttempt(userId, { logSuccess: true })
    } catch (error) {
      logger.transform.warn('Failed to track failed attempt', { userId, error })
      // Don't throw - tracking failure shouldn't break the main flow
    }
  }

  /**
   * Format errors for consistent error responses
   */
  private formatError(error: unknown): string {
    if (error instanceof Error) {
      if (error.message.includes('Invalid URL')) {
        return 'Invalid URL format. Please provide a valid website URL.'
      }
      
      if (error.message.includes('Private or internal URLs')) {
        return 'Private or internal URLs are not allowed for security reasons.'
      }
      
      if (error.message.includes('not found') || error.message.includes('404')) {
        return 'The webpage could not be found. Please check the URL and try again.'
      }
      
      if (error.message.includes('forbidden') || error.message.includes('403')) {
        return 'Access to this webpage is forbidden. The site may block automated requests.'
      }

      if (error.message.includes('Text too short to process')) {
        return 'Text must be at least 50 characters long to generate content.'
      }

      if (error.message.includes('Content too short')) {
        return 'Content is too short for meaningful transformation. Please provide at least 50 characters.'
      }
      
      return error.message
    }
    
    return 'An unexpected error occurred. Please try again later.'
  }
}

/**
 * Factory function to create transformation service with API key validation
 */
export function createTransformationService(): TransformationService {
  const apiKey = process.env.OPENAI_API_KEY
  
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured')
  }
  
  return new TransformationService(apiKey)
}
