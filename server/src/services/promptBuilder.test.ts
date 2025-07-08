import { describe, it, expect, vi } from 'vitest';
import { PromptBuilderService } from './promptBuilder';
import type { ParsedContent } from './parser';

// Mock the personas data
vi.mock('../data/personas', () => ({
  getPersona: vi.fn((id: string) => {
    const mockPersonas: { [key: string]: any } = {
      'eli5': {
        id: 'eli5',
        name: 'ELI5',
        systemPrompt: 'Explain everything like I\'m 5 years old. Use simple words and fun examples.',
        prompt: 'Make this super easy to understand!'
      },
      'scientist': {
        id: 'scientist',
        name: 'Scientist',
        systemPrompt: 'Provide detailed, analytical explanations with scientific rigor.',
        prompt: 'Analyze this content scientifically.'
      }
    };
    return mockPersonas[id] || null;
  })
}));

// Mock the base prompt
vi.mock('../data/basePrompt', () => ({
  BASE_SYSTEM_PROMPT: 'You are a helpful assistant that transforms content according to specific personas.'
}));

describe('PromptBuilderService', () => {
  const mockContent: ParsedContent = {
    cleanedText: 'This is a sample content about quantum physics and how particles behave.',
    title: 'Quantum Physics Basics',
    wordCount: 12,
    summary: 'An introduction to quantum physics concepts.'
  };

  describe('buildTransformationPrompt', () => {
    it('should build a valid transformation prompt for ELI5 persona', () => {
      const result = PromptBuilderService.buildTransformationPrompt(mockContent, 'eli5');
      
      expect(result.systemPrompt).toContain('helpful assistant');
      expect(result.systemPrompt).toContain('like I\'m 5 years old');
      expect(result.userPrompt).toContain('Quantum Physics Basics');
      expect(result.userPrompt).toContain('quantum physics and how particles');
      expect(result.userPrompt).toContain('webpage content');
      expect(result.totalLength).toBeGreaterThan(0);
      expect(result.totalLength).toBe(result.systemPrompt.length + result.userPrompt.length);
    });

    it('should build a valid transformation prompt for scientist persona', () => {
      const result = PromptBuilderService.buildTransformationPrompt(mockContent, 'scientist');
      
      expect(result.systemPrompt).toContain('scientific rigor');
      expect(result.userPrompt).toContain('quantum physics');
      expect(result.totalLength).toBeGreaterThan(0);
    });

    it('should throw error for unknown persona', () => {
      expect(() => PromptBuilderService.buildTransformationPrompt(mockContent, 'unknown-persona'))
        .toThrow('Unknown persona: unknown-persona');
    });

    it('should include content title in the user prompt', () => {
      const result = PromptBuilderService.buildTransformationPrompt(mockContent, 'eli5');
      
      expect(result.userPrompt).toContain('Quantum Physics Basics');
    });

    it('should include content text in the user prompt', () => {
      const result = PromptBuilderService.buildTransformationPrompt(mockContent, 'eli5');
      
      expect(result.userPrompt).toContain('quantum physics and how particles behave');
    });
  });

  describe('buildTextTransformationPrompt', () => {
    it('should build a valid text transformation prompt', () => {
      const result = PromptBuilderService.buildTextTransformationPrompt(mockContent, 'eli5');
      
      expect(result.systemPrompt).toContain('like I\'m 5 years old');
      expect(result.userPrompt).toContain('text content');
      expect(result.userPrompt).not.toContain('webpage content');
      expect(result.totalLength).toBeGreaterThan(0);
    });

    it('should differentiate between webpage and text content prompts', () => {
      const webpagePrompt = PromptBuilderService.buildTransformationPrompt(mockContent, 'eli5');
      const textPrompt = PromptBuilderService.buildTextTransformationPrompt(mockContent, 'eli5');
      
      expect(webpagePrompt.userPrompt).toContain('webpage content');
      expect(textPrompt.userPrompt).toContain('text content');
      expect(webpagePrompt.systemPrompt).toBe(textPrompt.systemPrompt);
    });

    it('should throw error for unknown persona in text transformation', () => {
      expect(() => PromptBuilderService.buildTextTransformationPrompt(mockContent, 'invalid'))
        .toThrow('Unknown persona: invalid');
    });
  });

  describe('prompt structure validation', () => {
    it('should create prompts with reasonable length', () => {
      const result = PromptBuilderService.buildTransformationPrompt(mockContent, 'eli5');
      
      expect(result.systemPrompt.length).toBeGreaterThan(50);
      expect(result.userPrompt.length).toBeGreaterThan(50);
      expect(result.totalLength).toBeLessThan(10000); // Reasonable upper limit
    });

    it('should handle empty content gracefully', () => {
      const emptyContent: ParsedContent = {
        cleanedText: '',
        title: '',
        wordCount: 0
      };
      
      const result = PromptBuilderService.buildTransformationPrompt(emptyContent, 'eli5');
      
      expect(result.systemPrompt).toContain('helpful assistant');
      expect(result.userPrompt).toBeDefined();
      expect(result.totalLength).toBeGreaterThan(0);
    });

    it('should handle very long content', () => {
      const longContent: ParsedContent = {
        cleanedText: 'A'.repeat(5000),
        title: 'Very Long Title',
        wordCount: 5000,
        summary: 'A very long piece of content'
      };
      
      const result = PromptBuilderService.buildTransformationPrompt(longContent, 'scientist');
      
      expect(result.userPrompt).toContain('A'.repeat(100)); // Should contain part of the long content
      expect(result.totalLength).toBeGreaterThan(5000);
    });
  });

  describe('persona-specific behavior', () => {
    it('should include persona-specific instructions in system prompt', () => {
      const eli5Result = PromptBuilderService.buildTransformationPrompt(mockContent, 'eli5');
      const scientistResult = PromptBuilderService.buildTransformationPrompt(mockContent, 'scientist');
      
      expect(eli5Result.systemPrompt).toContain('simple words');
      expect(scientistResult.systemPrompt).toContain('scientific rigor');
      expect(eli5Result.systemPrompt).not.toContain('scientific rigor');
      expect(scientistResult.systemPrompt).not.toContain('simple words');
    });

    it('should maintain consistent base prompt across personas', () => {
      const eli5Result = PromptBuilderService.buildTransformationPrompt(mockContent, 'eli5');
      const scientistResult = PromptBuilderService.buildTransformationPrompt(mockContent, 'scientist');
      
      expect(eli5Result.systemPrompt).toContain('helpful assistant');
      expect(scientistResult.systemPrompt).toContain('helpful assistant');
    });
  });

  describe('error handling', () => {
    it('should handle null persona gracefully', () => {
      expect(() => PromptBuilderService.buildTransformationPrompt(mockContent, 'null-persona'))
        .toThrow('Unknown persona: null-persona');
    });

    it('should handle undefined content fields', () => {
      const partialContent: ParsedContent = {
        cleanedText: 'Some content',
        title: 'Title',
        wordCount: 2
        // summary is optional and undefined
      };
      
      const result = PromptBuilderService.buildTransformationPrompt(partialContent, 'eli5');
      
      expect(result).toBeDefined();
      expect(result.systemPrompt).toBeDefined();
      expect(result.userPrompt).toBeDefined();
    });
  });
});
