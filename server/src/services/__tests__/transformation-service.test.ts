import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TransformationService } from '../transformation-service'
import { ContentTransformer } from '../content-transformer'
import { WebScraper } from '../../utils/web-scraper'
import { cacheService } from '../cache-service'
import { incrementUserUsage } from '../../utils/usage-tracking'

// Mock dependencies
vi.mock('../content-transformer')
vi.mock('../../utils/web-scraper')
vi.mock('../cache-service')
vi.mock('../../utils/usage-tracking')
vi.mock('../../../shared/constants/personas', () => ({
  getPersona: vi.fn().mockReturnValue({
    id: 'test-persona',
    name: 'Test Persona',
    description: 'A test persona for testing',
    systemPrompt: 'You are a helpful test assistant.'
  })
}))
vi.mock('../../utils/logger', () => ({
  logger: {
    transform: {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    }
  }
}))

const MockedContentTransformer = ContentTransformer as any
const MockedWebScraper = WebScraper as any
const mockedCacheService = cacheService as any
const mockedIncrementUserUsage = incrementUserUsage as any

describe('TransformationService', () => {
  let service: TransformationService
  let mockTransformer: any
  const mockApiKey = 'test-api-key'

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup the transformer mock that will be returned by the ContentTransformer constructor
    mockTransformer = {
      transformContent: vi.fn(),
      transformText: vi.fn()
    }
    
    // Mock the ContentTransformer constructor to return our mock
    vi.mocked(MockedContentTransformer).mockImplementation(() => mockTransformer)
    
    service = new TransformationService(mockApiKey)
  })

  describe('transformWebpage', () => {
    it('should return cached result when available', async () => {
      const mockCachedResult = {
        success: true,
        originalContent: { title: 'Test', content: 'content', url: 'test.com', wordCount: 1 },
        transformedContent: 'transformed',
        persona: { id: 'test', name: 'Test', description: 'Test persona' }
      }

      mockedCacheService.getCachedTransformation.mockReturnValue(mockCachedResult)

      const result = await service.transformWebpage({
        url: 'https://test.com',
        persona: 'test-persona',
        userId: 'user123'
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockCachedResult)
      expect(result.cached).toBe(true)
      expect(mockedIncrementUserUsage).toHaveBeenCalledWith('user123', { logSuccess: true })
    })

    it('should scrape and transform content when not cached', async () => {
      const mockScrapedContent = {
        title: 'Test Page',
        content: 'Test content',
        url: 'https://test.com',
        metadata: { wordCount: 2 }
      }

      const mockTransformResult = {
        success: true,
        originalContent: { title: 'Test Page', content: 'Test content', url: 'https://test.com', wordCount: 2 },
        transformedContent: 'Transformed content',
        persona: { id: 'test', name: 'Test', description: 'Test persona' }
      }

      mockedCacheService.getCachedTransformation.mockReturnValue(null)
      mockedCacheService.getCachedContent.mockReturnValue(null)
      MockedWebScraper.scrapeWebpage.mockResolvedValue(mockScrapedContent)
      
      // Setup the mock response for transformContent
      mockTransformer.transformContent.mockResolvedValue(mockTransformResult)

      const result = await service.transformWebpage({
        url: 'https://test.com',
        persona: 'test-persona',
        userId: 'user123'
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockTransformResult)
      expect(MockedWebScraper.scrapeWebpage).toHaveBeenCalledWith('https://test.com')
      expect(mockedCacheService.setCachedContent).toHaveBeenCalledWith('https://test.com', mockScrapedContent)
      expect(mockedCacheService.setCachedTransformation).toHaveBeenCalledWith('https://test.com', 'test-persona', mockTransformResult)
      expect(mockedIncrementUserUsage).toHaveBeenCalledWith('user123', { logSuccess: true })
    })

    it('should handle transformation errors gracefully', async () => {
      const mockScrapedContent = {
        title: 'Test Page',
        content: 'Test content',
        url: 'https://test.com',
        metadata: { wordCount: 2 }
      }

      const mockTransformResult = {
        success: false,
        error: 'Transformation failed',
        originalContent: { title: 'Test Page', content: 'Test content', url: 'https://test.com', wordCount: 2 },
        transformedContent: '',
        persona: { id: 'test', name: 'Test', description: 'Test persona' }
      }

      mockedCacheService.getCachedTransformation.mockReturnValue(null)
      mockedCacheService.getCachedContent.mockReturnValue(mockScrapedContent)
      
      // Setup the mock response for transformContent (failed transformation)
      mockTransformer.transformContent.mockResolvedValue(mockTransformResult)

      const result = await service.transformWebpage({
        url: 'https://test.com',
        persona: 'test-persona',
        userId: 'user123'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Transformation failed')
      expect(mockedCacheService.setCachedTransformation).not.toHaveBeenCalled()
      expect(mockedIncrementUserUsage).not.toHaveBeenCalled()
    })
  })

  describe('transformText', () => {
    it('should transform text successfully', async () => {
      const mockTransformResult = {
        success: true,
        originalContent: { title: '', content: 'test text', url: '', wordCount: 2 },
        transformedContent: 'Transformed text',
        persona: { id: 'test', name: 'Test', description: 'Test persona' }
      }

      // Setup the mock response for transformText
      mockTransformer.transformText.mockResolvedValue(mockTransformResult)

      const result = await service.transformText({
        text: 'test text',
        persona: 'test-persona',
        userId: 'user123'
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockTransformResult)
      expect(mockTransformer.transformText).toHaveBeenCalledWith('test text', 'test-persona')
      expect(mockedIncrementUserUsage).toHaveBeenCalledWith('user123', { logSuccess: true })
    })

    it('should handle text transformation errors', async () => {
      // Setup the mock to reject with an error
      mockTransformer.transformText.mockRejectedValue(new Error('API Error'))

      const result = await service.transformText({
        text: 'test text',
        persona: 'test-persona'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('An unexpected error occurred')
      expect(result.errorCode).toBe('UNKNOWN_ERROR')
    })
  })
})
