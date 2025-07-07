import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import transformRoute from './transform-route'

// Mock dependencies
vi.mock('../utils/web-scraper', () => ({
  WebScraper: {
    scrapeWebpage: vi.fn()
  }
}))

vi.mock('../services/content-transformer', () => ({
  ContentTransformer: vi.fn().mockImplementation(() => ({
    transformContent: vi.fn()
  }))
}))

vi.mock('../services/cache-service', () => ({
  cacheService: {
    getCachedTransformation: vi.fn(),
    setCachedTransformation: vi.fn(),
    getCachedContent: vi.fn(),
    setCachedContent: vi.fn()
  }
}))

vi.mock('../data/personas', () => ({
  getAllPersonas: vi.fn().mockReturnValue([
    {
      id: 'professional',
      name: 'Professional',
      description: 'A professional tone',
      prompt: 'Write professionally'
    },
    {
      id: 'casual',
      name: 'Casual',
      description: 'A casual tone',
      prompt: 'Write casually'
    }
  ])
}))

vi.mock('../middleware/auth0Middleware', () => ({
  optionalAuth0: (_req: any, _res: any, next: any) => next()
}))

vi.mock('../models/mongo-user', () => ({
  MongoUser: {
    findOne: vi.fn()
  }
}))

vi.mock('../utils/usageTracking', () => ({
  incrementUserUsage: vi.fn()
}))

// Mock environment variables
const originalEnv = process.env

describe('transformRoute', () => {
  let app: express.Application

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset environment
    process.env = {
      ...originalEnv,
      OPENAI_API_KEY: 'test-api-key'
    }

    // Create test Express app
    app = express()
    app.use(express.json())
    app.use('/api/transform', transformRoute)
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('GET /personas', () => {
    it('should return all available personas', async () => {
      const response = await request(app)
        .get('/api/transform/personas')
        .expect(200)

      expect(response.body).toEqual({
        success: true,
        data: {
          personas: [
            {
              id: 'professional',
              name: 'Professional',
              description: 'A professional tone'
            },
            {
              id: 'casual',
              name: 'Casual',
              description: 'A casual tone'
            }
          ]
        }
      })
    })

    it('should handle errors when fetching personas', async () => {
      const { getAllPersonas } = await import('../data/personas')
      vi.mocked(getAllPersonas).mockImplementation(() => {
        throw new Error('Database error')
      })

      const response = await request(app)
        .get('/api/transform/personas')
        .expect(500)

      expect(response.body).toEqual({
        success: false,
        error: 'Failed to fetch personas'
      })
    })
  })

  describe('GET /test', () => {
    it('should return test response', async () => {
      const response = await request(app)
        .get('/api/transform/test')
        .expect(200)

      expect(response.body).toEqual({
        success: true,
        message: 'Transform routes are working'
      })
    })
  })

  describe('POST /', () => {
    const validRequestBody = {
      url: 'https://example.com/article',
      persona: 'professional'
    }

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/transform')
        .send({})
        .expect(400)

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid input',
        details: expect.objectContaining({
          url: expect.arrayContaining(['Required']),
          persona: expect.arrayContaining(['Required'])
        })
      })
    })

    it('should validate field types', async () => {
      const response = await request(app)
        .post('/api/transform')
        .send({
          url: 123,
          persona: ['invalid']
        })
        .expect(400)

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid input',
        details: expect.objectContaining({
          url: expect.arrayContaining(['Expected string, received number']),
          persona: expect.arrayContaining(['Expected string, received array'])
        })
      })
    })

    it('should return cached result when available', async () => {
      const { cacheService } = await import('../services/cache-service')
      const cachedResult = {
        success: true,
        transformedContent: 'Cached transformed content',
        originalContent: {
          title: 'Test Article',
          content: 'Test content',
          url: 'https://example.com/article',
          wordCount: 2
        },
        persona: {
          id: 'professional',
          name: 'Professional',
          description: 'A professional tone'
        }
      }

      vi.mocked(cacheService.getCachedTransformation).mockReturnValue(cachedResult)

      const response = await request(app)
        .post('/api/transform')
        .send(validRequestBody)
        .expect(200)

      expect(response.body).toEqual(cachedResult)
      expect(cacheService.getCachedTransformation).toHaveBeenCalledWith(
        'https://example.com/article',
        'professional'
      )
    })

    it('should handle missing OpenAI API key', async () => {
      delete process.env.OPENAI_API_KEY

      const { cacheService } = await import('../services/cache-service')
      vi.mocked(cacheService.getCachedTransformation).mockReturnValue(null)
      vi.mocked(cacheService.getCachedContent).mockReturnValue(null)

      const response = await request(app)
        .post('/api/transform')
        .send(validRequestBody)
        .expect(500)

      expect(response.body).toEqual({
        success: false,
        error: 'OpenAI API key is not configured'
      })
    })

    it('should perform fresh transformation when no cache exists', async () => {
      const { cacheService } = await import('../services/cache-service')
      const { WebScraper } = await import('../utils/web-scraper')
      const { ContentTransformer } = await import('../services/content-transformer')

      const mockScrapedContent = {
        title: 'Test Article',
        content: 'This is test content',
        url: 'https://example.com/article',
        metadata: {
          wordCount: 4
        }
      }

      const mockTransformResult = {
        success: true,
        transformedContent: 'Transformed content',
        originalContent: {
          title: 'Test Article',
          content: 'This is test content',
          url: 'https://example.com/article',
          wordCount: 4
        },
        persona: {
          id: 'professional',
          name: 'Professional',
          description: 'A professional tone'
        }
      }

      // Mock cache misses
      vi.mocked(cacheService.getCachedTransformation).mockReturnValue(null)
      vi.mocked(cacheService.getCachedContent).mockReturnValue(null)

      // Mock web scraping
      vi.mocked(WebScraper.scrapeWebpage).mockResolvedValue(mockScrapedContent)

      // Mock content transformation
      const mockTransformContent = vi.fn().mockResolvedValue(mockTransformResult)
      vi.mocked(ContentTransformer).mockImplementation(() => ({
        transformContent: mockTransformContent
      }) as any)

      const response = await request(app)
        .post('/api/transform')
        .send(validRequestBody)
        .expect(200)

      expect(response.body).toEqual(mockTransformResult)
      expect(WebScraper.scrapeWebpage).toHaveBeenCalledWith('https://example.com/article')
      expect(mockTransformContent).toHaveBeenCalledWith(mockScrapedContent, 'professional')
      expect(cacheService.setCachedContent).toHaveBeenCalledWith('https://example.com/article', mockScrapedContent)
      expect(cacheService.setCachedTransformation).toHaveBeenCalledWith('https://example.com/article', 'professional', mockTransformResult)
    })

    it('should use cached scraped content when available', async () => {
      const { cacheService } = await import('../services/cache-service')
      const { WebScraper } = await import('../utils/web-scraper')
      const { ContentTransformer } = await import('../services/content-transformer')

      const mockScrapedContent = {
        title: 'Cached Article',
        content: 'Cached content',
        url: 'https://example.com/article',
        metadata: {
          wordCount: 2
        }
      }

      const mockTransformResult = {
        success: true,
        transformedContent: 'Transformed cached content',
        originalContent: {
          title: 'Cached Article',
          content: 'Cached content',
          url: 'https://example.com/article',
          wordCount: 2
        },
        persona: {
          id: 'professional',
          name: 'Professional',
          description: 'A professional tone'
        }
      }

      // Mock transformation cache miss, but content cache hit
      vi.mocked(cacheService.getCachedTransformation).mockReturnValue(null)
      vi.mocked(cacheService.getCachedContent).mockReturnValue(mockScrapedContent)

      // Mock content transformation
      const mockTransformContent = vi.fn().mockResolvedValue(mockTransformResult)
      vi.mocked(ContentTransformer).mockImplementation(() => ({
        transformContent: mockTransformContent
      }) as any)

      const response = await request(app)
        .post('/api/transform')
        .send(validRequestBody)
        .expect(200)

      expect(response.body).toEqual(mockTransformResult)
      expect(WebScraper.scrapeWebpage).not.toHaveBeenCalled()
      expect(mockTransformContent).toHaveBeenCalledWith(mockScrapedContent, 'professional')
    })

    it('should handle transformation errors gracefully', async () => {
      const { cacheService } = await import('../services/cache-service')
      const { WebScraper } = await import('../utils/web-scraper')
      const { ContentTransformer } = await import('../services/content-transformer')

      const mockScrapedContent = {
        title: 'Test Article',
        content: 'This is test content',
        url: 'https://example.com/article',
        metadata: {
          wordCount: 4
        }
      }

      const mockTransformResult = {
        success: false,
        error: 'OpenAI API error',
        originalContent: {
          title: 'Test Article',
          content: 'This is test content',
          url: 'https://example.com/article',
          wordCount: 4
        },
        persona: {
          id: 'professional',
          name: 'Professional',
          description: 'A professional tone'
        },
        transformedContent: ''
      }

      // Mock cache misses
      vi.mocked(cacheService.getCachedTransformation).mockReturnValue(null)
      vi.mocked(cacheService.getCachedContent).mockReturnValue(null)

      // Mock web scraping
      vi.mocked(WebScraper.scrapeWebpage).mockResolvedValue(mockScrapedContent)

      // Mock failed transformation
      const mockTransformContent = vi.fn().mockResolvedValue(mockTransformResult)
      vi.mocked(ContentTransformer).mockImplementation(() => ({
        transformContent: mockTransformContent
      }) as any)

      const response = await request(app)
        .post('/api/transform')
        .send(validRequestBody)
        .expect(200)

      expect(response.body).toEqual(mockTransformResult)
      expect(cacheService.setCachedTransformation).not.toHaveBeenCalled() // Should not cache failed transformations
    })

    it('should handle scraping errors', async () => {
      const { cacheService } = await import('../services/cache-service')
      const { WebScraper } = await import('../utils/web-scraper')

      // Mock cache misses
      vi.mocked(cacheService.getCachedTransformation).mockReturnValue(null)
      vi.mocked(cacheService.getCachedContent).mockReturnValue(null)

      // Mock scraping error
      vi.mocked(WebScraper.scrapeWebpage).mockRejectedValue(new Error('Scraping failed'))

      const response = await request(app)
        .post('/api/transform')
        .send(validRequestBody)
        .expect(500)

      expect(response.body).toEqual({
        success: false,
        error: 'Failed to transform webpage content. Please try again later.'
      })
    })
  })
})
