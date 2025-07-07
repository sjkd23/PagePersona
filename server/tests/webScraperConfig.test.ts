/**
 * Test file for Web Scraper Configuration
 * 
 * This test verifies that the configuration loading works correctly
 * and validates environment variable parsing with proper fallbacks.
 */

import { describe, test, beforeEach, afterAll, expect } from 'vitest';
import { loadWebScraperConfig, WebScraperDefaults, webScraperConfig } from '../src/config/web-scraper-config';

describe('WebScraperConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables for each test
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('loadWebScraperConfig', () => {
    test('should return default values when no environment variables are set', () => {
      delete process.env.WEB_SCRAPER_MAX_CONTENT_LENGTH;
      delete process.env.WEB_SCRAPER_REQUEST_TIMEOUT_MS;
      delete process.env.WEB_SCRAPER_USER_AGENT;

      const config = loadWebScraperConfig();

      expect(config.maxContentLength).toBe(WebScraperDefaults.MAX_CONTENT_LENGTH);
      expect(config.requestTimeout).toBe(WebScraperDefaults.REQUEST_TIMEOUT_MS);
      expect(config.userAgent).toBe(WebScraperDefaults.USER_AGENT);
    });

    test('should use environment variables when valid values are provided', () => {
      process.env.WEB_SCRAPER_MAX_CONTENT_LENGTH = '12000';
      process.env.WEB_SCRAPER_REQUEST_TIMEOUT_MS = '15000';
      process.env.WEB_SCRAPER_USER_AGENT = 'Custom Bot 1.0';

      const config = loadWebScraperConfig();

      expect(config.maxContentLength).toBe(12000);
      expect(config.requestTimeout).toBe(15000);
      expect(config.userAgent).toBe('Custom Bot 1.0');
    });

    test('should fallback to defaults for invalid numeric values', () => {
      process.env.WEB_SCRAPER_MAX_CONTENT_LENGTH = 'invalid';
      process.env.WEB_SCRAPER_REQUEST_TIMEOUT_MS = 'not-a-number';

      const config = loadWebScraperConfig();

      expect(config.maxContentLength).toBe(WebScraperDefaults.MAX_CONTENT_LENGTH);
      expect(config.requestTimeout).toBe(WebScraperDefaults.REQUEST_TIMEOUT_MS);
    });

    test('should fallback to defaults for negative values', () => {
      process.env.WEB_SCRAPER_MAX_CONTENT_LENGTH = '-100';
      process.env.WEB_SCRAPER_REQUEST_TIMEOUT_MS = '-5000';

      const config = loadWebScraperConfig();

      expect(config.maxContentLength).toBe(WebScraperDefaults.MAX_CONTENT_LENGTH);
      expect(config.requestTimeout).toBe(WebScraperDefaults.REQUEST_TIMEOUT_MS);
    });

    test('should fallback to defaults for zero values', () => {
      process.env.WEB_SCRAPER_MAX_CONTENT_LENGTH = '0';
      process.env.WEB_SCRAPER_REQUEST_TIMEOUT_MS = '0';

      const config = loadWebScraperConfig();

      expect(config.maxContentLength).toBe(WebScraperDefaults.MAX_CONTENT_LENGTH);
      expect(config.requestTimeout).toBe(WebScraperDefaults.REQUEST_TIMEOUT_MS);
    });
  });

  describe('webScraperConfig global instance', () => {
    test('should be properly initialized', () => {
      expect(webScraperConfig).toBeDefined();
      expect(typeof webScraperConfig.maxContentLength).toBe('number');
      expect(typeof webScraperConfig.requestTimeout).toBe('number');
      expect(typeof webScraperConfig.userAgent).toBe('string');
      expect(webScraperConfig.maxContentLength).toBeGreaterThan(0);
      expect(webScraperConfig.requestTimeout).toBeGreaterThan(0);
      expect(webScraperConfig.userAgent.length).toBeGreaterThan(0);
    });
  });
});
