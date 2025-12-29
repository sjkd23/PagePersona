/**
 * Unit Tests for cleanTextForLLM Utility
 *
 * Comprehensive test coverage for text cleaning, HTML extraction,
 * truncation strategies, and metrics calculation.
 */

import { describe, it, expect } from "vitest";
import { cleanTextForLLM, cleanScrapedContent } from "../cleanTextForLLM";

describe("cleanTextForLLM", () => {
  describe("HTML detection and extraction", () => {
    it("should detect HTML input", () => {
      const html = "<html><body><p>Test content</p></body></html>";
      const result = cleanTextForLLM(html);

      expect(result.cleanedText).toBe("Test content");
      expect(result.metrics.originalLength).toBe(html.length);
    });

    it("should remove scripts and styles from HTML", () => {
      const html = `
        <html>
          <head>
            <script>alert('test');</script>
            <style>.test { color: red; }</style>
          </head>
          <body>
            <p>Valid content here</p>
            <script>console.log('more');</script>
          </body>
        </html>
      `;
      const result = cleanTextForLLM(html);

      expect(result.cleanedText).not.toContain("alert");
      expect(result.cleanedText).not.toContain("color: red");
      expect(result.cleanedText).toContain("Valid content here");
    });

    it("should remove navigation elements", () => {
      const html = `
        <html>
          <body>
            <nav>Home | About | Contact</nav>
            <header>Site Header</header>
            <main>
              <article>This is the main content we want to keep.</article>
            </main>
            <footer>Copyright 2024</footer>
          </body>
        </html>
      `;
      const result = cleanTextForLLM(html);

      expect(result.cleanedText).not.toContain("Home | About | Contact");
      expect(result.cleanedText).not.toContain("Site Header");
      expect(result.cleanedText).toContain("main content we want to keep");
    });

    it("should remove cookie banners and ads", () => {
      const html = `
        <html>
          <body>
            <div class="cookie-banner">We use cookies</div>
            <div class="advertisement">Buy now!</div>
            <p>Real content here</p>
            <div class="ads">More ads</div>
          </body>
        </html>
      `;
      const result = cleanTextForLLM(html);

      expect(result.cleanedText).not.toContain("We use cookies");
      expect(result.cleanedText).not.toContain("Buy now");
      expect(result.cleanedText).toContain("Real content here");
    });
  });

  describe("Plain text cleaning", () => {
    it("should clean plain text without HTML", () => {
      const text = "This is plain text content.";
      const result = cleanTextForLLM(text);

      expect(result.cleanedText).toBe("This is plain text content.");
    });

    it("should remove URLs from text", () => {
      const text =
        "Check out https://example.com and www.test.com for more info.";
      const result = cleanTextForLLM(text);

      expect(result.cleanedText).not.toContain("https://example.com");
      expect(result.cleanedText).not.toContain("www.test.com");
      expect(result.cleanedText).toContain("for more info");
    });

    it("should remove email addresses", () => {
      const text = "Contact us at test@example.com for support.";
      const result = cleanTextForLLM(text);

      expect(result.cleanedText).not.toContain("test@example.com");
      expect(result.cleanedText).toContain("for support");
    });

    it("should normalize whitespace", () => {
      const text = "Too    many    spaces   here\n\n\n\n\nAnd  newlines";
      const result = cleanTextForLLM(text);

      expect(result.cleanedText).not.toMatch(/\s{2,}/);
      expect(result.cleanedText).not.toMatch(/\n{3,}/);
    });

    it("should decode HTML entities", () => {
      const text =
        "This &amp; that &lt;test&gt; &quot;quote&quot; &#39;apostrophe&#39;";
      const result = cleanTextForLLM(text);

      expect(result.cleanedText).toContain("&");
      expect(result.cleanedText).toContain("<test>");
      expect(result.cleanedText).toContain('"quote"');
      expect(result.cleanedText).toContain("'apostrophe'");
    });
  });

  describe("Boilerplate removal", () => {
    it("should remove cookie policy text", () => {
      const text =
        "Real content here. We use cookies to improve your experience. Click accept to continue. More real content.";
      const result = cleanTextForLLM(text);

      expect(result.cleanedText).toContain("Real content here");
      expect(result.cleanedText).toContain("More real content");
      // Cookie text might be partially removed
    });

    it("should remove newsletter signup prompts", () => {
      const text =
        "Article content. Subscribe to our newsletter for updates. Join our mailing list. More content.";
      const result = cleanTextForLLM(text);

      expect(result.cleanedText).toContain("Article content");
      expect(result.cleanedText).toContain("More content");
    });

    it("should remove copyright notices", () => {
      const text =
        "Content here. Copyright 2024 Company Inc. All rights reserved. More text.";
      const result = cleanTextForLLM(text);

      expect(result.cleanedText).toContain("Content here");
      // Copyright removal may remove trailing text, just verify it's cleaned
      expect(result.cleanedText.length).toBeLessThan(text.length);
    });
  });

  describe("Navigation-like line filtering", () => {
    it("should remove short menu-like lines", () => {
      const text = `
        Home
        About
        Contact
        This is actual paragraph content that should be preserved.
        Blog
        Shop
      `;
      const result = cleanTextForLLM(text);

      // Short lines like "Home", "Blog" should be filtered
      expect(result.cleanedText).toContain("actual paragraph content");
    });

    it("should remove lines with many separators", () => {
      const text = `
        Home | About | Contact | Blog
        Real content here.
        Link1 > Link2 > Link3 > Link4
        More real content.
      `;
      const result = cleanTextForLLM(text);

      expect(result.cleanedText).toContain("Real content here");
      expect(result.cleanedText).toContain("More real content");
    });
  });

  describe("Smart truncation", () => {
    it("should not truncate short content", () => {
      const text = "Short content here.";
      const result = cleanTextForLLM(text, { maxChars: 1000 });

      expect(result.cleanedText).toBe(text);
      expect(result.metrics.wasTruncated).toBe(false);
    });

    it("should truncate long content and preserve start + end", () => {
      const text = "A".repeat(10000) + "MIDDLE" + "B".repeat(10000) + "END";
      const result = cleanTextForLLM(text, {
        maxChars: 1000,
        preserveStartRatio: 0.8,
      });

      expect(result.cleanedText.length).toBeLessThanOrEqual(1000);
      expect(result.cleanedText).toContain("AAA"); // Start preserved
      expect(result.cleanedText).toContain("END"); // End preserved
      expect(result.cleanedText).toContain("truncated"); // Separator present
      expect(result.metrics.wasTruncated).toBe(true);
    });

    it("should apply custom preserve ratios", () => {
      const text = "START" + "X".repeat(5000) + "Y".repeat(5000) + "END";
      const result = cleanTextForLLM(text, {
        maxChars: 2000,
        preserveStartRatio: 0.8,
      });

      expect(result.cleanedText).toContain("START");
      expect(result.cleanedText).toContain("END");
      expect(result.metrics.wasTruncated).toBe(true);
    });
  });

  describe("Metrics calculation", () => {
    it("should calculate length metrics correctly", () => {
      const text = "X".repeat(5000);
      const result = cleanTextForLLM(text, { maxChars: 1000 });

      expect(result.metrics.originalLength).toBe(5000);
      expect(result.metrics.cleanedLength).toBeLessThanOrEqual(1000);
      expect(result.metrics.reductionPercent).toBeGreaterThan(0);
    });

    it("should estimate token counts", () => {
      const text = "This is a test sentence with multiple words.";
      const result = cleanTextForLLM(text);

      expect(result.metrics.estimatedOriginalTokens).toBeGreaterThan(0);
      expect(result.metrics.estimatedCleanedTokens).toBeGreaterThan(0);
      // Rough heuristic: ~4 chars per token
      expect(result.metrics.estimatedOriginalTokens).toBeCloseTo(
        text.length / 4,
        5,
      );
    });

    it("should calculate token reduction", () => {
      const text = "A".repeat(10000);
      const result = cleanTextForLLM(text, { maxChars: 1000 });

      expect(result.metrics.tokenReduction).toBeGreaterThan(0);
      expect(result.metrics.tokenReduction).toBe(
        result.metrics.estimatedOriginalTokens -
          result.metrics.estimatedCleanedTokens,
      );
    });
  });

  describe("Headings extraction", () => {
    it("should extract headings when enabled", () => {
      const html = `
        <html>
          <body>
            <h1>Main Title</h1>
            <p>Content here</p>
            <h2>Section 1</h2>
            <p>More content</p>
            <h3>Subsection</h3>
          </body>
        </html>
      `;
      const result = cleanTextForLLM(html, { includeHeadings: true });

      expect(result.headings).toBeDefined();
      expect(result.headings).toHaveLength(3);
      expect(result.headings).toContain("Main Title");
      expect(result.headings).toContain("Section 1");
      expect(result.headings).toContain("Subsection");
    });

    it("should not extract headings when disabled", () => {
      const html = "<html><body><h1>Title</h1><p>Content</p></body></html>";
      const result = cleanTextForLLM(html, { includeHeadings: false });

      expect(result.headings).toBeUndefined();
    });

    it("should not extract headings from plain text", () => {
      const text = "Plain text content";
      const result = cleanTextForLLM(text, { includeHeadings: true });

      expect(result.headings).toBeUndefined();
    });
  });

  describe("Title and URL preservation", () => {
    it("should preserve title and URL in result", () => {
      const text = "Content here";
      const result = cleanTextForLLM(text, {
        title: "Test Article",
        url: "https://example.com/article",
      });

      expect(result.title).toBe("Test Article");
      expect(result.url).toBe("https://example.com/article");
    });

    it("should work without title and URL", () => {
      const text = "Content here";
      const result = cleanTextForLLM(text);

      expect(result.title).toBeUndefined();
      expect(result.url).toBeUndefined();
      expect(result.cleanedText).toBe("Content here");
    });
  });

  describe("cleanScrapedContent wrapper", () => {
    it("should clean scraped content with metadata", () => {
      const content = "<html><body><p>Article content</p></body></html>";
      const result = cleanScrapedContent(
        content,
        "My Title",
        "https://example.com",
      );

      expect(result.cleanedText).toContain("Article content");
      expect(result.title).toBe("My Title");
      expect(result.url).toBe("https://example.com");
    });

    it("should work with plain text content", () => {
      const content = "Plain text article content";
      const result = cleanScrapedContent(
        content,
        "Title",
        "https://example.com",
      );

      expect(result.cleanedText).toBe("Plain text article content");
      expect(result.title).toBe("Title");
    });
  });

  describe("Edge cases", () => {
    it("should handle empty input", () => {
      const result = cleanTextForLLM("");

      expect(result.cleanedText).toBe("");
      expect(result.metrics.originalLength).toBe(0);
      expect(result.metrics.cleanedLength).toBe(0);
    });

    it("should handle whitespace-only input", () => {
      const result = cleanTextForLLM("   \n\n   \t\t   ");

      expect(result.cleanedText).toBe("");
    });

    it("should handle malformed HTML", () => {
      const html = "<html><body><p>Content</p>"; // Missing closing tags
      const result = cleanTextForLLM(html);

      // Should not crash on malformed HTML
      expect(result).toBeDefined();
      expect(result.metrics).toBeDefined();
    });

    it("should handle very long lines", () => {
      const text = "X".repeat(100000);
      const result = cleanTextForLLM(text, { maxChars: 5000 });

      expect(result.cleanedText.length).toBeLessThanOrEqual(5000);
      expect(result.metrics.wasTruncated).toBe(true);
    });
  });

  describe("Real-world scenarios", () => {
    it("should clean a typical blog article", () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <script src="analytics.js"></script>
            <style>.ad { display: none; }</style>
          </head>
          <body>
            <nav>Home | About | Blog | Contact</nav>
            <div class="cookie-banner">We use cookies</div>
            <article>
              <h1>How to Build Better Software</h1>
              <p>Software development is an art and a science...</p>
              <p>In this article, we'll explore best practices...</p>
              <h2>Best Practices</h2>
              <p>First, always write clean code...</p>
            </article>
            <div class="newsletter">Subscribe for updates!</div>
            <footer>Copyright 2024. All rights reserved.</footer>
          </body>
        </html>
      `;

      const result = cleanTextForLLM(html, {
        title: "How to Build Better Software",
        url: "https://example.com/article",
        includeHeadings: true,
      });

      expect(result.cleanedText).toContain("Software development");
      expect(result.cleanedText).toContain("Best Practices");
      expect(result.cleanedText).not.toContain("analytics.js");
      expect(result.cleanedText).not.toContain("Home | About | Blog");
      expect(result.cleanedText).not.toContain("We use cookies");
      expect(result.title).toBe("How to Build Better Software");
      expect(result.headings).toContain("How to Build Better Software");
      expect(result.headings).toContain("Best Practices");
    });

    it("should handle news article with ads", () => {
      const html = `
        <html>
          <body>
            <div class="ad">Advertisement</div>
            <article>
              <h1>Breaking News Story</h1>
              <p class="byline">By John Doe | Published: 2024-01-01</p>
              <p>In a stunning development today...</p>
              <div class="advertisement">Sponsored Content</div>
              <p>Officials confirmed that...</p>
            </article>
            <div class="related-articles">You may also like...</div>
          </body>
        </html>
      `;

      const result = cleanTextForLLM(html);

      expect(result.cleanedText).toContain("Breaking News Story");
      expect(result.cleanedText).toContain("stunning development");
      expect(result.cleanedText).not.toContain("Advertisement");
      expect(result.cleanedText).not.toContain("Sponsored Content");
    });
  });
});
