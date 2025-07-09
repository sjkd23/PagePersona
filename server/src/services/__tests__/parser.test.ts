import { describe, it, expect } from 'vitest';
import { ParserService } from '../parser';

describe('ParserService', () => {
  describe('parseWebContent', () => {
    it('should parse valid web content successfully', () => {
      const title = 'Test Article Title';
      const content = 'This is a test article with enough content to meet the minimum requirements. '.repeat(5);
      
      const result = ParserService.parseWebContent(title, content);
      
      expect(result.title).toBe(title);
      expect(result.cleanedText).toContain('This is a test article');
      expect(result.wordCount).toBeGreaterThan(0);
      expect(result.summary).toBeDefined();
    });

    it('should throw error for content that is too short', () => {
      const title = 'Short Title';
      const content = 'Too short';
      
      expect(() => ParserService.parseWebContent(title, content))
        .toThrow('Content too short to process');
    });

    it('should truncate content that is too long', () => {
      const title = 'Long Content Title';
      const content = 'A'.repeat(10000); // Content longer than MAX_CONTENT_LENGTH
      
      const result = ParserService.parseWebContent(title, content);
      
      expect(result.cleanedText.length).toBeLessThanOrEqual(8003); // 8000 + '...'
      expect(result.cleanedText.endsWith('...')).toBe(true);
    });

    it('should clean HTML entities and normalize whitespace', () => {
      const title = 'Test &amp; Title';
      const content = `
        This   is    content   with
        
        multiple    spaces    and    &nbsp;   entities.
      `.repeat(3);
      
      const result = ParserService.parseWebContent(title, content);
      
      expect(result.title).toBe('Test & Title');
      expect(result.cleanedText).not.toContain('&nbsp;');
      expect(result.cleanedText).not.toMatch(/\s{2,}/); // No multiple spaces
    });

    it('should handle empty title gracefully', () => {
      const title = '';
      const content = 'This is sufficient content for the parser to work with. '.repeat(3);
      
      const result = ParserService.parseWebContent(title, content);
      
      expect(result.title).toBe('');
      expect(result.cleanedText).toContain('sufficient content');
    });
  });

  describe('parseDirectText', () => {
    it('should parse direct text input successfully', () => {
      const text = 'This is direct text input that meets the minimum length requirements. '.repeat(3);
      
      const result = ParserService.parseDirectText(text);
      
      expect(result.title).toBe('Direct Text Input');
      expect(result.cleanedText).toContain('direct text input');
      expect(result.wordCount).toBeGreaterThan(0);
    });

    it('should throw error for text that is too short', () => {
      const text = 'Short';
      
      expect(() => ParserService.parseDirectText(text))
        .toThrow('Text too short to process');
    });

    it('should handle special characters and formatting', () => {
      const text = `
        This is text with:
        • Bullet points
        ◦ Sub-bullets
        — Em dashes
        … Ellipses
        And "smart quotes" and 'apostrophes'
      `.repeat(5);
      
      const result = ParserService.parseDirectText(text);
      
      expect(result.cleanedText).toContain('Bullet points');
      expect(result.cleanedText).toContain('smart quotes');
      expect(result.wordCount).toBeGreaterThan(10);
    });
  });

  describe('word counting', () => {
    it('should count words accurately', () => {
      const content = 'This has exactly five words.';
      const result = ParserService.parseDirectText(content.repeat(20)); // Make it long enough
      
      // The repeated content should have 5 * 20 = 100 words, but due to cleaning it may be less
      expect(result.wordCount).toBe(81);
    });

    it('should handle punctuation in word counting', () => {
      const content = `
        Words with punctuation: don't, can't, won't, it's.
        Hyphenated-words and compound-terms should count correctly.
        Numbers like 123 and symbols like @ # $ % should be handled.
      `.repeat(5);
      
      const result = ParserService.parseDirectText(content);
      
      expect(result.wordCount).toBeGreaterThan(0);
    });
  });

  describe('content cleaning', () => {
    it('should remove excessive whitespace', () => {
      const content = `
        This    has     lots      of       spaces.
        
        
        And   multiple   line   breaks.
      `.repeat(5);
      
      const result = ParserService.parseDirectText(content);
      
      expect(result.cleanedText).not.toMatch(/\s{2,}/);
      expect(result.cleanedText).not.toMatch(/\n{3,}/);
    });

    it('should handle various Unicode characters', () => {
      const content = `
        Content with émojis 🚀 and ñón-ÂSCII çhåracters.
        Also Greek: α β γ and Arabic: العربية
        And mathematical symbols: ∑ ∆ ∏ ∞
      `.repeat(3);
      
      const result = ParserService.parseDirectText(content);
      
      expect(result.cleanedText).toContain('émojis');
      expect(result.cleanedText).toContain('çhåracters');
    });
  });

  describe('edge cases', () => {
    it('should handle content with only whitespace', () => {
      const content = '   \n\n\t\t   \r\n   ';
      
      expect(() => ParserService.parseDirectText(content))
        .toThrow('Text too short to process');
    });

    it('should handle content at exactly minimum length', () => {
      const content = 'A'.repeat(50); // Exactly at minimum
      
      const result = ParserService.parseDirectText(content);
      
      expect(result.cleanedText).toBe(content);
      expect(result.wordCount).toBe(1);
    });

    it('should handle content at exactly maximum length', () => {
      const content = 'A '.repeat(4000); // Exactly 8000 characters
      
      const result = ParserService.parseDirectText(content);
      
      expect(result.cleanedText.length).toBeLessThanOrEqual(8000);
    });
  });
});
