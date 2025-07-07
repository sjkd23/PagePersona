import OpenAI from 'openai'
import { getPersona } from '../data/personas'
import type { ScrapedContent } from '../utils/web-scraper'
import type { OpenAIError } from '../types/common'
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
  private openai: OpenAI

  constructor(apiKey: string) {
    logger.openai.debug("Initializing ContentTransformer with provided API key")
    this.openai = new OpenAI({ apiKey })
  }

  async transformContent(
    scrapedContent: ScrapedContent, 
    personaId: string
  ): Promise<TransformationResult> {
    console.log("� === ContentTransformer.transformContent() STARTED ===");
    console.log("�📨 transformContent() called with:", {
      title: scrapedContent?.title || 'MISSING',
      url: scrapedContent?.url || 'MISSING', 
      personaId,
      personaIdType: typeof personaId,
      hasScrapedContent: !!scrapedContent
    });

    // 1. Validate scrapedContent structure
    if (!scrapedContent) {
      console.error("❌ ScrapedContent is null or undefined");
      return {
        success: false,
        error: 'Invalid scraped content: content is null or undefined',
        originalContent: {
          title: 'Error: Missing Content',
          content: '',
          url: 'Error: Missing URL',
          wordCount: 0
        },
        transformedContent: '',
        persona: {
          id: personaId,
          name: 'Unknown',
          description: 'Unknown persona'
        }
      };
    }

    console.log("🔍 ScrapedContent validation:", {
      hasTitle: !!scrapedContent.title,
      titleLength: scrapedContent.title?.length || 0,
      hasContent: !!scrapedContent.content,
      contentLength: scrapedContent.content?.length || 0,
      hasUrl: !!scrapedContent.url,
      hasMetadata: !!scrapedContent.metadata,
      wordCount: scrapedContent.metadata?.wordCount || 0
    });

    // Check for missing critical fields
    if (!scrapedContent.content || scrapedContent.content.trim().length === 0) {
      console.error("❌ ScrapedContent has no content to transform");
      return {
        success: false,
        error: 'No content found to transform. The webpage may be empty or inaccessible.',
        originalContent: {
          title: scrapedContent.title || 'Unknown Title',
          content: scrapedContent.content || '',
          url: scrapedContent.url || 'Unknown URL',
          wordCount: scrapedContent.metadata?.wordCount || 0
        },
        transformedContent: '',
        persona: {
          id: personaId,
          name: 'Unknown',
          description: 'Unknown persona'
        }
      };
    }

    try {
      // 2. Persona lookup with detailed logging
      console.log("🔍 Looking up persona:", personaId);
      const persona = getPersona(personaId);
      
      if (!persona) {
        console.error("❌ Unknown persona:", personaId);
        console.error("🔍 Available personas should be checked");
        return {
          success: false,
          error: `Unknown persona: ${personaId}. Please check available personas.`,
          originalContent: {
            title: scrapedContent.title,
            content: scrapedContent.content,
            url: scrapedContent.url,
            wordCount: scrapedContent.metadata?.wordCount || 0
          },
          transformedContent: '',
          persona: {
            id: personaId,
            name: 'Unknown',
            description: 'Unknown persona'
          }
        };
      }

      console.log("✅ Persona found successfully:", {
        id: persona.id,
        name: persona.name,
        hasSystemPrompt: !!persona.systemPrompt,
        systemPromptLength: persona.systemPrompt?.length || 0,
        description: persona.description?.substring(0, 100) + '...'
      });

      // 3. Build prompt with validation
      console.log("🔧 Building user prompt...");
      const userPrompt = this.buildUserPrompt(scrapedContent);
      console.log("📝 User prompt built, length:", userPrompt.length);

      if (!userPrompt || userPrompt.trim().length === 0) {
        console.error("❌ Failed to build user prompt");
        throw new Error('Failed to build user prompt from scraped content');
      }

      // 4. Prepare OpenAI messages with validation
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: persona.systemPrompt },
        { role: 'user', content: userPrompt }
      ];

      console.log("📊 OpenAI messages prepared:", {
        messageCount: messages.length,
        systemPromptLength: (messages[0].content as string)?.length || 0,
        userPromptLength: (messages[1].content as string)?.length || 0,
        totalCharacters: ((messages[0].content as string)?.length || 0) + ((messages[1].content as string)?.length || 0)
      });

      // 5. OpenAI API call with detailed logging
      console.log("🔮 Sending content prompt to OpenAI...");
      console.log("⚙️ OpenAI request configuration:", {
        model: 'gpt-4o',
        maxTokens: 2500,
        temperature: 0.7,
        presencePenalty: 0.1,
        frequencyPenalty: 0.1,
        hasApiKey: !!this.openai
      });

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        max_tokens: 2500,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      console.log("✅ OpenAI API call completed successfully");
      console.log("📊 OpenAI response details:", {
        hasCompletion: !!completion,
        choicesCount: completion.choices?.length || 0,
        firstChoiceExists: !!completion.choices?.[0],
        hasMessage: !!completion.choices?.[0]?.message,
        hasContent: !!completion.choices?.[0]?.message?.content,
        contentLength: completion.choices?.[0]?.message?.content?.length || 0,
        finishReason: completion.choices?.[0]?.finish_reason,
        hasUsage: !!completion.usage,
        promptTokens: completion.usage?.prompt_tokens,
        completionTokens: completion.usage?.completion_tokens,
        totalTokens: completion.usage?.total_tokens
      });

      // 6. Extract and validate transformed content
      const transformedContent = completion.choices[0]?.message?.content;

      if (!transformedContent) {
        console.error("❌ No transformed content received from OpenAI");
        console.error("🔍 OpenAI response structure:", {
          choices: completion.choices,
          firstChoice: completion.choices?.[0],
          message: completion.choices?.[0]?.message
        });
        throw new Error('No response generated from OpenAI - empty content received');
      }

      if (transformedContent.trim().length === 0) {
        console.error("❌ OpenAI returned empty content");
        throw new Error('OpenAI returned empty transformed content');
      }

      console.log("✅ Received transformed content from OpenAI.");
      console.log("📈 Transformation successful, content length:", transformedContent.length);

      // 7. Build successful result with all required fields
      const result = {
        success: true,
        originalContent: {
          title: scrapedContent.title || 'Untitled',
          content: scrapedContent.content,
          url: scrapedContent.url || 'Unknown URL',
          wordCount: scrapedContent.metadata?.wordCount || 0
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
      };

      console.log("🎉 === ContentTransformer.transformContent() COMPLETED SUCCESSFULLY ===");
      return result;

    } catch (error) {
      console.error('� === CONTENT TRANSFORMATION ERROR ===');
      console.error('❌ Error type:', error?.constructor?.name);
      console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      // OpenAI-specific error handling
      if (error && typeof error === 'object') {
        console.error('🔍 Detailed error info:', {
          status: (error as OpenAIError).status,
          code: (error as OpenAIError).code,
          type: (error as OpenAIError).type,
          param: (error as OpenAIError).param,
          message: (error as OpenAIError).message,
          error: (error as OpenAIError).error
        });
      }

      console.error('🔍 Context when error occurred:', {
        personaId,
        hasScrapedContent: !!scrapedContent,
        scrapedContentKeys: scrapedContent ? Object.keys(scrapedContent) : [],
        timestamp: new Date().toISOString()
      });

      // Always return a valid error response with proper persona info
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown transformation error',
        originalContent: {
          title: scrapedContent?.title || 'Error: Missing Title',
          content: scrapedContent?.content || '',
          url: scrapedContent?.url || 'Error: Missing URL',
          wordCount: scrapedContent?.metadata?.wordCount || 0
        },
        transformedContent: '',
        persona: {
          id: personaId,
          name: getPersona(personaId)?.name || 'Unknown',
          description: getPersona(personaId)?.description || 'Unknown persona'
        }
      };

      console.error('🔄 Returning error result:', {
        success: errorResult.success,
        error: errorResult.error,
        hasPersona: !!errorResult.persona
      });

      return errorResult;
    }
  }

  async transformText(
    text: string, 
    personaId: string
  ): Promise<TransformationResult> {
    console.log("� === ContentTransformer.transformText() STARTED ===");
    console.log("�📨 transformText() called with:", {
      textType: typeof text,
      textLength: text?.length || 0,
      textPreview: text ? text.substring(0, 100) + '...' : 'null/undefined',
      personaId,
      personaIdType: typeof personaId
    });

    try {
      console.log("🔍 Looking up persona:", personaId);
      const persona = getPersona(personaId)
      
      if (!persona) {
        console.error("❌ Unknown persona:", personaId);
        console.error("🔍 Available personas check needed");
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

      console.log("✅ Persona found:", {
        id: persona.id,
        name: persona.name,
        hasSystemPrompt: !!persona.systemPrompt,
        systemPromptLength: persona.systemPrompt?.length || 0
      });

      console.log("🔧 Building OpenAI messages...");
      const userPrompt = this.buildTextUserPrompt(text);
      console.log("📝 User prompt built, length:", userPrompt.length);

      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: persona.systemPrompt },
        { role: 'user', content: userPrompt }
      ]

      console.log("📊 Messages summary:", {
        messageCount: messages.length,
        systemPromptLength: (messages[0].content as string)?.length || 0,
        userPromptLength: (messages[1].content as string)?.length || 0
      });

      console.log("🔮 Sending text prompt to OpenAI...");
      console.log("⚙️ OpenAI configuration:", {
        model: 'gpt-4o',
        maxTokens: 2500,
        temperature: 0.7,
        hasApiKey: !!this.openai
      });

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        max_tokens: 2500,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      })

      console.log("✅ OpenAI API call completed successfully");
      console.log("📊 OpenAI response summary:", {
        choicesCount: completion.choices?.length || 0,
        firstChoiceExists: !!completion.choices?.[0],
        hasContent: !!completion.choices?.[0]?.message?.content,
        contentLength: completion.choices?.[0]?.message?.content?.length || 0,
        hasUsage: !!completion.usage,
        promptTokens: completion.usage?.prompt_tokens,
        completionTokens: completion.usage?.completion_tokens,
        totalTokens: completion.usage?.total_tokens
      });

      const transformedContent = completion.choices[0]?.message?.content

      if (!transformedContent) {
        console.error("❌ No transformed content received from OpenAI");
        throw new Error('No response generated from OpenAI')
      }

      console.log("✅ Received transformed text content from OpenAI.");
      console.log("📈 Transformation successful, content length:", transformedContent.length);

      const result = {
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
      };

      console.log("🎉 === ContentTransformer.transformText() COMPLETED SUCCESSFULLY ===");
      return result;

    } catch (error) {
      console.error('� === TEXT TRANSFORMATION ERROR IN ContentTransformer ===');
      console.error('❌ Error type:', error?.constructor?.name);
      console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      // OpenAI-specific error details
      if (error && typeof error === 'object') {
        console.error('🔍 Error details:', {
          status: (error as OpenAIError).status,
          code: (error as OpenAIError).code,
          type: (error as OpenAIError).type,
          param: (error as OpenAIError).param,
          error: (error as OpenAIError).error
        });
      }

      console.error('🔍 Context when error occurred:', {
        textLength: text?.length || 0,
        personaId,
        timestamp: new Date().toISOString()
      });

      const errorResult = {
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
      };

      console.error('🔄 Returning error result:', {
        success: errorResult.success,
        error: errorResult.error
      });

      return errorResult;
    }
  }

  private buildUserPrompt(content: ScrapedContent): string {
    const inputSection = `WEBPAGE TITLE: ${content.title}
SOURCE URL: ${content.url}
WORD COUNT: ${content.metadata.wordCount}

CONTENT TO TRANSFORM:
${content.content}`;

    return this.buildPromptTemplate(inputSection, 'webpage content');
  }

  private buildTextUserPrompt(text: string): string {
    const inputSection = `TEXT INPUT:
${text}`;

    return this.buildPromptTemplate(inputSection, 'text content');
  }

  private buildPromptTemplate(inputSection: string, contentType: string): string {
    return `Please transform the following ${contentType} according to your persona:

${inputSection}

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

Transform this content now with your unique style AND proper formatting!`;
  }
}
