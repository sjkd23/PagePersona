import * as cheerio from 'cheerio'
import { logger } from '../utils/logger'

export interface ScrapedContent {
  title: string
  content: string
  url: string
  metadata: {
    wordCount: number
    description?: string
    author?: string
    publishDate?: string
  }
}

export interface ScrapingOptions {
  timeout?: number
  maxContentLength?: number
  userAgent?: string
}

const DEFAULT_OPTIONS: ScrapingOptions = {
  timeout: 10000,
  maxContentLength: 50000,
  userAgent: 'Mozilla/5.0 (compatible; PagePersonAI/1.0; +https://pagepersonai.com/bot)'
}

export class ScraperService {
  private options: ScrapingOptions

  constructor(options: ScrapingOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  async scrapeContent(url: string): Promise<ScrapedContent> {
    logger.info('Starting content scraping', { url })

    try {
      const response = await this.fetchWithTimeout(url)
      const html = await response.text()
      
      const $ = cheerio.load(html)
      
      // Extract title
      const title = this.extractTitle($)
      
      // Extract main content
      const content = this.extractMainContent($)
      
      // Extract metadata
      const metadata = this.extractMetadata($, content)
      
      const result: ScrapedContent = {
        title,
        content,
        url,
        metadata
      }

      logger.info('Content scraping completed', {
        url,
        titleLength: title.length,
        contentLength: content.length,
        wordCount: metadata.wordCount
      })

      return result
    } catch (error) {
      logger.error('Scraping failed', { url, error })
      throw new Error(`Failed to scrape content from ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.options.timeout)

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': this.options.userAgent!,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return response
    } finally {
      clearTimeout(timeoutId)
    }
  }

  private extractTitle($: cheerio.CheerioAPI): string {
    // Try multiple selectors for title
    const titleSelectors = [
      'title',
      'h1',
      '[property="og:title"]',
      '[name="twitter:title"]',
      '.article-title',
      '.entry-title',
      '.post-title'
    ]

    for (const selector of titleSelectors) {
      const element = $(selector).first()
      if (element.length) {
        const title = element.attr('content') || element.text()
        if (title && title.trim().length > 0) {
          return title.trim()
        }
      }
    }

    return 'Untitled'
  }

  private extractMainContent($: cheerio.CheerioAPI): string {
    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, .advertisement, .ads, .social-share').remove()

    // Try to find main content using various selectors
    const contentSelectors = [
      'article',
      'main',
      '.content',
      '.article-content',
      '.entry-content',
      '.post-content',
      '.article-body',
      '#content',
      '.main-content'
    ]

    let content = ''

    for (const selector of contentSelectors) {
      const element = $(selector).first()
      if (element.length) {
        content = element.text()
        if (content && content.trim().length > 100) {
          break
        }
      }
    }

    // If no main content found, try body
    if (!content || content.trim().length < 100) {
      content = $('body').text()
    }

    // Clean up the content
    content = content
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .replace(/\n\s*\n/g, '\n\n')  // Normalize line breaks
      .trim()

    // Truncate if too long
    if (content.length > this.options.maxContentLength!) {
      content = content.substring(0, this.options.maxContentLength!) + '...'
    }

    return content
  }

  private extractMetadata($: cheerio.CheerioAPI, content: string) {
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length

    const description = $('[name="description"]').attr('content') ||
                       $('[property="og:description"]').attr('content') ||
                       $('[name="twitter:description"]').attr('content') ||
                       ''

    const author = $('[name="author"]').attr('content') ||
                  $('[property="article:author"]').attr('content') ||
                  $('.author').first().text() ||
                  ''

    const publishDate = $('[property="article:published_time"]').attr('content') ||
                       $('[name="publish_date"]').attr('content') ||
                       $('time').first().attr('datetime') ||
                       ''

    return {
      wordCount,
      description: description.trim() || undefined,
      author: author.trim() || undefined,
      publishDate: publishDate.trim() || undefined
    }
  }
}
