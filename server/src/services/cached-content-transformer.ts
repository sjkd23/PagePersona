/**
 * Cached Content Transformer Service
 *
 * Wraps the ContentTransformer with Redis caching layer to improve
 * performance and reduce OpenAI API calls for duplicate requests.
 */

import { ContentTransformer, type TransformationResult } from './content-transformer';
import {
  getCachedTransformResult,
  setCachedTransformResult,
  getCachedTextTransformResult,
  setCachedTextTransformResult,
} from './transform-cache';
import { logger } from '../utils/logger';
import type { ScrapedContent } from './scraper';

/**
 * Cached Content Transformer Class
 *
 * Provides the same interface as ContentTransformer but with
 * Redis caching for improved performance.
 */
export class CachedContentTransformer {
  private transformer: ContentTransformer;

  constructor(apiKey: string) {
    this.transformer = new ContentTransformer(apiKey);
  }

  /**
   * Transform content with caching
   *
   * First checks Redis cache for existing result, falls back to
   * live transformation if not found, then caches the result.
   */
  async transformContent(
    scrapedContent: ScrapedContent,
    personaId: string,
  ): Promise<TransformationResult> {
    logger.info('Starting cached content transformation', {
      url: scrapedContent.url,
      persona: personaId,
    });

    try {
      // Try to get from cache first
      const cachedResult = await getCachedTransformResult(scrapedContent.url, personaId);
      if (cachedResult) {
        logger.info('✅ Cache hit - returning cached transformation result', {
          url: scrapedContent.url,
          persona: personaId,
        });
        return cachedResult;
      }

      // Cache miss - perform live transformation
      logger.info('⚡ Cache miss - performing live transformation', {
        url: scrapedContent.url,
        persona: personaId,
      });

      const result = await this.transformer.transformContent(scrapedContent, personaId);

      // Cache successful results only
      if (result.success) {
        await setCachedTransformResult(scrapedContent.url, personaId, result);
        logger.info('💾 Cached transformation result', {
          url: scrapedContent.url,
          persona: personaId,
        });
      } else {
        logger.warn('❌ Not caching failed transformation', {
          url: scrapedContent.url,
          persona: personaId,
          error: result.error,
        });
      }

      return result;
    } catch (error) {
      logger.error('Error in cached content transformation:', error);

      // Fallback to direct transformation on cache errors
      logger.info('🔄 Falling back to direct transformation due to cache error');
      return await this.transformer.transformContent(scrapedContent, personaId);
    }
  }

  /**
   * Transform text with caching
   *
   * First checks Redis cache for existing result, falls back to
   * live transformation if not found, then caches the result.
   */
  async transformText(text: string, personaId: string): Promise<TransformationResult> {
    logger.info('Starting cached text transformation', {
      textLength: text.length,
      persona: personaId,
    });

    try {
      // Try to get from cache first
      const cachedResult = await getCachedTextTransformResult(text, personaId);
      if (cachedResult) {
        logger.info('✅ Cache hit - returning cached text transformation result', {
          textLength: text.length,
          persona: personaId,
        });
        return cachedResult;
      }

      // Cache miss - perform live transformation
      logger.info('⚡ Cache miss - performing live text transformation', {
        textLength: text.length,
        persona: personaId,
      });

      const result = await this.transformer.transformText(text, personaId);

      // Cache successful results only
      if (result.success) {
        await setCachedTextTransformResult(text, personaId, result);
        logger.info('💾 Cached text transformation result', {
          textLength: text.length,
          persona: personaId,
        });
      } else {
        logger.warn('❌ Not caching failed text transformation', {
          textLength: text.length,
          persona: personaId,
          error: result.error,
        });
      }

      return result;
    } catch (error) {
      logger.error('Error in cached text transformation:', error);

      // Fallback to direct transformation on cache errors
      logger.info('🔄 Falling back to direct transformation due to cache error');
      return await this.transformer.transformText(text, personaId);
    }
  }
}
