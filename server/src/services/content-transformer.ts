/**
 * Content Transformation Service
 *
 * Orchestrates the complete content transformation pipeline from scraped
 * web content to AI-transformed output. Coordinates scraping, parsing,
 * prompt building, and OpenAI API communication with comprehensive
 * error handling and result formatting.
 *
 * Features:
 * - Complete transformation pipeline orchestration
 * - Multi-service integration and coordination
 * - Comprehensive error handling and recovery
 * - Detailed usage tracking and metrics
 * - Persona-based content transformation
 */

import { ScraperService, type ScrapedContent } from "./scraper";
import { ParserService } from "./parser";
import { PromptBuilderService } from "./promptBuilder";
import { OpenAIClientService } from "./openaiClient";
import { getPersona } from "@pagepersonai/shared";
import { logger } from "../utils/logger";
import { cleanScrapedContent } from "../utils/cleanTextForLLM";

/**
 * Transformation request parameters interface
 */
export interface TransformationRequest {
  url: string;
  persona: string;
}

/**
 * Comprehensive transformation result structure
 *
 * Contains original content, transformed output, persona information,
 * usage statistics, and error details for complete transformation tracking.
 */
export interface TransformationResult {
  success: boolean;
  originalContent: {
    title: string;
    content: string;
    url: string;
    wordCount: number;
  };
  transformedContent: string;
  persona: {
    id: string;
    name: string;
    description: string;
  };
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error?: string;
}

/**
 * Content Transformer Class
 *
 * High-level service that coordinates the complete content transformation
 * workflow from web scraping through AI-powered content generation.
 */
export class ContentTransformer {
  private scraperService: ScraperService;
  private openaiService: OpenAIClientService;

  constructor(apiKey: string) {
    logger.debug("Initializing ContentTransformer with provided API key");
    this.scraperService = new ScraperService();
    this.openaiService = new OpenAIClientService(apiKey);
  }

  /**
   * Transform scraped content using specified persona
   *
   * Processes scraped web content through the complete transformation
   * pipeline including content parsing, prompt generation, AI processing,
   * and result formatting with comprehensive error handling.
   *
   * @param scrapedContent - Pre-scraped webpage content structure
   * @param personaId - Persona identifier for transformation style
   * @returns Promise resolving to complete transformation result
   */
  async transformContent(
    scrapedContent: ScrapedContent,
    personaId: string,
  ): Promise<TransformationResult> {
    logger.transform.info("Content transformation started", {
      title: scrapedContent?.title || "MISSING",
      url: scrapedContent?.url || "MISSING",
      personaId,
      hasScrapedContent: !!scrapedContent,
    });

    try {
      // Step 1: Validate scraped content input
      if (!scrapedContent || !scrapedContent.content?.trim()) {
        return this.createErrorResult(
          "Invalid scraped content: content is null, undefined, or empty",
          scrapedContent,
          personaId,
        );
      }

      // Step 1.5: Clean and optimize text for LLM (reduce token usage)
      const cleaningResult = cleanScrapedContent(
        scrapedContent.content,
        scrapedContent.title,
        scrapedContent.url,
        {
          maxChars: 45000, // ~11k tokens (safe for most models)
          preserveStartRatio: 0.8,
          includeHeadings: true,
        },
      );

      logger.info("Text cleaning completed", {
        reductionPercent: cleaningResult.metrics.reductionPercent.toFixed(2),
        tokensSaved: cleaningResult.metrics.tokenReduction,
        wasTruncated: cleaningResult.metrics.wasTruncated,
      });

      // Step 2: Parse and clean webpage content
      const parsedContent = ParserService.parseWebContent(
        cleaningResult.title || scrapedContent.title,
        cleaningResult.cleanedText, // Use cleaned text instead of raw
      );
      ParserService.validateContent(parsedContent);

      // Step 3: Build transformation prompts for AI processing
      const promptComponents = PromptBuilderService.buildTransformationPrompt(
        parsedContent,
        personaId,
      );
      PromptBuilderService.validatePrompt(promptComponents);

      // 4. Generate transformation
      const openaiResponse = await this.openaiService.generateCompletion({
        systemPrompt: promptComponents.systemPrompt,
        userPrompt: promptComponents.userPrompt,
      });

      // 5. Build success response
      const persona = getPersona(personaId);
      if (!persona) {
        throw new Error(`Persona not found: ${personaId}`);
      }
      const result: TransformationResult = {
        success: true,
        originalContent: {
          title: parsedContent.title,
          content: parsedContent.cleanedText,
          url: scrapedContent.url,
          wordCount: parsedContent.wordCount,
        },
        transformedContent: openaiResponse.content,
        persona: {
          id: persona.id,
          name: persona.name,
          description: persona.description,
        },
        usage: openaiResponse.usage,
      };

      logger.info(
        "🎉 === ContentTransformer.transformContent() COMPLETED SUCCESSFULLY ===",
      );
      return result;
    } catch (error) {
      logger.error("🚨 === CONTENT TRANSFORMATION ERROR ===");
      logger.error(
        "❌ Error:",
        error instanceof Error ? error.message : "Unknown error",
      );

      return this.createErrorResult(
        error instanceof Error ? error.message : "Unknown transformation error",
        scrapedContent,
        personaId,
      );
    }
  }

  async transformText(
    text: string,
    personaId: string,
  ): Promise<TransformationResult> {
    logger.info("📊 === ContentTransformer.transformText() STARTED ===");
    logger.info("📨 transformText() called with:", {
      textLength: text?.length || 0,
      personaId,
    });

    try {
      // 0.5: Clean and optimize text for LLM (reduce token usage)
      const cleaningResult = cleanScrapedContent(
        text,
        "Direct Text Input",
        undefined,
        {
          maxChars: 45000,
          preserveStartRatio: 0.8,
          includeHeadings: false, // Plain text doesn't have HTML headings
        },
      );

      logger.info("Text cleaning completed", {
        reductionPercent: cleaningResult.metrics.reductionPercent.toFixed(2),
        tokensSaved: cleaningResult.metrics.tokenReduction,
      });

      // 1. Parse and clean text
      const parsedContent = ParserService.parseDirectText(
        cleaningResult.cleanedText,
      );
      ParserService.validateContent(parsedContent);

      // 2. Build prompts
      const promptComponents =
        PromptBuilderService.buildTextTransformationPrompt(
          parsedContent,
          personaId,
        );
      PromptBuilderService.validatePrompt(promptComponents);

      // 3. Generate transformation
      const openaiResponse = await this.openaiService.generateCompletion({
        systemPrompt: promptComponents.systemPrompt,
        userPrompt: promptComponents.userPrompt,
      });

      // 4. Build success response
      const persona = getPersona(personaId);
      if (!persona) {
        throw new Error(`Persona not found: ${personaId}`);
      }
      const result: TransformationResult = {
        success: true,
        originalContent: {
          title: "Direct Text Input",
          content: parsedContent.cleanedText,
          url: "Direct Text Input",
          wordCount: parsedContent.wordCount,
        },
        transformedContent: openaiResponse.content,
        persona: {
          id: persona.id,
          name: persona.name,
          description: persona.description,
        },
        usage: openaiResponse.usage,
      };

      logger.info(
        "🎉 === ContentTransformer.transformText() COMPLETED SUCCESSFULLY ===",
      );
      return result;
    } catch (error) {
      logger.error("🚨 === TEXT TRANSFORMATION ERROR ===");
      logger.error(
        "❌ Error:",
        error instanceof Error ? error.message : "Unknown error",
      );

      return this.createErrorResult(
        error instanceof Error ? error.message : "Unknown transformation error",
        {
          title: "Direct Text Input",
          content: text,
          url: "Direct Text Input",
          metadata: { wordCount: text.split(/\s+/).length },
        },
        personaId,
      );
    }
  }

  private createErrorResult(
    errorMessage: string,
    scrapedContent:
      | ScrapedContent
      | {
          title: string;
          content: string;
          url: string;
          metadata: { wordCount: number };
        }
      | null,
    personaId: string,
  ): TransformationResult {
    const persona = getPersona(personaId);

    return {
      success: false,
      error: errorMessage,
      originalContent: {
        title: scrapedContent?.title || "Error: Missing Title",
        content: scrapedContent?.content || "",
        url: scrapedContent?.url || "Error: Missing URL",
        wordCount: scrapedContent?.metadata?.wordCount || 0,
      },
      transformedContent: "",
      persona: {
        id: personaId,
        name: persona?.name || "Unknown",
        description: persona?.description || "Unknown persona",
      },
    };
  }
}
