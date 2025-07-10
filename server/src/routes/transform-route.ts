/**
 * Transform Route Handler
 * 
 * Provides RESTful endpoints for content transformation using various personas.
 * Handles both URL-based webpage transformation and direct text transformation
 * with persona-specific AI processing. Includes rate limiting, usage tracking,
 * and optional authentication for premium features.
 * 
 * Routes:
 * - GET /personas: Retrieve available transformation personas
 * - POST /: Transform webpage content from URL
 * - POST /text: Transform direct text input
 * - GET /cache/stats: Development cache statistics
 * - DELETE /cache: Development cache clearing
 */

import express, { Request, Response } from 'express'
import { getAllClientPersonas } from '../../../shared/constants/personas'
import { optionalAuth0 } from '../middleware/auth0-middleware'
import { checkUsageLimit } from '../middleware/usage-limit-middleware'
import { sendSuccess, sendInternalError } from '../utils/response-helpers'
import { validateBody } from '../middleware/zod-validation'
import { transformSchemas } from '../middleware/validation-schemas'
import { logger } from '../utils/logger'
import { HttpStatus } from '../constants/http-status'
import { createTransformationService } from '../services/transformation-service'
import { cacheService } from '../services/cache-service'
import { ErrorCode, ErrorMapper } from '../../../shared/types/errors'

const router = express.Router()

logger.transform.info('Transform routes module loaded');
logger.transform.info('Registering transform routes', {
  routes: [
    'GET  /personas',
    'POST / (URL transform)',
    'POST /text (direct text transform)',
    'GET  /cache/stats (dev only)',
    'DELETE /cache (dev only)'
  ]
});

/**
 * Health check endpoint for service monitoring
 * 
 * @route GET /test
 * @returns {object} Success response with status message
 */
router.get('/test', (_req: Request, res: Response) => {
  sendSuccess(res, { message: 'Transform routes are working' })
})

/**
 * Retrieve all available transformation personas
 * 
 * Returns the complete list of personas available for content transformation,
 * including UI-specific fields like avatar URLs and theme information.
 * 
 * @route GET /personas
 * @returns {object} Success response containing personas array
 * @throws {500} Internal server error if persona fetching fails
 */
router.get('/personas', (_req: Request, res: Response) => {
  try {
    // Return client personas with all UI fields (avatarUrl, theme, etc.)
    const personas = getAllClientPersonas()

    sendSuccess(res, { personas })
  } catch (error) {
    logger.transform.error('Error fetching personas', error)
    sendInternalError(res, 'Failed to fetch personas')
  }
})

/**
 * Transform webpage content using selected persona
 * 
 * Accepts a URL and persona selection, fetches the webpage content,
 * and applies AI-powered transformation based on the chosen persona's
 * characteristics and prompts. Includes usage tracking and rate limiting.
 * 
 * @route POST /
 * @param {string} url - Target webpage URL to transform
 * @param {string} persona - Selected persona identifier for transformation
 * @returns {object} Transformed content or error response
 * @throws {400} Bad request for invalid URLs or private/internal URLs
 * @throws {403} Forbidden for blocked or restricted content
 * @throws {404} Not found for non-existent pages
 * @throws {500} Internal server error for processing failures
 */
router.post('/', /*transformRateLimit,*/ validateBody(transformSchemas.transformUrl), optionalAuth0, checkUsageLimit(), async (req: Request, res: Response): Promise<void> => {
  logger.transform.info('POST /api/transform route hit')
  
  try {
    const { url, persona } = req.body
    const mongoUser = (req as Request & { userContext?: { mongoUser?: { _id?: { toString(): string } } } }).userContext?.mongoUser
    const userId = mongoUser?._id?.toString()

    const transformationService = createTransformationService()
    const result = await transformationService.transformWebpage({
      url,
      persona,
      userId
    })

    if (result.success && result.data) {
      res.json(result.data);
      return;
    } else if (result.data) {
      res.json(result.data);
      return;
    } else {
      // Service failed completely - return enhanced error with user-friendly message
      const statusCode = result.errorCode === ErrorCode.INVALID_URL ? HttpStatus.BAD_REQUEST :
                        result.errorCode === ErrorCode.SCRAPING_FAILED ? HttpStatus.BAD_REQUEST :
                        result.errorCode === ErrorCode.NETWORK_ERROR ? HttpStatus.BAD_GATEWAY :
                        result.errorCode === ErrorCode.TRANSFORMATION_FAILED ? HttpStatus.INTERNAL_SERVER_ERROR :
                        HttpStatus.INTERNAL_SERVER_ERROR

      res.status(statusCode).json({
        success: false,
        error: result.error || 'Failed to transform webpage content. Please try again later.',
        errorCode: result.errorCode,
        details: result.details,
        timestamp: new Date()
      });
      return;
    }

  } catch (error) {
    logger.transform.error('Webpage transformation route error', error)
    
    // Create user-friendly error response
    const userFriendlyError = ErrorMapper.mapError(error);
    
    // Handle specific known errors
    if (error instanceof Error) {
      if (error.message.includes('OpenAI API key is not configured')) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: 'Our AI service is currently unavailable. Please try again later.',
          errorCode: ErrorCode.SERVICE_UNAVAILABLE,
          timestamp: new Date()
        });
        return;
      }
    }
    
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: userFriendlyError.message,
      errorCode: userFriendlyError.code,
      timestamp: userFriendlyError.timestamp
    });
    return;
  }
})

/**
 * Transform text content directly using selected persona
 * 
 * Accepts raw text input and applies AI-powered transformation based on
 * the chosen persona's characteristics and prompts. Bypasses web scraping
 * for direct text processing scenarios.
 * 
 * @route POST /text
 * @param {string} text - Raw text content to transform
 * @param {string} persona - Selected persona identifier for transformation
 * @returns {object} Transformed text content or error response
 * @throws {500} Internal server error for processing failures
 */
router.post('/text', /*transformRateLimit,*/ validateBody(transformSchemas.transformText), optionalAuth0, checkUsageLimit(), async (req: Request, res: Response): Promise<void> => {
  logger.transform.info('POST /api/transform/text route hit')

  try {
    const { text, persona } = req.body
    const mongoUser = (req as Request & { userContext?: { mongoUser?: { _id?: { toString(): string } } } }).userContext?.mongoUser
    const userId = mongoUser?._id?.toString()

    const transformationService = createTransformationService()
    const result = await transformationService.transformText({
      text,
      persona,
      userId
    })

    if (result.success && result.data) {
      res.json(result.data);
      return;
    } else {
      // Use enhanced error information from service
      const statusCode = result.errorCode === ErrorCode.INVALID_TEXT ? HttpStatus.BAD_REQUEST :
                        result.errorCode === ErrorCode.TRANSFORMATION_FAILED ? HttpStatus.INTERNAL_SERVER_ERROR :
                        HttpStatus.INTERNAL_SERVER_ERROR;

      res.status(statusCode).json({
        success: false,
        error: result.error || 'Failed to transform text. Please try again.',
        errorCode: result.errorCode,
        details: result.details,
        timestamp: new Date()
      });
      return;
    }

  } catch (error) {
    logger.transform.error('Text transformation route error', error)
    
    // Create user-friendly error response
    const userFriendlyError = ErrorMapper.mapError(error);
    
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: userFriendlyError.message,
      errorCode: userFriendlyError.code,
      timestamp: userFriendlyError.timestamp
    });
    return;
  }
})

// Development and debugging endpoints (non-production environment only)
if (process.env.NODE_ENV !== 'production') {
  /**
   * Get cache statistics for debugging purposes
   * 
   * @route GET /cache/stats
   * @returns {object} Cache performance and usage statistics
   * @access Development environment only
   */
  router.get('/cache/stats', (_req: Request, res: Response) => {
    try {
      const stats = cacheService.getCacheStats()
      sendSuccess(res, { cacheStats: stats })
    } catch (error) {
      logger.transform.error('Error getting cache stats', error)
      sendInternalError(res, 'Failed to get cache statistics')
    }
  })

  /**
   * Clear all application caches for debugging purposes
   * 
   * @route DELETE /cache
   * @returns {object} Success confirmation of cache clearing
   * @access Development environment only
   */
  router.delete('/cache', (_req: Request, res: Response) => {
    try {
      cacheService.clearAllCaches()
      sendSuccess(res, null, 'All caches cleared')
    } catch (error) {
      logger.transform.error('Error clearing cache', error)
      sendInternalError(res, 'Failed to clear cache')
    }
  })
}

export default router
