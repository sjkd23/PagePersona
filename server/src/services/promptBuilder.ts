/**
 * Prompt Builder Service
 *
 * Constructs structured AI prompts by combining base system instructions,
 * persona-specific prompts, and user content. Handles prompt composition
 * for different content types and transformation scenarios with proper
 * formatting and length management.
 *
 * Features:
 * - Systematic prompt composition from multiple sources
 * - Persona-specific instruction integration
 * - Content type-aware prompt building
 * - Prompt length tracking and optimization
 * - Consistent formatting across all prompts
 */

import { getPersona } from "@pagepersonai/shared";
import { BASE_SYSTEM_PROMPT } from "@pagepersonai/shared";
import type { ParsedContent } from "./parser";
import { logger } from "../utils/logger";

/**
 * Prompt components structure interface
 *
 * Contains all components of a complete AI prompt including system
 * instructions, user content, and metadata for API usage.
 */
export interface PromptComponents {
  systemPrompt: string;
  userPrompt: string;
  totalLength: number;
}

/**
 * Prompt Builder Service Class
 *
 * Static service class for constructing AI prompts from various
 * content sources and persona configurations with proper formatting.
 */
export class PromptBuilderService {
  /**
   * Build transformation prompt for webpage content
   *
   * Constructs complete AI prompt combining base system instructions,
   * persona-specific prompts, and parsed webpage content for transformation.
   *
   * @param content - Parsed and validated webpage content
   * @param personaId - Persona identifier for transformation style
   * @returns Complete prompt components ready for AI API
   * @throws Error if persona is not found
   */
  static buildTransformationPrompt(
    content: ParsedContent,
    personaId: string,
  ): PromptComponents {
    const persona = getPersona(personaId);
    if (!persona) {
      throw new Error(`Unknown persona: ${personaId}`);
    }

    const systemPrompt = this.buildSystemPrompt(persona);
    const userPrompt = this.buildUserPrompt(content, "webpage content");

    return {
      systemPrompt,
      userPrompt,
      totalLength: systemPrompt.length + userPrompt.length,
    };
  }

  /**
   * Build transformation prompt for direct text content
   *
   * Constructs complete AI prompt for transforming direct text input
   * using persona-specific instructions and formatting.
   *
   * @param content - Parsed and validated text content
   * @param personaId - Persona identifier for transformation style
   * @returns Complete prompt components ready for AI API
   * @throws Error if persona is not found
   */
  static buildTextTransformationPrompt(
    content: ParsedContent,
    personaId: string,
  ): PromptComponents {
    const persona = getPersona(personaId);
    if (!persona) {
      throw new Error(`Unknown persona: ${personaId}`);
    }

    const systemPrompt = this.buildSystemPrompt(persona);
    const userPrompt = this.buildUserPrompt(content, "text content");

    return {
      systemPrompt,
      userPrompt,
      totalLength: systemPrompt.length + userPrompt.length,
    };
  }

  /**
   * Build comprehensive system prompt combining base and persona instructions
   *
   * @param persona - Persona configuration object
   * @returns Complete system prompt string
   */
  private static buildSystemPrompt(persona: {
    id: string;
    systemPrompt: string;
  }): string {
    // Combine base prompt with persona-specific instructions
    const baseInstructions =
      BASE_SYSTEM_PROMPT ||
      "You are a helpful assistant that transforms content.";

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
- **Most importantly: Break up wall-of-text into digestible, well-organized sections**`;
  }

  private static buildUserPrompt(
    content: ParsedContent,
    contentType: string,
  ): string {
    const inputSection =
      contentType === "webpage content"
        ? `WEBPAGE TITLE: ${content.title}
WORD COUNT: ${content.wordCount}
${content.summary ? `SUMMARY: ${content.summary}` : ""}

CONTENT TO TRANSFORM:
${content.cleanedText}`
        : `TEXT INPUT:
${content.cleanedText}`;

    return `Please transform the following ${contentType} according to your persona:

${inputSection}

Transform this content now with your unique style AND proper formatting!`;
  }

  static validatePrompt(prompt: PromptComponents): void {
    if (!prompt.systemPrompt || prompt.systemPrompt.trim().length === 0) {
      throw new Error("System prompt is required");
    }

    if (!prompt.userPrompt || prompt.userPrompt.trim().length === 0) {
      throw new Error("User prompt is required");
    }

    // Warn if prompts are too long (rough estimate for token limits)
    if (prompt.totalLength > 12000) {
      logger.warn(
        "Combined prompt length is quite long, may exceed token limits",
      );
    }
  }

  static getPromptMetrics(prompt: PromptComponents): {
    systemPromptLength: number;
    userPromptLength: number;
    totalLength: number;
    estimatedTokens: number;
  } {
    return {
      systemPromptLength: prompt.systemPrompt.length,
      userPromptLength: prompt.userPrompt.length,
      totalLength: prompt.totalLength,
      estimatedTokens: Math.ceil(prompt.totalLength / 4), // Rough estimate
    };
  }
}
