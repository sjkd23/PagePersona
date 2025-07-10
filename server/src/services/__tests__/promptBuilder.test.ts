import { describe, it, expect, vi } from 'vitest';
import { PromptBuilderService } from '../promptBuilder';
import type { ParsedContent } from '../parser';

// Mock the personas data
vi.mock('../../../shared/constants/personas', () => ({
  getPersona: vi.fn((id: string) => {
    const mockPersonas: { [key: string]: any } = {
      'eli5': {
        id: 'eli5',
        name: 'ELI5',
        systemPrompt: `PERSONA SPECIFIC INSTRUCTIONS:
You are super enthusiastic and encouraging.
Use simple words and avoid jargon.
Make comparisons to toys, games, or animals.
Ask playful questions to keep attention.
Always start with "Hey there! Let me tell you about this in a super simple way!".
End with something encouraging about learning.`,
        toneModifier: 'Explain like I\'m 5 years old'
      },
      'medieval-knight': {
        id: 'medieval-knight',
        name: 'Medieval Knight',
        systemPrompt: `PERSONA SPECIFIC INSTRUCTIONS:
Speak in ye olde English: "thee", "thou", "verily", "mine".
Reference knights, honor, swords, and quests.
Start with "Hark!" or "Hear ye!".
Frame knowledge as a noble quest.
End with a knightly blessing or vow.`,
        toneModifier: 'Medieval knight speaking'
      }
    };
    return mockPersonas[id] || null;
  })
}));

// Mock the base prompt
vi.mock('../../data/basePrompt', () => ({
  BASE_SYSTEM_PROMPT: `
You are an assistant that transforms webpage content into a creative, easy-to-read format.

GENERAL INSTRUCTIONS:
- Break content into 3-5 clearly marked sections with relevant headings
- Use short paragraphs (1-2 sentences max)
- Include bullet points or numbered lists where appropriate
- Add line breaks between sections for clarity
- Use a unique voice based on the assigned persona tone

You will be given a persona description and style. Adapt your language and metaphors to match their personality.`
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
      
      expect(result.systemPrompt).toContain('transforms webpage content');
      expect(result.systemPrompt).toContain('super enthusiastic and encouraging');
      expect(result.userPrompt).toContain('Quantum Physics Basics');
      expect(result.userPrompt).toContain('quantum physics and how particles');
      expect(result.userPrompt).toContain('webpage content');
      expect(result.totalLength).toBeGreaterThan(0);
      expect(result.totalLength).toBe(result.systemPrompt.length + result.userPrompt.length);
    });

    it('should build a valid transformation prompt for medieval knight persona', () => {
      const result = PromptBuilderService.buildTransformationPrompt(mockContent, 'medieval-knight');
      
      expect(result.systemPrompt).toContain('ye olde English');
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
      
      expect(result.systemPrompt).toContain('super enthusiastic and encouraging');
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
      
      expect(result.systemPrompt).toContain('transforms webpage content');
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
      
      const result = PromptBuilderService.buildTransformationPrompt(longContent, 'medieval-knight');
      
      expect(result.userPrompt).toContain('A'.repeat(100)); // Should contain part of the long content
      expect(result.totalLength).toBeGreaterThan(5000);
    });
  });

  describe('persona-specific behavior', () => {
    it('should include persona-specific instructions in system prompt', () => {
      const eli5Result = PromptBuilderService.buildTransformationPrompt(mockContent, 'eli5');
      const knightResult = PromptBuilderService.buildTransformationPrompt(mockContent, 'medieval-knight');
      
      expect(eli5Result.systemPrompt).toContain('super enthusiastic');
      expect(knightResult.systemPrompt).toContain('ye olde English');
      expect(eli5Result.systemPrompt).not.toContain('ye olde English');
      expect(knightResult.systemPrompt).not.toContain('super enthusiastic');
    });

    it('should maintain consistent base prompt across personas', () => {
      const eli5Result = PromptBuilderService.buildTransformationPrompt(mockContent, 'eli5');
      const knightResult = PromptBuilderService.buildTransformationPrompt(mockContent, 'medieval-knight');
      
      expect(eli5Result.systemPrompt).toContain('transforms webpage content');
      expect(knightResult.systemPrompt).toContain('transforms webpage content');
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
