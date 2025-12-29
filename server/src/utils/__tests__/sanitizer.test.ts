/**
 * Sanitizer Utility Tests
 *
 * Comprehensive test suite for HTML sanitization functionality
 * to ensure XSS prevention and safe content rendering.
 */

import { describe, it, expect } from "vitest";
import { sanitize, sanitizeText, sanitizeUserInput } from "../sanitizer";

describe("Sanitizer Utility", () => {
  describe("sanitize()", () => {
    it("should remove script tags and content", () => {
      const maliciousContent =
        '<script>alert("XSS")</script><p>Safe content</p>';
      const result = sanitize(maliciousContent);

      expect(result).not.toContain("<script>");
      expect(result).not.toContain('alert("XSS")');
      expect(result).toContain("<p>Safe content</p>");
    });

    it("should remove inline event handlers", () => {
      const maliciousContent = "<div onclick=\"alert('XSS')\">Click me</div>";
      const result = sanitize(maliciousContent);

      expect(result).not.toContain("onclick");
      expect(result).not.toContain("alert");
      expect(result).toContain("<div>Click me</div>");
    });

    it("should allow safe HTML tags", () => {
      const safeContent =
        "<p>This is <strong>safe</strong> content with <em>emphasis</em></p>";
      const result = sanitize(safeContent);

      expect(result).toContain("<p>");
      expect(result).toContain("<strong>");
      expect(result).toContain("<em>");
      expect(result).toBe(safeContent);
    });

    it("should allow img tags with safe attributes", () => {
      const imageContent =
        '<img src="https://example.com/image.jpg" alt="Test image" title="Test">';
      const result = sanitize(imageContent);

      expect(result).toContain("<img");
      expect(result).toContain('src="https://example.com/image.jpg"');
      expect(result).toContain('alt="Test image"');
      expect(result).toContain('title="Test"');
    });

    it("should add security attributes to links", () => {
      const linkContent = '<a href="https://example.com">External link</a>';
      const result = sanitize(linkContent);

      expect(result).toContain('rel="noopener noreferrer"');
      expect(result).toContain('target="_blank"');
      expect(result).toContain('href="https://example.com"');
    });

    it("should remove dangerous URL schemes", () => {
      const maliciousLink = "<a href=\"javascript:alert('XSS')\">Click me</a>";
      const result = sanitize(maliciousLink);

      expect(result).not.toContain("javascript:");
      expect(result).toContain("<a");
      expect(result).toContain("Click me");
    });

    it("should allow data URLs for images", () => {
      const dataImage =
        '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" alt="Test">';
      const result = sanitize(dataImage);

      expect(result).toContain('src="data:image/png;base64,');
      expect(result).toContain("<img");
    });

    it("should handle empty or invalid input gracefully", () => {
      expect(sanitize("")).toBe("");
      expect(sanitize(null as any)).toBe("");
      expect(sanitize(undefined as any)).toBe("");
      expect(sanitize(123 as any)).toBe("");
    });

    it("should remove style attributes and tags", () => {
      const styledContent =
        '<div style="background: url(javascript:alert(1))">Styled content</div><style>body { background: red; }</style>';
      const result = sanitize(styledContent);

      expect(result).not.toContain("style=");
      expect(result).not.toContain("<style>");
      expect(result).not.toContain("javascript:");
      expect(result).toContain("<div>Styled content</div>");
    });

    it("should remove iframe tags", () => {
      const iframeContent =
        '<iframe src="https://malicious.com"></iframe><p>Safe content</p>';
      const result = sanitize(iframeContent);

      expect(result).not.toContain("<iframe");
      expect(result).not.toContain("malicious.com");
      expect(result).toContain("<p>Safe content</p>");
    });

    it("should handle nested malicious content", () => {
      const nestedMalicious =
        '<div><script>alert("XSS")</script><p onclick="alert(\'click\')">Content</p></div>';
      const result = sanitize(nestedMalicious);

      expect(result).not.toContain("<script>");
      expect(result).not.toContain("onclick");
      expect(result).not.toContain("alert");
      expect(result).toContain("<div><p>Content</p></div>");
    });
  });

  describe("sanitizeText()", () => {
    it("should encode HTML entities", () => {
      const textWithHtml =
        '<script>alert("XSS")</script> & "quotes" & \'apostrophes\'';
      const result = sanitizeText(textWithHtml);

      expect(result).toBe(
        "&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt; &amp; &quot;quotes&quot; &amp; &#x27;apostrophes&#x27;",
      );
    });

    it("should handle special characters", () => {
      const specialChars = "< > & \" '";
      const result = sanitizeText(specialChars);

      expect(result).toBe("&lt; &gt; &amp; &quot; &#x27;");
    });

    it("should handle empty or invalid input gracefully", () => {
      expect(sanitizeText("")).toBe("");
      expect(sanitizeText(null as any)).toBe("");
      expect(sanitizeText(undefined as any)).toBe("");
      expect(sanitizeText(123 as any)).toBe("");
    });

    it("should preserve regular text", () => {
      const regularText =
        "This is normal text with numbers 123 and symbols !@#$%^*()";
      const result = sanitizeText(regularText);

      expect(result).toBe(regularText);
    });
  });

  describe("sanitizeUserInput()", () => {
    it("should allow only basic formatting tags", () => {
      const userInput =
        "<p>This is <strong>bold</strong> and <em>italic</em> text</p>";
      const result = sanitizeUserInput(userInput);

      expect(result).toContain("<p>");
      expect(result).toContain("<strong>");
      expect(result).toContain("<em>");
    });

    it("should remove dangerous tags from user input", () => {
      const maliciousInput =
        '<script>alert("XSS")</script><p>Safe content</p><a href="javascript:alert(1)">Link</a>';
      const result = sanitizeUserInput(maliciousInput);

      expect(result).not.toContain("<script>");
      expect(result).not.toContain("<a");
      expect(result).not.toContain("javascript:");
      expect(result).toContain("<p>Safe content</p>");
    });

    it("should remove all attributes from user input", () => {
      const inputWithAttrs =
        '<p class="danger" id="test" onclick="alert(1)">Content</p>';
      const result = sanitizeUserInput(inputWithAttrs);

      expect(result).not.toContain("class=");
      expect(result).not.toContain("id=");
      expect(result).not.toContain("onclick=");
      expect(result).toContain("<p>Content</p>");
    });

    it("should handle empty or invalid input gracefully", () => {
      expect(sanitizeUserInput("")).toBe("");
      expect(sanitizeUserInput(null as any)).toBe("");
      expect(sanitizeUserInput(undefined as any)).toBe("");
      expect(sanitizeUserInput(123 as any)).toBe("");
    });

    it("should allow line breaks", () => {
      const inputWithBreaks = "<p>Line one<br>Line two</p>";
      const result = sanitizeUserInput(inputWithBreaks);

      expect(result).toMatch(/<br\s*\/?>/);
      expect(result).toContain("<p>Line one");
      expect(result).toContain("Line two</p>");
    });

    it("should strip images and links from user input", () => {
      const inputWithMedia =
        '<p>Text with <img src="image.jpg"> and <a href="link.com">link</a></p>';
      const result = sanitizeUserInput(inputWithMedia);

      expect(result).not.toContain("<img");
      expect(result).not.toContain("<a");
      expect(result).toContain("<p>Text with  and link</p>");
    });
  });

  describe("XSS Prevention Tests", () => {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src="x" onerror="alert(\'XSS\')">',
      "<svg onload=\"alert('XSS')\">",
      "<iframe src=\"javascript:alert('XSS')\"></iframe>",
      '<link rel="stylesheet" href="javascript:alert(\'XSS\')">',
      "<object data=\"javascript:alert('XSS')\"></object>",
      "<embed src=\"javascript:alert('XSS')\">",
      '<form action="javascript:alert(\'XSS\')"><input type="submit"></form>',
      "<details open ontoggle=\"alert('XSS')\">",
      "<marquee onstart=\"alert('XSS')\">",
    ];

    xssPayloads.forEach((payload, index) => {
      it(`should prevent XSS payload ${index + 1}: ${payload.substring(0, 30)}...`, () => {
        const result = sanitize(payload);

        // Should not contain any javascript: schemes
        expect(result).not.toContain("javascript:");

        // Should not contain any event handlers
        expect(result).not.toMatch(/on\w+\s*=/i);

        // Should not contain script tags
        expect(result).not.toContain("<script");

        // Should not contain dangerous tags
        expect(result).not.toContain("<iframe");
        expect(result).not.toContain("<object");
        expect(result).not.toContain("<embed");
        expect(result).not.toContain("<link");
        expect(result).not.toContain("<form");
      });
    });
  });
});
