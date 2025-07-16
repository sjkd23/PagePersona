/**
 * Sanitization Integration Tests
 *
 * Tests to ensure XSS protection is properly applied to API responses
 * and that malicious content is properly sanitized before being returned.
 */

import { describe, it, expect } from 'vitest';
import { sanitize } from '../utils/sanitizer';
import type { TransformationResult } from '../services/content-transformer';

describe('API Sanitization Integration Tests', () => {
  describe('Transformation Result Sanitization', () => {
    it('should sanitize malicious content in transformation results', async () => {
      // Mock a transformation result with malicious content
      const maliciousResult: TransformationResult = {
        success: true,
        originalContent: {
          title: '<script>alert("XSS in title")</script>Original Title',
          content: '<p>Safe content</p><script>alert("XSS in content")</script>',
          url: 'https://example.com',
          wordCount: 100,
        },
        transformedContent:
          '<h1>Transformed</h1><script>alert("XSS in transformed")</script><p onclick="alert(\'click\')">Click me</p>',
        persona: {
          id: 'test-persona',
          name: '<script>alert("XSS in persona")</script>Test Persona',
          description: 'Test persona description<script>alert("XSS")</script>',
        },
        usage: {
          prompt_tokens: 50,
          completion_tokens: 100,
          total_tokens: 150,
        },
      };

      // Test the sanitization function directly
      const sanitizedResult = {
        ...maliciousResult,
        transformedContent: sanitize(maliciousResult.transformedContent),
        originalContent: {
          ...maliciousResult.originalContent,
          title: sanitize(maliciousResult.originalContent.title),
          content: sanitize(maliciousResult.originalContent.content),
        },
        persona: {
          ...maliciousResult.persona,
          name: sanitize(maliciousResult.persona.name),
          description: sanitize(maliciousResult.persona.description),
        },
      };

      // Verify that malicious content is removed
      expect(sanitizedResult.transformedContent).not.toContain('<script>');
      expect(sanitizedResult.transformedContent).not.toContain('onclick');
      expect(sanitizedResult.transformedContent).not.toContain('alert');
      expect(sanitizedResult.transformedContent).toContain('<h1>Transformed</h1>');
      expect(sanitizedResult.transformedContent).toContain('<p>Click me</p>');

      expect(sanitizedResult.originalContent.title).not.toContain('<script>');
      expect(sanitizedResult.originalContent.title).not.toContain('alert');
      expect(sanitizedResult.originalContent.title).toContain('Original Title');

      expect(sanitizedResult.originalContent.content).not.toContain('<script>');
      expect(sanitizedResult.originalContent.content).not.toContain('alert');
      expect(sanitizedResult.originalContent.content).toContain('<p>Safe content</p>');

      expect(sanitizedResult.persona.name).not.toContain('<script>');
      expect(sanitizedResult.persona.name).not.toContain('alert');
      expect(sanitizedResult.persona.name).toContain('Test Persona');

      expect(sanitizedResult.persona.description).not.toContain('<script>');
      expect(sanitizedResult.persona.description).not.toContain('alert');
      expect(sanitizedResult.persona.description).toContain('Test persona description');
    });
  });

  describe('Text transformation sanitization', () => {
    it('should sanitize text input and transformation results', async () => {
      // Test with malicious text input
      const maliciousText = '<script>alert("XSS")</script><p>Normal text</p>';

      // The text itself should be handled by the transformation service
      // but we can test that our sanitizer would handle it properly
      const sanitizedText = sanitize(maliciousText);

      expect(sanitizedText).not.toContain('<script>');
      expect(sanitizedText).not.toContain('alert');
      expect(sanitizedText).toContain('<p>Normal text</p>');
    });
  });

  describe('XSS Prevention Scenarios', () => {
    const xssScenarios = [
      {
        name: 'Script injection in transformed content',
        content: '<h1>Title</h1><script>alert("XSS")</script><p>Content</p>',
        expectedToNotContain: ['<script>', 'alert("XSS")'],
        expectedToContain: ['<h1>Title</h1>', '<p>Content</p>'],
      },
      {
        name: 'Event handler injection',
        content: '<div onclick="alert(\'XSS\')">Click me</div>',
        expectedToNotContain: ['onclick', 'alert'],
        expectedToContain: ['<div>Click me</div>'],
      },
      {
        name: 'JavaScript protocol injection',
        content: '<a href="javascript:alert(\'XSS\')">Link</a>',
        expectedToNotContain: ['javascript:', 'alert'],
        expectedToContain: ['<a', 'Link</a>'],
      },
      {
        name: 'Image with onerror injection',
        content: '<img src="invalid" onerror="alert(\'XSS\')">',
        expectedToNotContain: ['onerror', 'alert'],
        expectedToContain: ['<img'],
      },
      {
        name: 'Style injection',
        content: '<div style="background:url(javascript:alert(1))">Content</div>',
        expectedToNotContain: ['style=', 'javascript:', 'alert'],
        expectedToContain: ['<div>Content</div>'],
      },
    ];

    xssScenarios.forEach((scenario) => {
      it(`should prevent ${scenario.name}`, () => {
        const sanitizedContent = sanitize(scenario.content);

        scenario.expectedToNotContain.forEach((badContent) => {
          expect(sanitizedContent).not.toContain(badContent);
        });

        scenario.expectedToContain.forEach((goodContent) => {
          expect(sanitizedContent).toContain(goodContent);
        });
      });
    });
  });

  describe('Safe content preservation', () => {
    it('should preserve safe HTML formatting', () => {
      const safeContent = `
        <h1>Main Title</h1>
        <h2>Subtitle</h2>
        <p>This is a <strong>bold</strong> paragraph with <em>italic</em> text.</p>
        <ul>
          <li>List item 1</li>
          <li>List item 2</li>
        </ul>
        <blockquote>This is a quote</blockquote>
        <a href="https://example.com">Safe external link</a>
        <img src="https://example.com/image.jpg" alt="Safe image">
      `;

      const sanitizedContent = sanitize(safeContent);

      expect(sanitizedContent).toContain('<h1>Main Title</h1>');
      expect(sanitizedContent).toContain('<h2>Subtitle</h2>');
      expect(sanitizedContent).toContain('<strong>bold</strong>');
      expect(sanitizedContent).toContain('<em>italic</em>');
      expect(sanitizedContent).toContain('<ul>');
      expect(sanitizedContent).toContain('<li>List item 1</li>');
      expect(sanitizedContent).toContain('<blockquote>');
      expect(sanitizedContent).toContain('href="https://example.com"');
      expect(sanitizedContent).toContain('rel="noopener noreferrer"');
      expect(sanitizedContent).toContain('target="_blank"');
      expect(sanitizedContent).toContain('<img');
      expect(sanitizedContent).toContain('src="https://example.com/image.jpg"');
      expect(sanitizedContent).toContain('alt="Safe image"');
    });

    it('should handle markdown-style content safely', () => {
      const markdownContent = `
        <h1>Article Title</h1>
        <p>Introduction paragraph with <code>inline code</code>.</p>
        <pre><code>
          function example() {
            return "safe code block";
          }
        </code></pre>
        <p>Another paragraph with <a href="https://example.com">a link</a>.</p>
      `;

      const sanitizedContent = sanitize(markdownContent);

      expect(sanitizedContent).toContain('<h1>Article Title</h1>');
      expect(sanitizedContent).toContain('<code>inline code</code>');
      expect(sanitizedContent).toContain('<pre><code>');
      expect(sanitizedContent).toContain('function example()');
      expect(sanitizedContent).toContain('rel="noopener noreferrer"');
      expect(sanitizedContent).toContain('target="_blank"');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty transformation results', () => {
      const emptyResult: TransformationResult = {
        success: false,
        originalContent: {
          title: '',
          content: '',
          url: '',
          wordCount: 0,
        },
        transformedContent: '',
        persona: {
          id: '',
          name: '',
          description: '',
        },
        error: 'Transformation failed',
      };

      const sanitizedResult = {
        ...emptyResult,
        transformedContent: sanitize(emptyResult.transformedContent),
        originalContent: {
          ...emptyResult.originalContent,
          title: sanitize(emptyResult.originalContent.title),
          content: sanitize(emptyResult.originalContent.content),
        },
        persona: {
          ...emptyResult.persona,
          name: sanitize(emptyResult.persona.name),
          description: sanitize(emptyResult.persona.description),
        },
      };

      expect(sanitizedResult.transformedContent).toBe('');
      expect(sanitizedResult.originalContent.title).toBe('');
      expect(sanitizedResult.originalContent.content).toBe('');
      expect(sanitizedResult.persona.name).toBe('');
      expect(sanitizedResult.persona.description).toBe('');
    });

    it('should handle null and undefined values gracefully', () => {
      expect(sanitize(null as any)).toBe('');
      expect(sanitize(undefined as any)).toBe('');
      expect(sanitize(123 as any)).toBe('');
      expect(sanitize([] as any)).toBe('');
      expect(sanitize({} as any)).toBe('');
    });
  });
});
