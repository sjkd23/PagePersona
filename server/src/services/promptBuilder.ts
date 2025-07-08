import { getPersona } from '../data/personas'
import { BASE_SYSTEM_PROMPT } from '../data/basePrompt'
import type { ParsedContent } from './parser'

export interface PromptComponents {
  systemPrompt: string
  userPrompt: string
  totalLength: number
}

export class PromptBuilderService {
  static buildTransformationPrompt(content: ParsedContent, personaId: string): PromptComponents {
    const persona = getPersona(personaId)
    if (!persona) {
      throw new Error(`Unknown persona: ${personaId}`)
    }

    const systemPrompt = this.buildSystemPrompt(persona)
    const userPrompt = this.buildUserPrompt(content, 'webpage content')

    return {
      systemPrompt,
      userPrompt,
      totalLength: systemPrompt.length + userPrompt.length
    }
  }

  static buildTextTransformationPrompt(content: ParsedContent, personaId: string): PromptComponents {
    const persona = getPersona(personaId)
    if (!persona) {
      throw new Error(`Unknown persona: ${personaId}`)
    }

    const systemPrompt = this.buildSystemPrompt(persona)
    const userPrompt = this.buildUserPrompt(content, 'text content')

    return {
      systemPrompt,
      userPrompt,
      totalLength: systemPrompt.length + userPrompt.length
    }
  }

  private static buildSystemPrompt(persona: any): string {
    // Combine base prompt with persona-specific instructions
    const baseInstructions = BASE_SYSTEM_PROMPT || 'You are a helpful assistant that transforms content.'
    
    return `${baseInstructions}

${persona.systemPrompt}

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
- **Most importantly: Break up wall-of-text into digestible, well-organized sections**`
  }

  private static buildUserPrompt(content: ParsedContent, contentType: string): string {
    const inputSection = contentType === 'webpage content' 
      ? `WEBPAGE TITLE: ${content.title}
WORD COUNT: ${content.wordCount}
${content.summary ? `SUMMARY: ${content.summary}` : ''}

CONTENT TO TRANSFORM:
${content.cleanedText}`
      : `TEXT INPUT:
${content.cleanedText}`

    return `Please transform the following ${contentType} according to your persona:

${inputSection}

Transform this content now with your unique style AND proper formatting!`
  }

  static validatePrompt(prompt: PromptComponents): void {
    if (!prompt.systemPrompt || prompt.systemPrompt.trim().length === 0) {
      throw new Error('System prompt is required')
    }

    if (!prompt.userPrompt || prompt.userPrompt.trim().length === 0) {
      throw new Error('User prompt is required')
    }

    // Warn if prompts are too long (rough estimate for token limits)
    if (prompt.totalLength > 12000) {
      console.warn('Combined prompt length is quite long, may exceed token limits')
    }
  }

  static getPromptMetrics(prompt: PromptComponents) {
    return {
      systemPromptLength: prompt.systemPrompt.length,
      userPromptLength: prompt.userPrompt.length,
      totalLength: prompt.totalLength,
      estimatedTokens: Math.ceil(prompt.totalLength / 4) // Rough estimate
    }
  }
}
