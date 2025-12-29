/**
 * Content Parser Service
 *
 * Provides comprehensive text processing and content cleaning utilities
 * for preparing web content and direct text input for AI transformation.
 * Handles text normalization, length validation, and content optimization
 * to ensure high-quality input for AI processing.
 *
 * Features:
 * - Intelligent text cleaning and normalization
 * - Content length validation and truncation
 * - Word count calculation and analysis
 * - Title extraction and cleaning
 * - Content summary generation
 */

import { logger } from "../utils/logger";

/**
 * Parsed content structure interface
 *
 * Standardized format for processed content ready for AI transformation
 * with cleaned text, metadata, and optional summary information.
 */
export interface ParsedContent {
  cleanedText: string;
  title: string;
  wordCount: number;
  summary?: string;
}

/**
 * Content Parser Service Class
 *
 * Static service class providing text processing utilities for
 * content preparation and optimization before AI transformation.
 */
export class ParserService {
  private static readonly MAX_CONTENT_LENGTH = 8000;
  private static readonly MIN_CONTENT_LENGTH = 50;

  /**
   * Parse and clean webpage content for AI processing
   *
   * Processes raw webpage content through comprehensive cleaning,
   * validation, and optimization pipeline to prepare for transformation.
   *
   * @param title - Original webpage title
   * @param rawContent - Raw extracted webpage content
   * @returns Parsed and cleaned content structure
   * @throws Error if content is too short or invalid
   */
  static parseWebContent(title: string, rawContent: string): ParsedContent {
    // Clean and normalize the text content
    const cleanedText = this.cleanText(rawContent);

    // Validate minimum content length requirements
    if (cleanedText.length < this.MIN_CONTENT_LENGTH) {
      throw new Error("Content too short to process");
    }

    // Apply maximum length truncation if necessary
    const finalText =
      cleanedText.length > this.MAX_CONTENT_LENGTH
        ? cleanedText.substring(0, this.MAX_CONTENT_LENGTH) + "..."
        : cleanedText;

    const wordCount = this.countWords(finalText);

    return {
      cleanedText: finalText,
      title: this.cleanTitle(title),
      wordCount,
      summary: this.generateSummary(finalText),
    };
  }

  /**
   * Parse and clean direct text input for AI processing
   *
   * Processes user-provided text input through the same cleaning
   * and validation pipeline as webpage content.
   *
   * @param text - Direct text input from user
   * @returns Parsed and cleaned content structure
   * @throws Error if text is too short or invalid
   */
  static parseDirectText(text: string): ParsedContent {
    const cleanedText = this.cleanText(text);

    if (cleanedText.length < this.MIN_CONTENT_LENGTH) {
      throw new Error("Text too short to process");
    }

    const finalText =
      cleanedText.length > this.MAX_CONTENT_LENGTH
        ? cleanedText.substring(0, this.MAX_CONTENT_LENGTH) + "..."
        : cleanedText;

    const wordCount = this.countWords(finalText);

    return {
      cleanedText: finalText,
      title: "Direct Text Input",
      wordCount,
    };
  }

  private static cleanText(text: string): string {
    return (
      text
        // Decode HTML entities first
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ")
        // Remove excessive whitespace
        .replace(/\s+/g, " ")
        // Remove multiple consecutive newlines
        .replace(/\n\s*\n\s*\n/g, "\n\n")
        // Remove leading/trailing whitespace
        .trim()
        // Remove common web artifacts
        .replace(
          /\b(Cookie|Privacy Policy|Terms of Service|Subscribe|Newsletter|Advertisement)\b/gi,
          "",
        )
        // Remove email addresses and URLs (basic patterns)
        .replace(/\S+@\S+\.\S+/g, "")
        .replace(/https?:\/\/\S+/g, "")
        // Remove excessive punctuation
        .replace(/[.]{3,}/g, "...")
        .replace(/[!]{2,}/g, "!")
        .replace(/[?]{2,}/g, "?")
    );
  }

  private static cleanTitle(title: string): string {
    return (
      title
        // Decode HTML entities first
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .replace(/[|\-–—]\s*.*$/, "") // Remove site name after separator
        .trim()
        .substring(0, 200)
    ); // Limit title length
  }

  private static countWords(text: string): number {
    return text
      .split(/\s+/)
      .filter((word) => word.length > 0 && /\w/.test(word)).length;
  }

  private static generateSummary(text: string): string {
    // Extract first paragraph or first 200 characters as summary
    const firstParagraph = text.split("\n")[0];
    if (firstParagraph.length > 50 && firstParagraph.length < 300) {
      return firstParagraph;
    }

    return text.substring(0, 200) + (text.length > 200 ? "..." : "");
  }

  static validateContent(content: ParsedContent): void {
    if (!content.cleanedText || content.cleanedText.trim().length === 0) {
      throw new Error("No valid content found");
    }

    if (content.wordCount < 10) {
      throw new Error("Content too short for meaningful transformation");
    }

    if (content.wordCount > 2000) {
      logger.warn(
        "Content is quite long and may result in truncated transformation",
      );
    }
  }
}
