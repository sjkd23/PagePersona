import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Request, Response } from 'express'
import promptCall from './prompt-call'

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

describe('promptCall', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockJson: ReturnType<typeof vi.fn>
  let mockStatus: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock environment variables
    process.env.OPENAI_API_KEY = 'test-api-key'
    
    mockJson = vi.fn()
    mockStatus = vi.fn().mockReturnValue({ json: mockJson })
    
    mockReq = {
      body: {}
    }
    
    mockRes = {
      status: mockStatus,
      json: mockJson
    }
  })

  describe('API key validation', () => {
    it('should return error when API key is missing', async () => {
      delete process.env.OPENAI_API_KEY
      
      await promptCall(mockReq as Request, mockRes as Response)
      
      expect(mockStatus).toHaveBeenCalledWith(500)
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "OpenAI API key is not configured"
      })
    })

    it('should proceed when API key is present', async () => {
      process.env.OPENAI_API_KEY = 'test-key'
      mockReq.body = {
        messages: [
          { role: 'user', content: 'Hello' }
        ]
      }
      
      await promptCall(mockReq as Request, mockRes as Response)
      
      // Should not return the API key error
      expect(mockJson).not.toHaveBeenCalledWith({
        success: false,
        error: "OpenAI API key is not configured"
      })
    })
  })

  describe('message validation', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'test-key'
    })

    it('should return error when messages is undefined', async () => {
      mockReq.body = {}
      
      await promptCall(mockReq as Request, mockRes as Response)
      
      expect(mockStatus).toHaveBeenCalledWith(400)
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Messages array is required and cannot be empty"
      })
    })

    it('should return error when messages is not an array', async () => {
      mockReq.body = {
        messages: "not an array"
      }
      
      await promptCall(mockReq as Request, mockRes as Response)
      
      expect(mockStatus).toHaveBeenCalledWith(400)
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Messages array is required and cannot be empty"
      })
    })

    it('should return error when messages array is empty', async () => {
      mockReq.body = {
        messages: []
      }
      
      await promptCall(mockReq as Request, mockRes as Response)
      
      expect(mockStatus).toHaveBeenCalledWith(400)
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Messages array is required and cannot be empty"
      })
    })

    it('should return error when message has invalid role', async () => {
      mockReq.body = {
        messages: [
          { role: 'invalid', content: 'Hello' }
        ]
      }
      
      await promptCall(mockReq as Request, mockRes as Response)
      
      expect(mockStatus).toHaveBeenCalledWith(400)
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Message at index 0 has invalid role: invalid. Must be one of: system, user, assistant"
      })
    })

    it('should return error when message has no content', async () => {
      mockReq.body = {
        messages: [
          { role: 'user' }
        ]
      }
      
      await promptCall(mockReq as Request, mockRes as Response)
      
      expect(mockStatus).toHaveBeenCalledWith(400)
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Message at index 0 has invalid content"
      })
    })

    it('should accept valid message formats', async () => {
      const validMessages = [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' }
      ]
      
      mockReq.body = {
        messages: validMessages
      }
      
      await promptCall(mockReq as Request, mockRes as Response)
      
      // Should not return validation errors
      expect(mockJson).not.toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Message at index')
        })
      )
    })
  })

  describe('OpenAI integration', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'test-key'
    })

    it('should handle successful OpenAI response', async () => {
      const mockOpenAIResponse = {
        choices: [{
          message: {
            content: 'Test response from OpenAI'
          }
        }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15
        }
      }

      // Mock OpenAI to return successful response
      const OpenAI = await import('openai')
      const mockCreate = vi.fn().mockResolvedValue(mockOpenAIResponse)
      ;(OpenAI.default as any).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }))

      mockReq.body = {
        messages: [{ role: 'user', content: 'Hello' }]
      }
      
      await promptCall(mockReq as Request, mockRes as Response)
      
      expect(mockStatus).toHaveBeenCalledWith(200)
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Test response from OpenAI',
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15
        }
      })
    })

    it('should handle OpenAI API errors', async () => {
      // Mock OpenAI to throw an error
      const OpenAI = await import('openai')
      const mockCreate = vi.fn().mockRejectedValue(new Error('OpenAI API Error'))
      ;(OpenAI.default as any).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }))

      mockReq.body = {
        messages: [{ role: 'user', content: 'Hello' }]
      }
      
      await promptCall(mockReq as Request, mockRes as Response)
      
      expect(mockStatus).toHaveBeenCalledWith(500)
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Internal server error",
        details: "OpenAI API Error"
      })
    })

    it('should handle empty OpenAI response', async () => {
      const mockOpenAIResponse = {
        choices: [],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 0,
          total_tokens: 10
        }
      }

      const OpenAI = await import('openai')
      const mockCreate = vi.fn().mockResolvedValue(mockOpenAIResponse)
      ;(OpenAI.default as any).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }))

      mockReq.body = {
        messages: [{ role: 'user', content: 'Hello' }]
      }
      
      await promptCall(mockReq as Request, mockRes as Response)
      
      expect(mockStatus).toHaveBeenCalledWith(500)
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "No response generated"
      })
    })
  })

  describe('parameter handling', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'test-key'
    })

    it('should use default parameters when not provided', async () => {
      const OpenAI = await import('openai')
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [{ message: { content: 'test' } }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 }
      })
      ;(OpenAI.default as any).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }))

      mockReq.body = {
        messages: [{ role: 'user', content: 'Hello' }]
      }
      
      await promptCall(mockReq as Request, mockRes as Response)
      
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 1000,
        temperature: 0.7
      })
    })

    it('should use custom parameters when provided', async () => {
      const OpenAI = await import('openai')
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [{ message: { content: 'test' } }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 }
      })
      ;(OpenAI.default as any).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }))

      mockReq.body = {
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'gpt-4',
        maxTokens: 500,
        temperature: 0.5
      }
      
      await promptCall(mockReq as Request, mockRes as Response)
      
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 500,
        temperature: 0.5
      })
    })
  })
})
