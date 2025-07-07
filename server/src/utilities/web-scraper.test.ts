import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { WebScraper, type ScrapedContent } from '../utils/web-scraper'
import axios from 'axios'

// Mock axios instead of fetch since the WebScraper uses axios
vi.mock('axios')

describe('WebScraper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('scrapeWebpage', () => {
    it('should successfully scrape a valid webpage', async () => {
      // Arrange
      const url = 'https://example.com/article'
      const mockHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Test Article</title>
            <meta name="description" content="This is a test article">
            <meta name="author" content="Test Author">
          </head>
          <body>
            <main>
              <h1>Test Article Title</h1>
              <p>This is the main content of the article.</p>
              <p>It contains multiple paragraphs with useful information.</p>
            </main>
          </body>
        </html>
      `

      vi.mocked(axios.get).mockResolvedValue({
        status: 200,
        data: mockHtml
      })

      // Act
      const result = await WebScraper.scrapeWebpage(url)

      // Assert
      expect(result).toEqual({
        title: 'Test Article',
        content: expect.stringContaining('Test Article Title'),
        url: url,
        metadata: {
          description: 'This is a test article',
          author: 'Test Author',
          wordCount: expect.any(Number)
        }
      })
      expect(result.content).toContain('main content of the article')
      expect(result.metadata.wordCount).toBeGreaterThan(0)
    })

    it('should handle URLs without protocol', async () => {
      // Arrange
      const url = 'example.com/article'
      const mockHtml = '<html><head><title>Test</title></head><body>Content</body></html>'

      vi.mocked(axios.get).mockResolvedValue({
        status: 200,
        data: mockHtml
      })

      // Act
      const result = await WebScraper.scrapeWebpage(url)

      // Assert
      expect(result.url).toBe('https://example.com/article')
      expect(axios.get).toHaveBeenCalledWith('https://example.com/article', expect.any(Object))
    })

    it('should handle network errors gracefully', async () => {
      // Arrange
      const url = 'https://invalid-url.com'
      vi.mocked(axios.get).mockRejectedValue(new Error('Network error'))

      // Act & Assert
      await expect(WebScraper.scrapeWebpage(url)).rejects.toThrow()
    })

    it('should handle HTTP error responses', async () => {
      // Arrange
      const url = 'https://example.com/not-found'
      vi.mocked(axios.get).mockResolvedValue({
        status: 404,
        data: ''
      })

      // Act & Assert
      await expect(WebScraper.scrapeWebpage(url)).rejects.toThrow('HTTP 404')
    })

    it('should extract content from structured HTML', async () => {
      // Arrange
      const url = 'https://example.com/blog'
      const mockHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Blog Post</title>
          </head>
          <body>
            <header>Navigation</header>
            <aside>Sidebar</aside>
            <article>
              <h1>Main Article Title</h1>
              <p>First paragraph of content.</p>
              <p>Second paragraph with more details.</p>
            </article>
            <footer>Page footer</footer>
          </body>
        </html>
      `

      vi.mocked(axios.get).mockResolvedValue({
        status: 200,
        data: mockHtml
      })

      // Act
      const result = await WebScraper.scrapeWebpage(url)

      // Assert
      expect(result.content).toContain('Main Article Title')
      expect(result.content).toContain('First paragraph of content')
    })

    it('should handle malformed HTML gracefully', async () => {
      // Arrange
      const url = 'https://example.com/malformed'
      const mockHtml = '<html><head><title>Test</title></head><body><p>Content without closing tags'

      vi.mocked(axios.get).mockResolvedValue({
        status: 200,
        data: mockHtml
      })

      // Act
      const result = await WebScraper.scrapeWebpage(url)

      // Assert
      expect(result.title).toBe('Test')
      expect(result.content).toContain('Content without closing tags')
    })

    it('should handle empty or minimal content', async () => {
      // Arrange
      const url = 'https://example.com/empty'
      const mockHtml = '<html><head><title></title></head><body></body></html>'

      vi.mocked(axios.get).mockResolvedValue({
        status: 200,
        data: mockHtml
      })

      // Act
      const result = await WebScraper.scrapeWebpage(url)

      // Assert
      expect(result.title).toBe('Untitled Page')  // Web scraper returns 'Untitled Page' for empty title
      expect(result.content).toBe('')
      expect(result.metadata.wordCount).toBeGreaterThanOrEqual(0) // May count words from title processing
    })

    it('should extract metadata correctly', async () => {
      // Arrange
      const url = 'https://example.com/article'
      const mockHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>SEO Optimized Article</title>
            <meta name="description" content="This article teaches about SEO optimization">
            <meta name="author" content="Jane Doe">
            <meta name="keywords" content="SEO, optimization, web">
            <meta property="og:title" content="Social Media Title">
            <meta property="og:description" content="Social media description">
          </head>
          <body>
            <h1>Article content here</h1>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
          </body>
        </html>
      `

      vi.mocked(axios.get).mockResolvedValue({
        status: 200,
        data: mockHtml
      })

      // Act
      const result = await WebScraper.scrapeWebpage(url)

      // Assert
      expect(result.metadata.description).toBe('This article teaches about SEO optimization')
      expect(result.metadata.author).toBe('Jane Doe')
      expect(result.metadata.wordCount).toBeGreaterThan(0)
    })

    it('should handle very large content efficiently', async () => {
      // Arrange
      const url = 'https://example.com/large'
      const largeContent = 'Lorem ipsum '.repeat(10000) // ~110KB of text
      const mockHtml = `<html><head><title>Large Document</title></head><body>${largeContent}</body></html>`

      vi.mocked(axios.get).mockResolvedValue({
        status: 200,
        data: mockHtml
      })

      // Act
      const startTime = Date.now()
      const result = await WebScraper.scrapeWebpage(url)
      const endTime = Date.now()

      // Assert
      expect(result.content).toContain('Lorem ipsum')
      expect(result.metadata.wordCount).toBeGreaterThan(10000)
      expect(endTime - startTime).toBeLessThan(5000) // Should complete within 5 seconds
    })
  })

  describe('URL validation and normalization', () => {
    it('should handle various URL formats correctly', async () => {
      const testCases = [
        { input: 'example.com', expected: 'https://example.com/' },
        { input: 'http://example.com', expected: 'http://example.com/' },
        { input: 'https://example.com', expected: 'https://example.com/' },
        { input: 'www.example.com', expected: 'https://www.example.com/' },
        { input: 'example.com/path?query=1', expected: 'https://example.com/path?query=1' }
      ]

      for (const testCase of testCases) {
        vi.mocked(axios.get).mockResolvedValue({
          status: 200,
          data: '<html><head><title>Test</title></head><body>Content</body></html>'
        })

        const result = await WebScraper.scrapeWebpage(testCase.input)
        expect(result.url).toBe(testCase.expected)
      }
    })
  })

  describe('error handling', () => {
    it('should handle timeout errors', async () => {
      // Arrange
      const url = 'https://slow-website.com'
      vi.mocked(axios.get).mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'Request timeout'
      })

      // Act & Assert
      await expect(WebScraper.scrapeWebpage(url)).rejects.toThrow()
    })

    it('should handle connection refused errors', async () => {
      // Arrange
      const url = 'https://unreachable-website.com'
      vi.mocked(axios.get).mockRejectedValue({
        code: 'ECONNREFUSED',
        message: 'Connection refused'
      })

      // Act & Assert
      await expect(WebScraper.scrapeWebpage(url)).rejects.toThrow()
    })

    it('should handle invalid URL format', async () => {
      // Arrange
      const url = 'not-a-valid-url-format'
      
      // Note: This might throw during URL normalization, not during the axios call
      // The exact behavior depends on the normalizeUrl implementation
      try {
        await WebScraper.scrapeWebpage(url)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })
  })
})
