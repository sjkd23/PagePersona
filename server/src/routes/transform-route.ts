import express, { Request, Response, NextFunction } from 'express'
import { getAllPersonas } from '../data/personas'
import { optionalAuth0 } from '../middleware/auth0-middleware'
import { checkUsageLimit } from '../middleware/usage-limit-middleware'
import { createTieredRateLimit, getUserMembershipTierSync } from '../config/rate-limit-configs'
import { sendSuccess, sendInternalError } from '../utils/response-helpers'
import { validateBody } from '../middleware/zod-validation'
import { transformSchemas } from '../middleware/validation-schemas'
import { logger } from '../utils/logger'
import { HttpStatus } from '../constants/http-status'
import { createTransformationService } from '../services/transformation-service'
import { cacheService } from '../services/cache-service'
import type { AuthenticatedRequest } from '../types/common'

const router = express.Router()

// Create tiered rate limiters based on membership
const transformRateLimit = createTieredRateLimit('transform', getUserMembershipTierSync)
const apiRateLimit = createTieredRateLimit('api', getUserMembershipTierSync)

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

// Test endpoint for health checks
router.get('/test', (_req: Request, res: Response) => {
  sendSuccess(res, { message: 'Transform routes are working' })
})

// Get all available personas
router.get('/personas', (_req: Request, res: Response) => {
  try {
    const personas = getAllPersonas().map(persona => ({
      id: persona.id,
      name: persona.name,
      description: persona.description
    }))

    sendSuccess(res, { personas })
  } catch (error) {
    logger.transform.error('Error fetching personas', error)
    sendInternalError(res, 'Failed to fetch personas')
  }
})

// Transform webpage content with selected persona
router.post('/', /*transformRateLimit,*/ validateBody(transformSchemas.transformUrl), optionalAuth0, checkUsageLimit(), async (req: Request, res: Response): Promise<void> => {
  logger.transform.info('POST /api/transform route hit')
  
  try {
    const { url, persona } = req.body
    const mongoUser = (req as any).userContext?.mongoUser
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
      // Service failed completely - return appropriate error status
      const statusCode = result.error?.includes('Invalid URL') ? HttpStatus.BAD_REQUEST :
                        result.error?.includes('Private or internal URLs') ? HttpStatus.BAD_REQUEST :
                        result.error?.includes('not found') || result.error?.includes('404') ? HttpStatus.NOT_FOUND :
                        result.error?.includes('forbidden') || result.error?.includes('403') ? HttpStatus.FORBIDDEN :
                        result.error?.includes('OpenAI API key is not configured') ? HttpStatus.INTERNAL_SERVER_ERROR :
                        HttpStatus.INTERNAL_SERVER_ERROR

      res.status(statusCode).json({
        success: false,
        error: result.error || 'Failed to transform webpage content. Please try again later.'
      });
      return;
    }

  } catch (error) {
    logger.transform.error('Webpage transformation route error', error)
    
    // Handle specific known errors
    if (error instanceof Error) {
      if (error.message.includes('OpenAI API key is not configured')) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: 'OpenAI API key is not configured'
        });
        return;
      }
    }
    
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Failed to transform webpage content. Please try again later.'
    });
    return;
  }
})

// POST /api/transform/text - Transform text content directly with selected persona
router.post('/text', /*transformRateLimit,*/ validateBody(transformSchemas.transformText), optionalAuth0, checkUsageLimit(), async (req: Request, res: Response): Promise<void> => {
  logger.transform.info('POST /api/transform/text route hit')

  try {
    const { text, persona } = req.body
    const mongoUser = (req as any).userContext?.mongoUser
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
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: result.error || 'Failed to transform text. Please try again.'
      });
      return;
    }

  } catch (error) {
    logger.transform.error('Text transformation route error', error)
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Failed to transform text. Please try again.'
    });
    return;
  }
})

// Debug/development endpoints (non-production only)
if (process.env.NODE_ENV !== 'production') {
  // GET /api/transform/cache/stats - Get cache statistics (for debugging)
  router.get('/cache/stats', (_req: Request, res: Response) => {
    try {
      const stats = cacheService.getCacheStats()
      sendSuccess(res, { cacheStats: stats })
    } catch (error) {
      logger.transform.error('Error getting cache stats', error)
      sendInternalError(res, 'Failed to get cache statistics')
    }
  })

  // DELETE /api/transform/cache - Clear all caches (for debugging)
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
