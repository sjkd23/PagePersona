import { ScraperService, type ScrapedContent } from './scraper'
import { ParserService } from './parser'
import { PromptBuilderService } from './promptBuilder'
import { OpenAIClientService } from './openaiClient'
import { getPersona } from '../data/personas'
import { logger } from '../utils/logger'

export interface TransformationRequest {
  url: string
  persona: string
}

export interface TransformationResult {
  success: boolean
  originalContent: {
    title: string
    content: string
    url: string
    wordCount: number
  }
  transformedContent: string
  persona: {
    id: string
    name: string
    description: string
  }
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  error?: string
}

export class ContentTransformer {
  private scraperService: ScraperService
  private openaiService: OpenAIClientService

  constructor(apiKey: string) {
    logger.debug("Initializing ContentTransformer with provided API key")
    this.scraperService = new ScraperService()
    this.openaiService = new OpenAIClientService(apiKey)
  }

  async transformContent(
    scrapedContent: ScrapedContent, 
    personaId: string
  ): Promise<TransformationResult> {
    console.log("📊 === ContentTransformer.transformContent() STARTED ===")
    console.log("📨 transformContent() called with:", {
      title: scrapedContent?.title || 'MISSING',
      url: scrapedContent?.url || 'MISSING', 
      personaId,
      hasScrapedContent: !!scrapedContent
    })

    try {
      // 1. Validate input
      if (!scrapedContent || !scrapedContent.content?.trim()) {
        return this.createErrorResult(
          'Invalid scraped content: content is null, undefined, or empty',
          scrapedContent,
          personaId
        )
      }

      // 2. Parse and clean content
      const parsedContent = ParserService.parseWebContent(
        scrapedContent.title,
        scrapedContent.content
      )
      ParserService.validateContent(parsedContent)

      // 3. Build prompts
      const promptComponents = PromptBuilderService.buildTransformationPrompt(
        parsedContent,
        personaId
      )
      PromptBuilderService.validatePrompt(promptComponents)

      // 4. Generate transformation
      const openaiResponse = await this.openaiService.generateCompletion({
        systemPrompt: promptComponents.systemPrompt,
        userPrompt: promptComponents.userPrompt
      })

      // 5. Build success response
      const persona = getPersona(personaId)!
      const result: TransformationResult = {
        success: true,
        originalContent: {
          title: parsedContent.title,
          content: parsedContent.cleanedText,
          url: scrapedContent.url,
          wordCount: parsedContent.wordCount
        },
        transformedContent: openaiResponse.content,
        persona: {
          id: persona.id,
          name: persona.name,
          description: persona.description
        },
        usage: openaiResponse.usage
      }

      console.log("🎉 === ContentTransformer.transformContent() COMPLETED SUCCESSFULLY ===")
      return result

    } catch (error) {
      console.error('🚨 === CONTENT TRANSFORMATION ERROR ===')
      console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error')
      
      return this.createErrorResult(
        error instanceof Error ? error.message : 'Unknown transformation error',
        scrapedContent,
        personaId
      )
    }
  }

  async transformText(
    text: string, 
    personaId: string
  ): Promise<TransformationResult> {
    console.log("📊 === ContentTransformer.transformText() STARTED ===")
    console.log("📨 transformText() called with:", {
      textLength: text?.length || 0,
      personaId
    })

    try {
      // 1. Parse and clean text
      const parsedContent = ParserService.parseDirectText(text)
      ParserService.validateContent(parsedContent)

      // 2. Build prompts
      const promptComponents = PromptBuilderService.buildTextTransformationPrompt(
        parsedContent,
        personaId
      )
      PromptBuilderService.validatePrompt(promptComponents)

      // 3. Generate transformation
      const openaiResponse = await this.openaiService.generateCompletion({
        systemPrompt: promptComponents.systemPrompt,
        userPrompt: promptComponents.userPrompt
      })

      // 4. Build success response
      const persona = getPersona(personaId)!
      const result: TransformationResult = {
        success: true,
        originalContent: {
          title: 'Direct Text Input',
          content: parsedContent.cleanedText,
          url: 'Direct Text Input',
          wordCount: parsedContent.wordCount
        },
        transformedContent: openaiResponse.content,
        persona: {
          id: persona.id,
          name: persona.name,
          description: persona.description
        },
        usage: openaiResponse.usage
      }

      console.log("🎉 === ContentTransformer.transformText() COMPLETED SUCCESSFULLY ===")
      return result

    } catch (error) {
      console.error('🚨 === TEXT TRANSFORMATION ERROR ===')
      console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error')

      return this.createErrorResult(
        error instanceof Error ? error.message : 'Unknown transformation error',
        { title: 'Direct Text Input', content: text, url: 'Direct Text Input', metadata: { wordCount: text.split(/\s+/).length } },
        personaId
      )
    }
  }

  private createErrorResult(
    errorMessage: string,
    scrapedContent: ScrapedContent | { title: string; content: string; url: string; metadata: { wordCount: number } } | null,
    personaId: string
  ): TransformationResult {
    const persona = getPersona(personaId)
    
    return {
      success: false,
      error: errorMessage,
      originalContent: {
        title: scrapedContent?.title || 'Error: Missing Title',
        content: scrapedContent?.content || '',
        url: scrapedContent?.url || 'Error: Missing URL',
        wordCount: scrapedContent?.metadata?.wordCount || 0
      },
      transformedContent: '',
      persona: {
        id: personaId,
        name: persona?.name || 'Unknown',
        description: persona?.description || 'Unknown persona'
      }
    }
  }
}
