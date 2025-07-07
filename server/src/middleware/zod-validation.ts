/**
 * 🛡️ Zod-based validation middleware for API endpoints
 * Provides type-safe input validation using Zod schemas
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import { HttpStatus } from '../constants/http-status';
import { logger } from '../utils/logger';

/**
 * Generic validation middleware factory that validates request body against a Zod schema
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        logger.validation.warn('Request validation failed', {
          path: req.path,
          method: req.method,
          errors: result.error.format(),
          body: req.body
        });

        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: 'Invalid input',
          details: formatZodError(result.error),
        });
        return;
      }

      // Replace request body with validated and transformed data
      req.body = result.data;
      next();
    } catch (error) {
      logger.validation.error('Validation middleware error', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Validation error occurred',
      });
    }
  };
}

/**
 * Validate query parameters against a Zod schema
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.query);
      
      if (!result.success) {
        logger.validation.warn('Query validation failed', {
          path: req.path,
          method: req.method,
          errors: result.error.format(),
          query: req.query
        });

        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: 'Invalid query parameters',
          details: formatZodError(result.error),
        });
        return;
      }

      req.query = result.data as any;
      next();
    } catch (error) {
      logger.validation.error('Query validation middleware error', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Validation error occurred',
      });
    }
  };
}

/**
 * Validate route parameters against a Zod schema
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.params);
      
      if (!result.success) {
        logger.validation.warn('Params validation failed', {
          path: req.path,
          method: req.method,
          errors: result.error.format(),
          params: req.params
        });

        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: 'Invalid route parameters',
          details: formatZodError(result.error),
        });
        return;
      }

      req.params = result.data as any;
      next();
    } catch (error) {
      logger.validation.error('Params validation middleware error', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Validation error occurred',
      });
    }
  };
}

/**
 * Format Zod error into a more user-friendly structure
 */
function formatZodError(error: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  
  error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    const key = path || 'root';
    
    if (!formatted[key]) {
      formatted[key] = [];
    }
    
    formatted[key].push(issue.message);
  });
  
  return formatted;
}

/**
 * Common validation schemas for reuse across the application
 */
export const commonSchemas = {
  // URL validation with security checks
  url: z.string()
    .min(1, 'URL is required')
    .transform((url) => {
      // Add https if no protocol is provided
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `https://${url}`;
      }
      return url;
    })
    .pipe(z.string().url('Invalid URL format'))
    .refine((url) => {
      try {
        const parsedUrl = new URL(url);
        const hostname = parsedUrl.hostname;
        
        // Block local/private URLs
        if (hostname === 'localhost' || 
            hostname === '127.0.0.1' || 
            hostname.startsWith('192.168.') ||
            hostname.startsWith('10.') ||
            hostname.match(/^172\.(1[6-9]|2[0-9]|3[01])\./)) {
          return false;
        }
        
        return hostname.length >= 3 && hostname.includes('.');
      } catch {
        return false;
      }
    }, 'Private or local URLs are not allowed'),

  // Persona ID validation
  persona: z.string()
    .min(1, 'Persona is required')
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-_]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/, 'Invalid persona format'),

  // Text content validation
  text: z.string()
    .min(10, 'Text must be at least 10 characters long')
    .max(50000, 'Text cannot exceed 50,000 characters')
    .trim(),

  // Optional style parameter
  style: z.string().optional(),

  // MongoDB ObjectId validation
  objectId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format'),

  // Email validation
  email: z.string()
    .email('Invalid email format'),

  // Username validation
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
};
