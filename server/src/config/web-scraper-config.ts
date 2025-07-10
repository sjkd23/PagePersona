/**
 * Web Scraper Configuration
 * 
 * Centralized configuration for web scraping operations with environment variable
 * support and validation. This replaces hardcoded magic numbers and provides
 * safe defaults with proper error handling.
 */

import { logger } from '../utils/logger';

export interface WebScraperConfig {
  /** Maximum content length in characters before truncation */
  maxContentLength: number;
  /** HTTP request timeout in milliseconds */
  requestTimeout: number;
  /** User agent string for HTTP requests */
  userAgent: string;
}

/**
 * Default configuration values for the web scraper
 */
export const WebScraperDefaults = {
  MAX_CONTENT_LENGTH: 8000,
  REQUEST_TIMEOUT_MS: 10000,
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
} as const;

/**
 * Safely parses an environment variable as an integer with validation
 * @param envValue - The environment variable value
 * @param defaultValue - Default value to use if parsing fails
 * @param configName - Name of the config for error messages
 * @returns Parsed integer value or default
 */
function safeParseInt(envValue: string | undefined, defaultValue: number, configName: string): number {
  if (!envValue) {
    return defaultValue;
  }

  const parsed = parseInt(envValue, 10);
  
  if (Number.isNaN(parsed)) {
    logger.warn(`Invalid ${configName} environment variable: "${envValue}". Using default: ${defaultValue}`);
    return defaultValue;
  }

  if (parsed <= 0) {
    logger.warn(`${configName} must be positive. Got: ${parsed}. Using default: ${defaultValue}`);
    return defaultValue;
  }

  return parsed;
}

/**
 * Loads and validates web scraper configuration from environment variables
 * with safe fallbacks to defaults.
 * 
 * Environment variables:
 * - WEB_SCRAPER_MAX_CONTENT_LENGTH: Maximum content length (default: 8000)
 * - WEB_SCRAPER_REQUEST_TIMEOUT_MS: Request timeout in ms (default: 10000)
 * - WEB_SCRAPER_USER_AGENT: User agent string
 * 
 * @returns Validated configuration object
 */
export function loadWebScraperConfig(): WebScraperConfig {
  const config: WebScraperConfig = {
    maxContentLength: safeParseInt(
      process.env.WEB_SCRAPER_MAX_CONTENT_LENGTH,
      WebScraperDefaults.MAX_CONTENT_LENGTH,
      'WEB_SCRAPER_MAX_CONTENT_LENGTH'
    ),
    requestTimeout: safeParseInt(
      process.env.WEB_SCRAPER_REQUEST_TIMEOUT_MS,
      WebScraperDefaults.REQUEST_TIMEOUT_MS,
      'WEB_SCRAPER_REQUEST_TIMEOUT_MS'
    ),
    userAgent: process.env.WEB_SCRAPER_USER_AGENT || WebScraperDefaults.USER_AGENT
  };

  // Additional validation
  if (config.maxContentLength > 50000) {
    logger.warn(`MAX_CONTENT_LENGTH is very high (${config.maxContentLength}). This may impact performance.`);
  }

  if (config.requestTimeout > 60000) {
    logger.warn(`REQUEST_TIMEOUT is very high (${config.requestTimeout}ms). This may cause long delays.`);
  }

  return config;
}

/**
 * Global web scraper configuration instance
 * Initialized once and reused throughout the application
 */
export const webScraperConfig = loadWebScraperConfig();
