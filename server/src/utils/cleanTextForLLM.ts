/**
 * Text Cleaning & Optimization for LLM Processing
 *
 * Lightweight utility to reduce OpenAI token usage by intelligently
 * cleaning and truncating text before API calls. Removes boilerplate,
 * normalizes whitespace, and applies smart truncation strategies.
 *
 * Features:
 * - HTML/script/style removal
 * - Navigation and menu item detection
 * - Cookie banner and boilerplate removal
 * - Smart truncation (preserve beginning + ending)
 * - Token estimation and metrics logging
 * - Configurable character limits
 */

import * as cheerio from "cheerio";
import { logger } from "./logger";

/**
 * Configuration options for text cleaning
 */
export interface CleanTextOptions {
  /** Maximum characters to allow (default: 45000) */
  maxChars?: number;
  /** Percentage of content to preserve from start (default: 0.8 = 80%) */
  preserveStartRatio?: number;
  /** Percentage of content to preserve from end (default: 0.2 = 20%) */
  preserveEndRatio?: number;
  /** Include detailed metrics in logs (default: true) */
  enableMetrics?: boolean;
  /** Title of the document (optional) */
  title?: string;
  /** Canonical URL (optional) */
  url?: string;
  /** Extract headings list (default: false) */
  includeHeadings?: boolean;
}

/**
 * Result of text cleaning operation
 */
export interface CleanedTextResult {
  /** Cleaned and optimized text */
  cleanedText: string;
  /** Optional title */
  title?: string;
  /** Optional URL */
  url?: string;
  /** List of extracted headings (if enabled) */
  headings?: string[];
  /** Metrics about the cleaning operation */
  metrics: {
    originalLength: number;
    cleanedLength: number;
    reductionPercent: number;
    estimatedOriginalTokens: number;
    estimatedCleanedTokens: number;
    tokenReduction: number;
    wasTruncated: boolean;
  };
}

/**
 * Default configuration values
 */
const DEFAULT_OPTIONS: Required<Omit<CleanTextOptions, "title" | "url">> &
  Pick<CleanTextOptions, "title" | "url"> = {
  maxChars: 45000,
  preserveStartRatio: 0.8,
  preserveEndRatio: 0.2,
  enableMetrics: true,
  title: undefined,
  url: undefined,
  includeHeadings: false,
};

/**
 * Clean and optimize text for LLM processing
 *
 * Main entry point for text cleaning. Accepts raw HTML or plain text,
 * removes unwanted elements, applies smart truncation, and returns
 * optimized content with metrics.
 *
 * @param rawInput - Raw HTML string or plain text
 * @param options - Configuration options
 * @returns Cleaned text with metadata and metrics
 */
export function cleanTextForLLM(
  rawInput: string,
  options: CleanTextOptions = {},
): CleanedTextResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const originalLength = rawInput.length;

  logger.debug("[cleanTextForLLM] Starting text cleaning", {
    originalLength,
    maxChars: opts.maxChars,
    hasTitle: !!opts.title,
    hasUrl: !!opts.url,
  });

  // Step 1: Determine if input is HTML or plain text
  const isHTML = detectHTML(rawInput);

  // Step 2: Extract text from HTML if needed
  const extractedText = isHTML ? extractTextFromHTML(rawInput) : rawInput;

  // Step 3: Extract headings if requested
  let headings: string[] | undefined;
  if (opts.includeHeadings && isHTML) {
    headings = extractHeadings(rawInput);
  }

  // Step 4: Apply comprehensive text cleaning
  let cleanedText = cleanText(extractedText);

  // Step 5: Apply character limit with smart truncation
  let wasTruncated = false;
  if (cleanedText.length > opts.maxChars) {
    cleanedText = smartTruncate(
      cleanedText,
      opts.maxChars,
      opts.preserveStartRatio,
    );
    wasTruncated = true;
  }

  // Step 6: Calculate metrics
  const cleanedLength = cleanedText.length;
  const reductionPercent =
    ((originalLength - cleanedLength) / originalLength) * 100;
  const estimatedOriginalTokens = estimateTokens(rawInput);
  const estimatedCleanedTokens = estimateTokens(cleanedText);
  const tokenReduction = estimatedOriginalTokens - estimatedCleanedTokens;

  const metrics = {
    originalLength,
    cleanedLength,
    reductionPercent,
    estimatedOriginalTokens,
    estimatedCleanedTokens,
    tokenReduction,
    wasTruncated,
  };

  // Step 7: Log metrics if enabled
  if (opts.enableMetrics) {
    logger.info("[cleanTextForLLM] Text cleaning completed", {
      ...metrics,
      title: opts.title,
      url: opts.url,
      headingsCount: headings?.length || 0,
    });
  }

  return {
    cleanedText,
    title: opts.title,
    url: opts.url,
    headings,
    metrics,
  };
}

/**
 * Detect if input string is HTML
 */
function detectHTML(input: string): boolean {
  // Simple heuristic: check for HTML tags
  return /<[a-z][\s\S]*>/i.test(input);
}

/**
 * Extract clean text from HTML
 *
 * Removes scripts, styles, navigation elements, and other non-content HTML.
 */
function extractTextFromHTML(html: string): string {
  const $ = cheerio.load(html);

  // Remove unwanted elements
  $(
    "script, style, noscript, iframe, object, embed, " +
      "nav, header, footer, aside, " +
      ".advertisement, .ads, .ad, .social-share, .social-sharing, " +
      ".cookie-banner, .cookie-notice, .cookie-consent, " +
      ".newsletter, .subscription-banner, " +
      ".related-articles, .recommended, " +
      '[class*="cookie"], [id*="cookie"], ' +
      '[class*="banner"], [class*="popup"], ' +
      '[class*="modal"], [class*="overlay"]',
  ).remove();

  // Extract text from body
  let text = $("body").text();

  // If body is empty, try the entire document
  if (!text || text.trim().length < 50) {
    text = $.text();
  }

  return text;
}

/**
 * Extract headings from HTML
 */
function extractHeadings(html: string): string[] {
  const $ = cheerio.load(html);
  const headings: string[] = [];

  $("h1, h2, h3, h4, h5, h6").each((_, element) => {
    const text = $(element).text().trim();
    if (text && text.length > 0) {
      headings.push(text);
    }
  });

  return headings;
}

/**
 * Comprehensive text cleaning
 *
 * Removes boilerplate, normalizes whitespace, removes navigation-like
 * content, and cleans up common web artifacts.
 */
function cleanText(text: string): string {
  let cleaned = text;

  // Step 1: Decode HTML entities
  cleaned = cleaned
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–");

  // Step 2: Remove URLs and email addresses
  cleaned = cleaned
    .replace(/https?:\/\/[^\s]+/gi, "") // URLs
    .replace(/www\.[^\s]+/gi, "") // www links
    .replace(/\S+@\S+\.\S+/g, ""); // Emails

  // Step 3: Remove common boilerplate patterns (case-insensitive)
  const boilerplatePatterns = [
    /\b(cookie|cookies|cookie policy|cookie notice|cookie consent)\b[^\n.!?]{0,100}[.!?]/gi,
    /\b(privacy policy|terms of service|terms and conditions|legal notice)\b[^\n.!?]{0,100}[.!?]/gi,
    /\b(subscribe|newsletter|sign up for|join our|follow us)\b[^\n.!?]{0,100}[.!?]/gi,
    /\b(advertisement|sponsored content|ad choice|advertisements)\b[^\n.!?]{0,100}[.!?]/gi,
    /\b(all rights reserved|copyright \d{4})\b[^\n]{0,100}/gi,
    /\b(accept cookies|manage cookies|we use cookies)\b[^\n.!?]{0,200}[.!?]/gi,
  ];

  for (const pattern of boilerplatePatterns) {
    cleaned = cleaned.replace(pattern, "");
  }

  // Step 4: Remove navigation-like lines (short lines with lots of separators)
  // Split by newlines, filter out navigation items
  const lines = cleaned.split("\n");
  const filteredLines = lines.filter((line) => {
    const trimmed = line.trim();

    // Skip very short lines (likely menu items)
    if (trimmed.length < 10 && trimmed.length > 0) {
      return false;
    }

    // Skip lines with high ratio of separators (|, •, -, >, etc.)
    const separatorCount = (trimmed.match(/[|•\->/\\]/g) || []).length;
    if (separatorCount > trimmed.length * 0.3) {
      return false;
    }

    // Skip lines that are mostly uppercase (likely headers/nav)
    const upperCount = (trimmed.match(/[A-Z]/g) || []).length;
    if (upperCount > trimmed.length * 0.8 && trimmed.length < 50) {
      return false;
    }

    return true;
  });

  cleaned = filteredLines.join("\n");

  // Step 5: Normalize whitespace
  cleaned = cleaned
    .replace(/[ \t]+/g, " ") // Multiple spaces/tabs to single space
    .replace(/\n\s*\n\s*\n+/g, "\n\n") // Multiple newlines to double newline
    .replace(/^\s+/gm, "") // Leading whitespace on lines
    .trim();

  // Step 6: Remove excessive punctuation
  cleaned = cleaned
    .replace(/\.{4,}/g, "...") // Multiple periods
    .replace(/!{2,}/g, "!") // Multiple exclamations
    .replace(/\?{2,}/g, "?") // Multiple questions
    .replace(/[,]{2,}/g, ","); // Multiple commas

  // Step 7: Remove lines that are just separators or dashes
  cleaned = cleaned.replace(/^[\s\-=_*]{3,}$/gm, "");

  // Step 8: Final trim and cleanup
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Smart truncation strategy
 *
 * Preserves the beginning of the content (80% by default) plus a small
 * tail from the end (20% by default) to retain conclusions and summaries.
 *
 * @param text - Text to truncate
 * @param maxChars - Maximum character limit
 * @param preserveStartRatio - Ratio of content to keep from start (0-1)
 * @returns Truncated text
 */
function smartTruncate(
  text: string,
  maxChars: number,
  preserveStartRatio: number,
): string {
  if (text.length <= maxChars) {
    return text;
  }

  // Calculate sizes
  const startChars = Math.floor(maxChars * preserveStartRatio);
  const endChars = maxChars - startChars - 100; // Reserve 100 chars for separator

  // Extract start and end portions
  const startPortion = text.substring(0, startChars);
  const endPortion = text.substring(text.length - endChars);

  // Add separator
  const separator = "\n\n[... middle content truncated for brevity ...]\n\n";

  return startPortion + separator + endPortion;
}

/**
 * Estimate token count from text
 *
 * Uses a simple heuristic: ~4 characters per token on average for English text.
 * This is a rough approximation but good enough for cost estimation.
 *
 * @param text - Text to estimate tokens for
 * @returns Estimated token count
 */
function estimateTokens(text: string): number {
  // Average ~4 characters per token for English
  // More accurate than word count for LLMs
  return Math.ceil(text.length / 4);
}

/**
 * Clean text from already-scraped content
 *
 * Convenience wrapper for use with existing ScrapedContent objects.
 * Applies cleaning to the content field while preserving metadata.
 */
export function cleanScrapedContent(
  content: string,
  title?: string,
  url?: string,
  options: CleanTextOptions = {},
): CleanedTextResult {
  return cleanTextForLLM(content, {
    ...options,
    title,
    url,
  });
}
