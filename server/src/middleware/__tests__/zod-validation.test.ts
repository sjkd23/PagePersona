/**
 * 🛡️ Unit tests for Zod validation middleware and schemas
 * Tests input validation for key API endpoints
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { transformSchemas, userSchemas, chatSchemas, authSchemas } from '../validation-schemas';

describe('Zod Validation Schemas', () => {
  describe('Transform URL Schema', () => {
    it('should pass validation for valid transform URL request', () => {
      const validData = {
        url: 'https://example.com',
        persona: 'professional',
        style: 'formal',
      };

      const result = transformSchemas.transformUrl.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid URL format', () => {
      const invalidData = {
        url: 'not a valid url at all!@#',
        persona: 'professional',
      };

      const result = transformSchemas.transformUrl.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['url'],
              message: expect.stringContaining('Invalid URL format')
            })
          ])
        );
      }
    });

    it('should reject local/private URLs', () => {
      const invalidData = {
        url: 'http://localhost:3000',
        persona: 'professional',
      };

      const result = transformSchemas.transformUrl.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['url'],
              message: 'Private or local URLs are not allowed'
            })
          ])
        );
      }
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        url: 'https://example.com',
        // Missing persona
      };

      const result = transformSchemas.transformUrl.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['persona']
            })
          ])
        );
      }
    });

    it('should accept optional style parameter', () => {
      const validData = {
        url: 'https://example.com',
        persona: 'professional',
      };

      const result = transformSchemas.transformUrl.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('Transform Text Schema', () => {
    it('should pass validation for valid transform text request', () => {
      const validData = {
        text: 'This is a valid text that is longer than 50 characters and meets the minimum requirements for processing.',
        persona: 'professional',
      };

      const result = transformSchemas.transformText.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject text that is too short', () => {
      const invalidData = {
        text: 'Too short text',
        persona: 'professional',
      };

      const result = transformSchemas.transformText.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['text'],
              message: 'Text must be at least 50 characters long'
            })
          ])
        );
      }
    });

    it('should reject text that is too long', () => {
      const longText = 'a'.repeat(50001);
      const invalidData = {
        text: longText,
        persona: 'professional',
      };

      const result = transformSchemas.transformText.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['text'],
              message: 'Text cannot exceed 50,000 characters'
            })
          ])
        );
      }
    });

    it('should trim whitespace from text', () => {
      const dataWithWhitespace = {
        text: '  This is valid text with whitespace that meets the minimum character requirement for processing  ',
        persona: 'professional',
      };

      const result = transformSchemas.transformText.safeParse(dataWithWhitespace);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.text).toBe('This is valid text with whitespace that meets the minimum character requirement for processing');
      }
    });
  });

  describe('User Profile Update Schema', () => {
    it('should pass validation for valid profile update', () => {
      const validData = {
        displayName: 'John Doe',
        bio: 'Software developer',
        preferences: {
          theme: 'dark' as const,
          notifications: true,
        },
      };

      const result = userSchemas.updateProfile.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty update object', () => {
      const invalidData = {};

      const result = userSchemas.updateProfile.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'At least one field must be provided for update'
            })
          ])
        );
      }
    });

    it('should reject bio that is too long', () => {
      const longBio = 'a'.repeat(501);
      const invalidData = {
        bio: longBio,
      };

      const result = userSchemas.updateProfile.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['bio'],
              message: 'Bio cannot exceed 500 characters'
            })
          ])
        );
      }
    });

    it('should validate theme enum values', () => {
      const invalidData = {
        preferences: {
          theme: 'invalid-theme'
        }
      };

      const result = userSchemas.updateProfile.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['preferences', 'theme']
            })
          ])
        );
      }
    });
  });

  describe('Chat Message Schema', () => {
    it('should pass validation for valid chat message', () => {
      const validData = {
        message: 'Hello, how are you today?',
        model: 'gpt-3.5-turbo' as const,
        temperature: 0.7,
      };

      const result = chatSchemas.chatMessage.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject message that is too long', () => {
      const longMessage = 'a'.repeat(4001);
      const invalidData = {
        message: longMessage,
      };

      const result = chatSchemas.chatMessage.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['message'],
              message: 'Message cannot exceed 4000 characters'
            })
          ])
        );
      }
    });

    it('should reject invalid model', () => {
      const invalidData = {
        message: 'Hello there!',
        model: 'invalid-model',
      };

      const result = chatSchemas.chatMessage.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['model']
            })
          ])
        );
      }
    });

    it('should reject temperature out of range', () => {
      const invalidData = {
        message: 'Hello there!',
        temperature: 3.0, // Out of range (0-2)
      };

      const result = chatSchemas.chatMessage.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['temperature']
            })
          ])
        );
      }
    });

    it('should allow optional parameters', () => {
      const validData = {
        message: 'Hello there!',
      };

      const result = chatSchemas.chatMessage.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('Authentication Schema', () => {
    it('should pass validation for valid registration', () => {
      const validData = {
        email: 'test@example.com',
        username: 'testuser123',
        password: 'SecurePass123',
        displayName: 'Test User',
      };

      const result = authSchemas.register.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'not-an-email',
        username: 'testuser123',
        password: 'SecurePass123',
        displayName: 'Test User',
      };

      const result = authSchemas.register.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['email'],
              message: 'Invalid email format'
            })
          ])
        );
      }
    });

    it('should reject weak password', () => {
      const invalidData = {
        email: 'test@example.com',
        username: 'testuser123',
        password: 'weak', // Too short and no uppercase/numbers
        displayName: 'Test User',
      };

      const result = authSchemas.register.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordIssues = result.error.issues.filter(issue => issue.path.includes('password'));
        expect(passwordIssues.length).toBeGreaterThan(0);
      }
    });

    it('should reject invalid username format', () => {
      const invalidData = {
        email: 'test@example.com',
        username: 'invalid username!', // Contains invalid characters
        password: 'SecurePass123',
        displayName: 'Test User',
      };

      const result = authSchemas.register.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['username']
            })
          ])
        );
      }
    });

    it('should validate login schema', () => {
      const validData = {
        email: 'test@example.com',
        password: 'any-password',
      };

      const result = authSchemas.login.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('URL Validation Edge Cases', () => {
    it('should handle URLs without protocol', () => {
      const data = {
        url: 'example.com',
        persona: 'professional',
      };

      const result = transformSchemas.transformUrl.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject URLs with invalid domains', () => {
      const data = {
        url: 'https://invalid',
        persona: 'professional',
      };

      const result = transformSchemas.transformUrl.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject private IP ranges', () => {
      const privateUrls = [
        'http://192.168.1.1',
        'http://10.0.0.1',
        'http://172.16.0.1',
      ];

      privateUrls.forEach(url => {
        const data = { url, persona: 'professional' };
        const result = transformSchemas.transformUrl.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                message: 'Private or local URLs are not allowed'
              })
            ])
          );
        }
      });
    });
  });

  describe('Persona Validation', () => {
    it('should accept valid persona formats', () => {
      const validPersonas = ['professional', 'casual', 'academic', 'tech-expert', 'a'];
      
      validPersonas.forEach(persona => {
        const data = { url: 'https://example.com', persona };
        const result = transformSchemas.transformUrl.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid persona formats', () => {
      const invalidPersonas = ['', 'invalid!persona', '-invalid', 'invalid-', '  '];
      
      invalidPersonas.forEach(persona => {
        const data = { url: 'https://example.com', persona };
        const result = transformSchemas.transformUrl.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });
});
