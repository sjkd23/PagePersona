import OpenAI from 'openai'
import { getPersona } from '../data/personas'
import type { ScrapedContent } from '../utilities/webScraper'

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
  private openai: OpenAI

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey })
  }

  async transformContent(
    scrapedContent: ScrapedContent, 
    personaId: string
  ): Promise<TransformationResult> {
    try {
      const persona = getPersona(personaId)
      
      if (!persona) {
        return {
          success: false,
          error: `Unknown persona: ${personaId}`,
          originalContent: {
            title: scrapedContent.title,
            content: scrapedContent.content,
            url: scrapedContent.url,
            wordCount: scrapedContent.metadata.wordCount
          },
          transformedContent: '',
          persona: {
            id: personaId,
            name: 'Unknown',
            description: 'Unknown persona'
          }
        }
      }

      // Prepare the messages for OpenAI
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: persona.systemPrompt
        },
        {
          role: 'user',
          content: this.buildUserPrompt(scrapedContent)
        }
      ]

      // Call OpenAI API
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 2500, // Increased for better formatting
        temperature: 0.7, // Slightly lower for more consistent formatting
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      })

      const transformedContent = completion.choices[0]?.message?.content

      if (!transformedContent) {
        throw new Error('No response generated from OpenAI')
      }

      return {
        success: true,
        originalContent: {
          title: scrapedContent.title,
          content: scrapedContent.content,
          url: scrapedContent.url,
          wordCount: scrapedContent.metadata.wordCount
        },
        transformedContent,
        persona: {
          id: persona.id,
          name: persona.name,
          description: persona.description
        },
        usage: completion.usage ? {
          prompt_tokens: completion.usage.prompt_tokens,
          completion_tokens: completion.usage.completion_tokens,
          total_tokens: completion.usage.total_tokens
        } : undefined
      }

    } catch (error) {
      console.error('Content transformation error:', error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown transformation error',
        originalContent: {
          title: scrapedContent.title,
          content: scrapedContent.content,
          url: scrapedContent.url,
          wordCount: scrapedContent.metadata.wordCount
        },
        transformedContent: '',
        persona: {
          id: personaId,
          name: getPersona(personaId)?.name || 'Unknown',
          description: getPersona(personaId)?.description || 'Unknown persona'
        }
      }
    }
  }

  async transformText(
    text: string, 
    personaId: string
  ): Promise<TransformationResult> {
    try {
      const persona = getPersona(personaId)
      
      if (!persona) {
        return {
          success: false,
          error: `Unknown persona: ${personaId}`,
          originalContent: {
            title: 'Direct Text Input',
            content: text,
            url: 'Direct Text Input',
            wordCount: text.split(/\s+/).length
          },
          transformedContent: '',
          persona: {
            id: personaId,
            name: 'Unknown',
            description: 'Unknown persona'
          }
        }
      }

      // Prepare the messages for OpenAI
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: persona.systemPrompt
        },
        {
          role: 'user',
          content: this.buildTextUserPrompt(text)
        }
      ]

      // Call OpenAI API
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 2500,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      })

      const transformedContent = completion.choices[0]?.message?.content

      if (!transformedContent) {
        throw new Error('No response generated from OpenAI')
      }

      return {
        success: true,
        originalContent: {
          title: 'Direct Text Input',
          content: text,
          url: 'Direct Text Input',
          wordCount: text.split(/\s+/).length
        },
        transformedContent,
        persona: {
          id: persona.id,
          name: persona.name,
          description: persona.description
        },
        usage: completion.usage ? {
          prompt_tokens: completion.usage.prompt_tokens,
          completion_tokens: completion.usage.completion_tokens,
          total_tokens: completion.usage.total_tokens
        } : undefined
      }

    } catch (error) {
      console.error('Text transformation error:', error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown transformation error',
        originalContent: {
          title: 'Direct Text Input',
          content: text,
          url: 'Direct Text Input',
          wordCount: text.split(/\s+/).length
        },
        transformedContent: '',
        persona: {
          id: personaId,
          name: getPersona(personaId)?.name || 'Unknown',
          description: getPersona(personaId)?.description || 'Unknown persona'
        }
      }
    }
  }

  private buildUserPrompt(content: ScrapedContent): string {
    return `Please transform the following webpage content according to your persona:

WEBPAGE TITLE: ${content.title}
SOURCE URL: ${content.url}
WORD COUNT: ${content.metadata.wordCount}

CONTENT TO TRANSFORM:
${content.content}

CRITICAL FORMATTING REQUIREMENTS:
1. **Structure your response with 3-5 clear sections** using markdown headers (##)
2. **Use short paragraphs** (2-3 sentences maximum)
3. **Include bullet points or numbered lists** where appropriate
4. **Add line breaks between sections** for better readability
5. **Create engaging subheadings** that match your persona's style
6. **Make it scannable** - readers should be able to quickly understand the main points

Content Guidelines:
- Maintain all important information and key facts
- Transform the tone, style, and presentation to match your persona
- Make it engaging and entertaining while keeping it informative
- If the content is very long, focus on the most important points
- Keep the transformation between 300-800 words
- Make sure your personality shines through every sentence
- **Most importantly: Break up wall-of-text into digestible, well-organized sections**

Transform this content now with your unique style AND proper formatting!`
  }

  private buildTextUserPrompt(text: string): string {
    return `Please transform the following text content according to your persona:

TEXT INPUT:
${text}

CRITICAL FORMATTING REQUIREMENTS:
1. **Structure your response with 3-5 clear sections** using markdown headers (##)
2. **Use short paragraphs** (2-3 sentences maximum)
3. **Include bullet points or numbered lists** where appropriate
4. **Add line breaks between sections** for better readability
5. **Create engaging subheadings** that match your persona's style
6. **Make it scannable** - readers should be able to quickly understand the main points

Content Guidelines:
- Maintain all important information and key facts
- Transform the tone, style, and presentation to match your persona
- Make it engaging and entertaining while keeping it informative
- Keep the transformation between 300-800 words
- Make sure your personality shines through every sentence
- **Most importantly: Break up wall-of-text into digestible, well-organized sections**

Transform this content now with your unique style AND proper formatting!`
  }
}
