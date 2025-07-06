import express from 'express'
import { Request, Response } from 'express'
import { WebScraper } from '../utilities/webScraper'
import { ContentTransformer } from '../services/contentTransformer'
import { cacheService } from '../services/cacheService'
import { getAllPersonas } from '../data/personas'
import { optionalAuth0 } from '../middleware/auth0Middleware'
import { MongoUser } from '../models/MongoUser'
import { incrementUserUsage } from '../utils/usageTracking'

const router = express.Router()

// Get all available personas
router.get('/personas', (_req: Request, res: Response) => {
  try {
    const personas = getAllPersonas().map(persona => ({
      id: persona.id,
      name: persona.name,
      description: persona.description
    }))

    res.json({
      success: true,
      personas
    })
  } catch (error) {
    console.error('Error fetching personas:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch personas'
    })
  }
})

// Transform webpage content with selected persona
router.post('/', optionalAuth0 as any, async (req: any, res: Response): Promise<void> => {
  try {
    const { url, persona } = req.body
    const userContext = req.userContext
    const mongoUser = userContext?.mongoUser

    if (!url || !persona) {
      res.status(400).json({
        success: false,
        error: 'URL and persona are required'
      })
      return
    }

    if (typeof url !== 'string' || typeof persona !== 'string') {
      res.status(400).json({
        success: false,
        error: 'URL and persona must be strings'
      })
      return
    }

    // Check cache for existing transformation
    const cachedResult = cacheService.getCachedTransformation(url, persona)
    if (cachedResult) {
      // Track usage for authenticated users even on cache hits
      if (mongoUser?._id) {
        await incrementUserUsage(mongoUser._id.toString(), { logSuccess: true });
      }
      
      res.json(cachedResult)
      return
    }

    // Get or scrape content
    let scrapedContent = cacheService.getCachedContent(url)
    
    if (!scrapedContent) {
      scrapedContent = await WebScraper.scrapeWebpage(url)
      cacheService.setCachedContent(url, scrapedContent)
    }

    // Validate OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      res.status(500).json({
        success: false,
        error: 'OpenAI API key is not configured'
      })
      return
    }

    const transformer = new ContentTransformer(apiKey)
    
    // Transform the content
    console.log(`Transforming content with persona: ${persona}`)
    const result = await transformer.transformContent(scrapedContent, persona)
    
    // Cache the successful transformation
    if (result.success) {
      cacheService.setCachedTransformation(url, persona, result)
      
      // Track usage for authenticated users
      if (mongoUser?._id) {
        await incrementUserUsage(mongoUser._id.toString(), { logSuccess: true });
      }
    }

    res.json(result)

  } catch (error) {
    console.error('Transformation route error:', error)
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Invalid URL')) {
        res.status(400).json({
          success: false,
          error: 'Invalid URL format. Please provide a valid website URL.'
        })
        return
      }
      
      if (error.message.includes('Private or internal URLs')) {
        res.status(400).json({
          success: false,
          error: 'Private or internal URLs are not allowed for security reasons.'
        })
        return
      }
      
      if (error.message.includes('not found') || error.message.includes('404')) {
        res.status(404).json({
          success: false,
          error: 'The webpage could not be found. Please check the URL and try again.'
        })
        return
      }
      
      if (error.message.includes('forbidden') || error.message.includes('403')) {
        res.status(403).json({
          success: false,
          error: 'Access to this webpage is forbidden. The site may block automated requests.'
        })
        return
      }
    }

    res.status(500).json({
      success: false,
      error: 'Failed to transform webpage content. Please try again later.'
    })
  }
})

// POST /api/transform/text - Transform text content directly with selected persona
router.post('/text', optionalAuth0 as any, async (req: any, res: Response): Promise<void> => {
  try {
    const { text, persona } = req.body
    const userContext = req.userContext // Will be set if user is authenticated
    const mongoUser = userContext?.mongoUser

    // Validate request
    if (!text || !persona) {
      res.status(400).json({
        success: false,
        error: 'Text and persona are required'
      })
      return
    }

    if (typeof text !== 'string' || typeof persona !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Text and persona must be strings'
      })
      return
    }

    // Initialize content transformer
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      res.status(500).json({
        success: false,
        error: 'OpenAI API key is not configured'
      })
      return
    }

    const transformer = new ContentTransformer(apiKey)
    
    // Transform the text content directly
    console.log(`Transforming text content with persona: ${persona}`)
    const result = await transformer.transformText(text.trim(), persona)
    
    // Track usage for authenticated users
    if (result.success && mongoUser?._id) {
      await incrementUserUsage(mongoUser._id.toString(), { logSuccess: true });
    }

    res.json(result)

  } catch (error) {
    console.error('Text transformation route error:', error)
    
    res.status(500).json({
      success: false,
      error: 'Failed to transform text. Please try again.'
    })
  }
})

// GET /api/transform/cache/stats - Get cache statistics (for debugging)
router.get('/cache/stats', (_req: Request, res: Response) => {
  try {
    const stats = cacheService.getCacheStats()
    res.json({
      success: true,
      cacheStats: stats
    })
  } catch (error) {
    console.error('Error getting cache stats:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get cache statistics'
    })
  }
})

// DELETE /api/transform/cache - Clear all caches (for debugging)
router.delete('/cache', (_req: Request, res: Response) => {
  try {
    cacheService.clearAllCaches()
    res.json({
      success: true,
      message: 'All caches cleared'
    })
  } catch (error) {
    console.error('Error clearing cache:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache'
    })
  }
})

export default router
