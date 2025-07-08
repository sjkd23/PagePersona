import OpenAI from 'openai'
import { logger } from '../utils/logger'

export interface OpenAIRequest {
  systemPrompt: string
  userPrompt: string
  model?: string
  maxTokens?: number
  temperature?: number
  presencePenalty?: number
  frequencyPenalty?: number
}

export interface OpenAIResponse {
  content: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  finishReason?: string
}

export class OpenAIClientService {
  private openai: OpenAI

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required')
    }
    this.openai = new OpenAI({ apiKey })
  }

  async generateCompletion(request: OpenAIRequest): Promise<OpenAIResponse> {
    const {
      systemPrompt,
      userPrompt,
      model = 'gpt-4o',
      maxTokens = 2500,
      temperature = 0.7,
      presencePenalty = 0.1,
      frequencyPenalty = 0.1
    } = request

    logger.info('Starting OpenAI completion', {
      model,
      maxTokens,
      temperature,
      systemPromptLength: systemPrompt.length,
      userPromptLength: userPrompt.length
    })

    try {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]

      const completion = await this.openai.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        presence_penalty: presencePenalty,
        frequency_penalty: frequencyPenalty
      })

      const content = completion.choices[0]?.message?.content
      if (content === undefined || content === null) {
        throw new Error('No content received from OpenAI')
      }
      
      // Allow empty strings - we'll handle them in the application layer

      const response: OpenAIResponse = {
        content,
        usage: completion.usage ? {
          prompt_tokens: completion.usage.prompt_tokens,
          completion_tokens: completion.usage.completion_tokens,
          total_tokens: completion.usage.total_tokens
        } : undefined,
        finishReason: completion.choices[0]?.finish_reason
      }

      logger.info('OpenAI completion successful', {
        contentLength: content.length,
        finishReason: response.finishReason,
        usage: response.usage
      })

      return response
    } catch (error) {
      logger.error('OpenAI completion failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        model,
        systemPromptLength: systemPrompt.length,
        userPromptLength: userPrompt.length
      })

      // Re-throw with more context
      if (error instanceof Error) {
        throw new Error(`OpenAI API error: ${error.message}`)
      }
      throw new Error('Unknown OpenAI API error')
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5
      })
      return true
    } catch (error) {
      logger.error('OpenAI connection test failed', { error })
      return false
    }
  }

  getModelInfo() {
    return {
      defaultModel: 'gpt-4o',
      supportedModels: ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo'],
      maxTokens: 2500,
      temperature: 0.7
    }
  }
}
