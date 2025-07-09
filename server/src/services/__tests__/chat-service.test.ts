import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ChatService } from '../chat-service'

// Mock OpenAI
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn()
      }
    }
  }))
}))

// Mock logger
vi.mock('../../utils/logger', () => ({
  logger: {
    openai: {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    }
  }
}))

describe('ChatService', () => {
  let service: ChatService
  const mockApiKey = 'test-api-key'

  beforeEach(() => {
    vi.clearAllMocks()
    service = new ChatService(mockApiKey)
  })

  describe('sendChatMessages', () => {
    it('should validate messages and return success response', async () => {
      const mockMessages = [
        { role: 'user' as const, content: 'Hello' },
        { role: 'assistant' as const, content: 'Hi there!' }
      ]

      const mockCompletion = {
        choices: [{ message: { content: 'Test response' } }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15
        }
      }

      // Mock the OpenAI response
      const mockCreate = vi.fn().mockResolvedValue(mockCompletion)
      service['openai'].chat.completions.create = mockCreate

      const result = await service.sendChatMessages({
        messages: mockMessages,
        model: 'gpt-4o-mini'
      })

      expect(result.success).toBe(true)
      expect(result.message).toBe('Test response')
      expect(result.usage).toEqual(mockCompletion.usage)
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        messages: mockMessages,
        max_tokens: 1000,
        temperature: 0.7
      })
    })

    it('should validate message structure and reject invalid messages', async () => {
      const invalidMessages = [
        { role: 'invalid' as any, content: 'Hello' }
      ]

      const result = await service.sendChatMessages({
        messages: invalidMessages
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('invalid role')
    })

    it('should reject empty messages array', async () => {
      const result = await service.sendChatMessages({
        messages: []
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Messages array is required')
    })

    it('should handle OpenAI API errors', async () => {
      const mockMessages = [
        { role: 'user' as const, content: 'Hello' }
      ]

      const mockCreate = vi.fn().mockRejectedValue(new Error('API Error'))
      service['openai'].chat.completions.create = mockCreate

      const result = await service.sendChatMessages({
        messages: mockMessages
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('API Error')
    })
  })
})
