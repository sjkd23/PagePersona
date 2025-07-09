/**
 * Input validation middleware for API routes
 * Provides consistent validation for common input types
 */

import { Request, Response, NextFunction } from 'express';
import { sendValidationError } from '../utils/response-helpers';

/**
 * Validate URL format and basic security checks
 */
export function validateUrl(url: string): { isValid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL is required and must be a string' };
  }

  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    return { isValid: false, error: 'URL cannot be empty' };
  }

  // Check if URL starts with http/https or if we can add https
  let testUrl = trimmedUrl;
  if (!testUrl.startsWith('http://') && !testUrl.startsWith('https://')) {
    testUrl = `https://${testUrl}`;
  }

  try {
    const parsedUrl = new URL(testUrl);
    
    // Basic security checks (similar to webScraper but lighter)
    const hostname = parsedUrl.hostname;
    
    // Block obvious local/private URLs
    if (hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.match(/^172\.(1[6-9]|2[0-9]|3[01])\./)) {
      return { isValid: false, error: 'Private or local URLs are not allowed' };
    }

    // Must have a valid domain
    if (!hostname || hostname.length < 3 || !hostname.includes('.')) {
      return { isValid: false, error: 'Please provide a valid domain name' };
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'Invalid URL format. Please provide a valid website URL.' };
  }
}

/**
 * Validate persona ID
 */
export function validatePersona(persona: string): { isValid: boolean; error?: string } {
  if (!persona || typeof persona !== 'string') {
    return { isValid: false, error: 'Persona is required and must be a string' };
  }

  const trimmedPersona = persona.trim();
  if (!trimmedPersona) {
    return { isValid: false, error: 'Persona cannot be empty' };
  }

  // Basic persona ID format check (alphanumeric with hyphens)
  if (!/^[a-zA-Z0-9][a-zA-Z0-9-_]*[a-zA-Z0-9]$/.test(trimmedPersona) && trimmedPersona.length > 1) {
    return { isValid: false, error: 'Invalid persona format' };
  }

  return { isValid: true };
}

/**
 * Validate text input for transformation
 */
export function validateText(text: string): { isValid: boolean; error?: string } {
  if (!text || typeof text !== 'string') {
    return { isValid: false, error: 'Text is required and must be a string' };
  }

  const trimmedText = text.trim();
  if (!trimmedText) {
    return { isValid: false, error: 'Text cannot be empty' };
  }

  // Check reasonable length limits
  if (trimmedText.length < 50) {
    return { isValid: false, error: 'Text must be at least 50 characters long' };
  }

  if (trimmedText.length > 50000) {
    return { isValid: false, error: 'Text cannot exceed 50,000 characters' };
  }

  return { isValid: true };
}

/**
 * Express middleware for transform URL endpoint validation
 */
export function validateTransformUrl(req: Request, res: Response, next: NextFunction): void {
  const { url, persona } = req.body;

  // Validate URL
  const urlValidation = validateUrl(url);
  if (!urlValidation.isValid) {
    sendValidationError(res, urlValidation.error!);
    return;
  }

  // Validate persona
  const personaValidation = validatePersona(persona);
  if (!personaValidation.isValid) {
    sendValidationError(res, personaValidation.error!);
    return;
  }

  next();
}

/**
 * Express middleware for transform text endpoint validation
 */
export function validateTransformText(req: Request, res: Response, next: NextFunction): void {
  const { text, persona } = req.body;

  // Validate text
  const textValidation = validateText(text);
  if (!textValidation.isValid) {
    sendValidationError(res, textValidation.error!);
    return;
  }

  // Validate persona
  const personaValidation = validatePersona(persona);
  if (!personaValidation.isValid) {
    sendValidationError(res, personaValidation.error!);
    return;
  }

  next();
}

/**
 * General request body validation middleware
 */
export function validateRequestBody(req: Request, res: Response, next: NextFunction): void {
  // Check if body exists for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && (!req.body || Object.keys(req.body).length === 0)) {
    sendValidationError(res, 'Request body is required');
    return;
  }

  // Check for oversized payloads
  const bodyString = JSON.stringify(req.body || {});
  if (bodyString.length > 100000) { // 100KB limit
    sendValidationError(res, 'Request payload too large');
    return;
  }

  next();
}
