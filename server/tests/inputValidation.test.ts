/**
 * Tests for input validation middleware
 * Ensures API endpoints properly validate incoming requests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { validateTransformUrl, validateTransformText, validateUrl, validatePersona, validateText } from '../src/middleware/input-validation';

// Mock response object
const mockResponse = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

// Mock next function
const mockNext = vi.fn() as NextFunction;

describe('Input Validation Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateUrl', () => {
    it('should accept valid HTTP URLs', () => {
      const result = validateUrl('http://example.com');
      expect(result.isValid).toBe(true);
    });

    it('should accept valid HTTPS URLs', () => {
      const result = validateUrl('https://example.com');
      expect(result.isValid).toBe(true);
    });

    it('should add https to URLs without protocol', () => {
      const result = validateUrl('example.com');
      expect(result.isValid).toBe(true);
    });

    it('should reject empty URLs', () => {
      const result = validateUrl('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('required and must be a string');
    });

    it('should reject private IP addresses', () => {
      const result = validateUrl('http://192.168.1.1');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Private or local URLs');
    });

    it('should reject localhost', () => {
      const result = validateUrl('http://localhost:3000');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Private or local URLs');
    });

    it('should reject invalid URL format', () => {
      const result = validateUrl('not-a-url');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('valid domain name');
    });
  });

  describe('validatePersona', () => {
    it('should accept valid persona IDs', () => {
      const result = validatePersona('eli5');
      expect(result.isValid).toBe(true);
    });

    it('should reject empty persona', () => {
      const result = validatePersona('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should reject non-string persona', () => {
      const result = validatePersona(123 as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must be a string');
    });
  });

  describe('validateText', () => {
    it('should accept valid text', () => {
      const result = validateText('This is valid text content');
      expect(result.isValid).toBe(true);
    });

    it('should reject empty text', () => {
      const result = validateText('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('required and must be a string');
    });

    it('should reject text that is too long', () => {
      const longText = 'a'.repeat(50001);
      const result = validateText(longText);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('cannot exceed 50,000 characters');
    });

    it('should reject non-string text', () => {
      const result = validateText(123 as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must be a string');
    });
  });

  describe('validateTransformUrl middleware', () => {
    it('should call next() for valid request', () => {
      const req = { body: { url: 'https://example.com', persona: 'eli5' } } as Request;
      const res = mockResponse();

      validateTransformUrl(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid URL', () => {
      const req = { body: { url: 'invalid-url', persona: 'eli5' } } as Request;
      const res = mockResponse();

      validateTransformUrl(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('valid domain name')
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 for missing persona', () => {
      const req = { body: { url: 'https://example.com' } } as Request;
      const res = mockResponse();

      validateTransformUrl(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('required')
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('validateTransformText middleware', () => {
    it('should call next() for valid request', () => {
      const req = { body: { text: 'Some text to transform', persona: 'eli5' } } as Request;
      const res = mockResponse();

      validateTransformText(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 400 for empty text', () => {
      const req = { body: { text: '', persona: 'eli5' } } as Request;
      const res = mockResponse();

      validateTransformText(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('required and must be a string')
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 for text that is too long', () => {
      const longText = 'a'.repeat(50001);
      const req = { body: { text: longText, persona: 'eli5' } } as Request;
      const res = mockResponse();

      validateTransformText(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('cannot exceed 50,000 characters')
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
