/**
 * Content Transformation Service
 *
 * Orchestrates the complete content transformation workflow including
 * web scraping, caching, AI processing, and usage tracking. Handles
 * both webpage URL transformation and direct text transformation with
 * comprehensive error handling and performance optimization.
 *
 * Features:
 * - Webpage content scraping and transformation
 * - Direct text transformation
 * - Multi-level caching for performance
 * - Usage tracking and rate limiting
 * - Error handling with appropriate HTTP status mapping
 */

import { CachedContentTransformer } from "./cached-content-transformer";
import { WebScraper } from "../utils/web-scraper";
import { cacheService } from "./cache-service";
import {
  incrementUserUsage,
  incrementUserFailedAttempt,
} from "../utils/usage-tracking";
import { logger } from "../utils/logger";
import { ErrorCode, ErrorMapper } from "@pagepersonai/shared";
import type { ScrapedContent } from "../utils/web-scraper";
import type { TransformationResult } from "./content-transformer";

/**
 * Webpage transformation request parameters
 */
export interface TransformWebpageRequest {
  url: string;
  persona: string;
  userId?: string;
}

/**
 * Direct text transformation request parameters
 */
export interface TransformTextRequest {
  text: string;
  persona: string;
  userId?: string;
}

/**
 * Standardized transformation service response
 */
export interface TransformationServiceResult {
  success: boolean;
  data?: TransformationResult;
  error?: string;
  errorCode?: ErrorCode;
  details?: unknown;
  cached?: boolean;
}

/**
 * Transformation Service Class
 *
 * High-level service orchestrating content transformation workflows
 * with caching, usage tracking, and comprehensive error handling.
 */
export class TransformationService {
  private apiKey: string;
  private transformer: CachedContentTransformer;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.transformer = new CachedContentTransformer(apiKey);
  }

  /**
   * Transform webpage content with comprehensive caching and tracking
   *
   * Retrieves webpage content, applies persona-based transformation,
   * and handles caching and usage tracking. Includes error mapping
   * for appropriate HTTP status code responses.
   *
   * @param request - Webpage transformation parameters
   * @returns Promise resolving to transformation result or error
   */
  async transformWebpage(
    request: TransformWebpageRequest,
  ): Promise<TransformationServiceResult> {
    const { url, persona, userId } = request;

    logger.transform.info("Starting webpage transformation", {
      url,
      persona,
      userId,
    });

    try {
      // Check cache for existing transformation
      const cachedResult = cacheService.getCachedTransformation(url, persona);
      if (cachedResult) {
        logger.transform.info("Cache hit! Returning cached result");

        // Track usage even for cached results
        if (userId) {
          await this.trackUsage(userId);
        }

        return {
          success: true,
          data: cachedResult,
          cached: true,
        };
      }

      // Get scraped content (with caching) - this may throw on scraping errors
      const scrapedContent = await this.getScrapedContent(url);

      // Transform the content
      const result = await this.transformer.transformContent(
        scrapedContent,
        persona,
      );

      // Always return the transformation result, even if it failed
      // The ContentTransformer should handle its own errors and return a proper structure

      // Cache successful transformations only
      if (result.success) {
        cacheService.setCachedTransformation(url, persona, result);

        // Track usage for successful transformations
        if (userId) {
          await this.trackUsage(userId);
        }
      } else {
        // Track failed attempt for unsuccessful transformations
        if (userId) {
          await this.trackFailedAttempt(userId);
        }
      }

      return {
        success: result.success,
        data: result,
        error: result.error,
      };
    } catch (error) {
      logger.transform.error("Error in webpage transformation service", error);

      // Re-throw scraping errors so route handler can return appropriate status code
      if (
        error instanceof Error &&
        (error.message.includes("Scraping failed") ||
          error.message.includes("Failed to fetch") ||
          error.message.includes("Network") ||
          error.message.includes("timeout"))
      ) {
        throw error;
      }

      // For other errors, return service result with user-friendly error
      const formattedError = this.formatError(error);
      return {
        success: false,
        error: formattedError.message,
        errorCode: formattedError.code,
        details: formattedError.details,
      };
    }
  }

  /**
   * Transform text content directly without web scraping
   *
   * Applies persona-based transformation to raw text input, bypassing
   * web scraping stages. Includes usage tracking and error handling
   * for direct text processing workflows.
   *
   * @param request - Text transformation parameters
   * @returns Promise resolving to transformation result or error
   */
  async transformText(
    request: TransformTextRequest,
  ): Promise<TransformationServiceResult> {
    const { text, persona, userId } = request;

    logger.transform.info("Starting text transformation", {
      textLength: text.length,
      persona,
      userId,
    });

    try {
      const result = await this.transformer.transformText(text.trim(), persona);

      // Track usage for successful transformations or failed attempts
      if (userId) {
        if (result.success) {
          await this.trackUsage(userId);
        } else {
          await this.trackFailedAttempt(userId);
        }
      }

      return {
        success: result.success,
        data: result,
        error: result.error,
      };
    } catch (error) {
      logger.transform.error("Error in text transformation service", error);
      const formattedError = this.formatError(error);
      return {
        success: false,
        error: formattedError.message,
        errorCode: formattedError.code,
        details: formattedError.details,
      };
    }
  }

  /**
   * Retrieve scraped content with intelligent caching
   *
   * Checks cache for existing scraped content before performing
   * web scraping operation. Caches successful scraping results
   * for performance optimization and rate limiting compliance.
   *
   * @param url - Target webpage URL to scrape
   * @returns Promise resolving to scraped content structure
   * @throws Error for scraping failures to be handled at route level
   */
  private async getScrapedContent(url: string): Promise<ScrapedContent> {
    let scrapedContent = cacheService.getCachedContent(url);

    if (!scrapedContent) {
      logger.transform.info("No cached content, scraping webpage", { url });
      try {
        scrapedContent = await WebScraper.scrapeWebpage(url);
        cacheService.setCachedContent(url, scrapedContent);
      } catch (error) {
        logger.transform.error("Failed to scrape webpage", error);
        // Re-throw scraping errors so they can be handled at route level
        throw error;
      }
    } else {
      logger.transform.info("Using cached scraped content");
    }

    return scrapedContent;
  }

  /**
   * Track successful user transformation usage
   *
   * Increments user usage statistics for successful transformations
   * with error handling to prevent tracking failures from affecting
   * the main transformation workflow.
   *
   * @param userId - User ID for usage tracking
   */
  private async trackUsage(userId: string): Promise<void> {
    try {
      await incrementUserUsage(userId, { logSuccess: true });
    } catch (error) {
      logger.transform.warn("Failed to track usage", { userId, error });
      // Don't throw - usage tracking failure shouldn't break the main flow
    }
  }

  /**
   * Track failed transformation attempts for analytics
   *
   * Records failed transformation attempts for user analytics
   * and system monitoring without interrupting the main error
   * handling flow.
   *
   * @param userId - User ID for failure tracking
   */
  private async trackFailedAttempt(userId: string): Promise<void> {
    try {
      await incrementUserFailedAttempt(userId, { logSuccess: true });
    } catch (error) {
      logger.transform.warn("Failed to track failed attempt", {
        userId,
        error,
      });
      // Don't throw - tracking failure shouldn't break the main flow
    }
  }

  /**
   * Format error messages for consistent client responses
   *
   * Converts various error types into user-friendly messages
   * with appropriate specificity for different failure scenarios.
   * Maps technical errors to actionable user feedback.
   *
   * @param error - Error object or unknown error type
   * @returns User-friendly error with structured information
   */
  private formatError(error: unknown): {
    message: string;
    code: ErrorCode;
    details?: unknown;
  } {
    // Use the ErrorMapper to get consistent user-friendly error messages
    const userFriendlyError = ErrorMapper.mapError(error);

    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      // Map specific transformation errors to appropriate codes
      if (
        message.includes("invalid url") ||
        message.includes("malformed url")
      ) {
        return {
          message: userFriendlyError.message,
          code: ErrorCode.INVALID_URL,
          details: error.message,
        };
      }

      if (
        message.includes("private or internal urls") ||
        message.includes("not allowed")
      ) {
        return {
          message:
            "Private or internal URLs are not allowed for security reasons.",
          code: ErrorCode.INVALID_URL,
          details: error.message,
        };
      }

      if (message.includes("not found") || message.includes("404")) {
        return {
          message:
            "The webpage could not be found. Please check the URL and try again.",
          code: ErrorCode.SCRAPING_FAILED,
          details: error.message,
        };
      }

      if (message.includes("forbidden") || message.includes("403")) {
        return {
          message:
            "Access to this webpage is forbidden. The site may block automated requests.",
          code: ErrorCode.SCRAPING_FAILED,
          details: error.message,
        };
      }

      if (
        message.includes("text too short") ||
        message.includes("content too short")
      ) {
        return {
          message:
            "Text must be at least 50 characters long to generate meaningful content.",
          code: ErrorCode.INVALID_TEXT,
          details: error.message,
        };
      }

      if (
        message.includes("scraping failed") ||
        message.includes("failed to fetch")
      ) {
        return {
          message: userFriendlyError.message,
          code: ErrorCode.SCRAPING_FAILED,
          details: error.message,
        };
      }

      if (message.includes("network") || message.includes("connection")) {
        return {
          message: userFriendlyError.message,
          code: ErrorCode.NETWORK_ERROR,
          details: error.message,
        };
      }

      if (
        message.includes("transformation failed") ||
        message.includes("openai")
      ) {
        return {
          message: userFriendlyError.message,
          code: ErrorCode.TRANSFORMATION_FAILED,
          details: error.message,
        };
      }
    }

    // Default case
    return {
      message: userFriendlyError.message,
      code: ErrorCode.UNKNOWN_ERROR,
      details: error,
    };
  }
}

/**
 * Transformation Service Factory Function
 *
 * Creates and configures a new transformation service instance with
 * proper API key validation. Ensures OpenAI API key is available
 * before service instantiation to prevent runtime failures.
 *
 * @returns Configured TransformationService instance
 * @throws Error if OpenAI API key is not configured
 */
export function createTransformationService(): TransformationService {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OpenAI API key is not configured");
  }

  return new TransformationService(apiKey);
}
