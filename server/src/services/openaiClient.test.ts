import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenAIClientService } from './openaiClient';
import OpenAI from 'openai';

// Mock OpenAI
vi.mock('openai');
const MockedOpenAI = vi.mocked(OpenAI);

describe('OpenAIClientService', () => {
  let openaiService: OpenAIClientService;
  let mockOpenAIInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockOpenAIInstance = {
      chat: {
        completions: {
          create: vi.fn()
        }
      }
    };
    
    MockedOpenAI.mockImplementation(() => mockOpenAIInstance);
    openaiService = new OpenAIClientService('test-api-key');
  });

  describe('constructor', () => {
    it('should create instance with valid API key', () => {
      expect(() => new OpenAIClientService('valid-key')).not.toThrow();
      expect(MockedOpenAI).toHaveBeenCalledWith({ apiKey: 'valid-key' });
    });

    it('should throw error with empty API key', () => {
      expect(() => new OpenAIClientService('')).toThrow('OpenAI API key is required');
    });

    it('should throw error with null API key', () => {
      expect(() => new OpenAIClientService(null as any)).toThrow('OpenAI API key is required');
    });
  });

  describe('generateCompletion', () => {
    const mockRequest = {
      systemPrompt: 'You are a helpful assistant.',
      userPrompt: 'Explain quantum physics simply.',
    };

    it('should generate completion successfully', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Quantum physics is the study of very small particles.'
          },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: 50,
          completion_tokens: 25,
          total_tokens: 75
        }
      };

      mockOpenAIInstance.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await openaiService.generateCompletion(mockRequest);

      expect(result).toEqual({
        content: 'Quantum physics is the study of very small particles.',
        usage: {
          prompt_tokens: 50,
          completion_tokens: 25,
          total_tokens: 75
        },
        finishReason: 'stop'
      });
    });

    it('should use default parameters when not specified', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
      };

      mockOpenAIInstance.chat.completions.create.mockResolvedValue(mockResponse);

      await openaiService.generateCompletion(mockRequest);

      expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4o',
        max_tokens: 2500,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Explain quantum physics simply.' }
        ]
      });
    });

    it('should use custom parameters when provided', async () => {
      const customRequest = {
        ...mockRequest,
        model: 'gpt-3.5-turbo',
        maxTokens: 1000,
        temperature: 0.5,
        presencePenalty: 0.2,
        frequencyPenalty: 0.3
      };

      const mockResponse = {
        choices: [{ message: { content: 'Custom response' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 15, completion_tokens: 10, total_tokens: 25 }
      };

      mockOpenAIInstance.chat.completions.create.mockResolvedValue(mockResponse);

      await openaiService.generateCompletion(customRequest);

      expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        max_tokens: 1000,
        temperature: 0.5,
        presence_penalty: 0.2,
        frequency_penalty: 0.3,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Explain quantum physics simply.' }
        ]
      });
    });

    it('should handle OpenAI API errors', async () => {
      const apiError = new Error('OpenAI API Error: Rate limit exceeded');
      mockOpenAIInstance.chat.completions.create.mockRejectedValue(apiError);

      await expect(openaiService.generateCompletion(mockRequest))
        .rejects.toThrow('OpenAI API error: OpenAI API Error: Rate limit exceeded');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      mockOpenAIInstance.chat.completions.create.mockRejectedValue(timeoutError);

      await expect(openaiService.generateCompletion(mockRequest))
        .rejects.toThrow('OpenAI API error: Request timeout');
    });

    it('should handle responses without usage data', async () => {
      const mockResponse = {
        choices: [{
          message: { content: 'Response without usage' },
          finish_reason: 'stop'
        }]
        // No usage field
      };

      mockOpenAIInstance.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await openaiService.generateCompletion(mockRequest);

      expect(result.content).toBe('Response without usage');
      expect(result.usage).toBeUndefined();
      expect(result.finishReason).toBe('stop');
    });

    it('should handle empty response content', async () => {
      const mockResponse = {
        choices: [{
          message: { content: '' },
          finish_reason: 'stop'
        }],
        usage: { prompt_tokens: 10, completion_tokens: 0, total_tokens: 10 }
      };

      mockOpenAIInstance.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await openaiService.generateCompletion(mockRequest);

      expect(result.content).toBe('');
    });

    it('should handle responses with length finish reason', async () => {
      const mockResponse = {
        choices: [{
          message: { content: 'Truncated response...' },
          finish_reason: 'length'
        }],
        usage: { prompt_tokens: 50, completion_tokens: 2500, total_tokens: 2550 }
      };

      mockOpenAIInstance.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await openaiService.generateCompletion(mockRequest);

      expect(result.finishReason).toBe('length');
      expect(result.content).toBe('Truncated response...');
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle malformed OpenAI responses', async () => {
      const malformedResponse = {
        choices: []  // Empty choices array
      };

      mockOpenAIInstance.chat.completions.create.mockResolvedValue(malformedResponse);

      await expect(openaiService.generateCompletion({
        systemPrompt: 'System',
        userPrompt: 'User'
      })).rejects.toThrow('OpenAI API error: No content received from OpenAI');
    });

    it('should handle very long prompts', async () => {
      const longRequest = {
        systemPrompt: 'System prompt. '.repeat(1000),
        userPrompt: 'User prompt. '.repeat(1000),
      };

      const mockResponse = {
        choices: [{ message: { content: 'Response to long prompt' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 5000, completion_tokens: 100, total_tokens: 5100 }
      };

      mockOpenAIInstance.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await openaiService.generateCompletion(longRequest);

      expect(result.content).toBe('Response to long prompt');
      expect(result.usage?.total_tokens).toBe(5100);
    });

    it('should validate prompt parameters', async () => {
      const invalidRequest = {
        systemPrompt: '',  // Empty system prompt
        userPrompt: '',    // Empty user prompt
      };

      await expect(openaiService.generateCompletion(invalidRequest))
        .rejects.toThrow('OpenAI API error:');
    });

    it('should handle network connectivity issues', async () => {
      const networkError = new Error('ECONNREFUSED');
      mockOpenAIInstance.chat.completions.create.mockRejectedValue(networkError);

      await expect(openaiService.generateCompletion({
        systemPrompt: 'System',
        userPrompt: 'User'
      })).rejects.toThrow('OpenAI API error: ECONNREFUSED');
    });
  });
});
