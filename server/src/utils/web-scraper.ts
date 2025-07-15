import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';
import { webScraperConfig } from '../config/web-scraper-config';

export interface ScrapedContent {
  title: string;
  content: string;
  url: string;
  metadata: {
    description?: string;
    author?: string;
    publishDate?: string;
    wordCount: number;
  };
}

export class WebScraper {
  // Configuration loaded from centralized config with environment variable support
  private static readonly config = webScraperConfig;

  static async scrapeWebpage(url: string): Promise<ScrapedContent> {
    try {
      // Validate and normalize URL
      const normalizedUrl = this.normalizeUrl(url);

      // Fetch the webpage
      const response = await axios.get(normalizedUrl, {
        timeout: this.config.requestTimeout,
        headers: {
          'User-Agent': this.config.userAgent,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          Connection: 'keep-alive',
        },
      });

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: Failed to fetch webpage`);
      }

      // Parse HTML content
      const $ = cheerio.load(response.data);

      // Extract title
      const title = this.extractTitle($);

      // Extract main content
      const content = this.extractContent($);

      // Extract metadata
      const metadata = this.extractMetadata($, content);

      return {
        title,
        content: this.truncateContent(content),
        url: normalizedUrl,
        metadata,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ENOTFOUND') {
          throw new Error('Website not found. Please check the URL and try again.');
        }
        if (error.code === 'ECONNREFUSED') {
          throw new Error('Connection refused. The website may be down.');
        }
        if (error.response?.status === 403) {
          throw new Error('Access forbidden. This website blocks automated requests.');
        }
        if (error.response?.status === 404) {
          throw new Error('Page not found. Please check the URL.');
        }
      }

      throw new Error(
        `Failed to scrape webpage: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private static normalizeUrl(url: string): string {
    try {
      // Add protocol if missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
      }

      // Validate URL
      const parsedUrl = new URL(url);

      // Block private/internal URLs for security
      if (this.isPrivateUrl(parsedUrl)) {
        throw new Error('Private or internal URLs are not allowed');
      }

      return parsedUrl.toString();
    } catch (error) {
      throw new Error('Invalid URL format');
    }
  }

  private static isPrivateUrl(url: URL): boolean {
    const hostname = url.hostname;

    // Check for localhost and private IP ranges
    const privatePatterns = [
      /^localhost$/i,
      /^127\./,
      /^192\.168\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^::1$/,
      /^fc00:/,
      /^fe80:/,
    ];

    return privatePatterns.some((pattern) => pattern.test(hostname));
  }

  private static extractTitle($: cheerio.CheerioAPI): string {
    // Try different title sources in order of preference
    let title = $('title').first().text().trim();

    if (!title) {
      title = $('h1').first().text().trim();
    }

    if (!title) {
      title = $('meta[property="og:title"]').attr('content')?.trim() || '';
    }

    if (!title) {
      title = $('meta[name="title"]').attr('content')?.trim() || '';
    }

    return title || 'Untitled Page';
  }

  private static extractContent($: cheerio.CheerioAPI): string {
    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, .advertisement, .ads, .sidebar').remove();

    // Try to find main content area
    let content = '';

    // Look for common content containers
    const contentSelectors = [
      'main',
      'article',
      '.content',
      '.main-content',
      '.post-content',
      '.entry-content',
      '#content',
      '#main',
    ];

    for (const selector of contentSelectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim().length > content.length) {
        content = element.text().trim();
      }
    }

    // If no specific content area found, extract from body
    if (!content || content.length < 100) {
      content = $('body').text().trim();
    }

    // Clean up whitespace
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();

    return content;
  }

  private static extractMetadata($: cheerio.CheerioAPI, content: string) {
    const description =
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      content.substring(0, 200) + '...';

    const author =
      $('meta[name="author"]').attr('content') ||
      $('meta[property="article:author"]').attr('content') ||
      $('[rel="author"]').text().trim();

    const publishDate =
      $('meta[property="article:published_time"]').attr('content') ||
      $('meta[name="date"]').attr('content') ||
      $('time[datetime]').attr('datetime');

    const wordCount = content.split(/\s+/).length;

    return {
      description,
      author: author || undefined,
      publishDate: publishDate || undefined,
      wordCount,
    };
  }

  private static truncateContent(content: string): string {
    if (content.length <= this.config.maxContentLength) {
      return content;
    }

    // Truncate at word boundary
    const truncated = content.substring(0, this.config.maxContentLength);
    const lastSpace = truncated.lastIndexOf(' ');

    return lastSpace > this.config.maxContentLength * 0.8
      ? truncated.substring(0, lastSpace) + '...'
      : truncated + '...';
  }
}
