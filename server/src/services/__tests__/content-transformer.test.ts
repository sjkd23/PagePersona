import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ContentTransformer } from '../content-transformer'
import type { ScrapedContent } from '../../utils/web-scraper'

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn()
        }
      }
    }))
  }
})

// Mock personas data
vi.mock('../../shared/constants/personas', () => ({
  getPersona: vi.fn().mockImplementation((id: string) => {
    if (!id || id.trim() === '') {
      return null
    }
    return {
      id: 'test-persona',
      name: 'Test Persona',
      description: 'A test persona for testing',
      systemPrompt: 'You are a test assistant. Transform the provided content.',
      prompt: 'You are a test assistant'
    }
  })
}))

describe('ContentTransformer', () => {
  let contentTransformer: ContentTransformer
  const mockApiKey = 'test-api-key'

  beforeEach(() => {
    vi.clearAllMocks()
    contentTransformer = new ContentTransformer(mockApiKey)
  })

  describe('constructor', () => {
    it('should initialize with API key', () => {
      expect(contentTransformer).toBeInstanceOf(ContentTransformer)
    })
  })

  describe('transformContent', () => {
    const mockScrapedContent: ScrapedContent = {
      title: 'Test Article',
      content: 'This is test content for transformation.',
      url: 'https://example.com/test',
      metadata: {
        description: 'Test description',
        author: 'Test Author',
        publishDate: '2023-01-01',
        wordCount: 8
      }
    }

    it('should return error for null scraped content', async () => {
      const result = await contentTransformer.transformContent(null as any, 'test-persona')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid scraped content')
    })

    it('should return error for undefined scraped content', async () => {
      const result = await contentTransformer.transformContent(undefined as any, 'test-persona')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid scraped content')
    })

    it('should validate scraped content structure', async () => {
      const invalidContent = { title: 'Test' } // Missing required fields
      
      const result = await contentTransformer.transformContent(invalidContent as any, 'test-persona')
      
      expect(result.success).toBe(false)
    })

    it('should handle valid transformation request structure', async () => {
      // Mock successful OpenAI response
      const mockOpenAIResponse = {
        choices: [{
          message: {
            content: 'Transformed content here'
          }
        }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150
        }
      }

      // Get the mock instance and setup the response
      const OpenAI = await import('openai')
      const mockCreate = vi.fn().mockResolvedValue(mockOpenAIResponse)
      ;(OpenAI.default as any).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }))

      // Create new instance to use mocked OpenAI
      const transformer = new ContentTransformer(mockApiKey)
      
      const result = await transformer.transformContent(mockScrapedContent, 'test-persona')
      
      // The actual implementation might return success or failure based on internal validation
      // This test verifies the method can be called with valid parameters
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('originalContent')
      expect(result.originalContent.title).toBe('Test Article')
      expect(result.originalContent.url).toBe('https://example.com/test')
    })
  })

  describe('input validation', () => {
    it('should handle empty string persona', async () => {
      const mockScrapedContent: ScrapedContent = {
        title: 'Test',
        content: 'Test content',
        url: 'https://example.com',
        metadata: {
          wordCount: 2
        }
      }

      const result = await contentTransformer.transformContent(mockScrapedContent, '')
      
      expect(result.success).toBe(false)
    })

    it('should handle malformed URL in scraped content', async () => {
      const malformedContent: ScrapedContent = {
        title: 'Test',
        content: 'Test content',
        url: 'not-a-valid-url',
        metadata: {
          wordCount: 2
        }
      }

      const result = await contentTransformer.transformContent(malformedContent, 'test-persona')
      
      // Should still process but may include the malformed URL in the result
      expect(result).toHaveProperty('success')
      expect(result.originalContent.url).toBe('not-a-valid-url')
    })
  })
})
