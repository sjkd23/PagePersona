/**
 * Zod-Based Validation Middleware
 *
 * This module provides comprehensive type-safe input validation using Zod schemas
 * for API endpoints. It includes middleware factories for validating request bodies,
 * query parameters, and route parameters with detailed error reporting.
 *
 * Features:
 * - Type-safe validation with automatic TypeScript inference
 * - Detailed error formatting for client consumption
 * - Comprehensive logging for debugging and monitoring
 * - Reusable validation middleware factories
 * - Common schema definitions for consistent validation patterns
 * - Security-focused URL validation with private IP blocking
 *
 * The middleware automatically transforms and validates request data,
 * ensuring downstream handlers receive properly typed and validated inputs.
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import { HttpStatus } from '../constants/http-status';
import { logger } from '../utils/logger';

/**
 * Generic validation middleware factory for request body validation
 *
 * Creates Express middleware that validates request bodies against a Zod schema.
 * The middleware automatically transforms the data and provides detailed error
 * messages for validation failures.
 *
 * @param schema Zod schema to validate the request body against
 * @returns Express middleware function
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
          body: req.body,
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
 * Validation middleware factory for query parameter validation
 *
 * Creates Express middleware that validates query string parameters against
 * a Zod schema with automatic type transformation and error handling.
 *
 * @param schema Zod schema to validate the query parameters against
 * @returns Express middleware function
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
          query: req.query,
        });

        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: 'Invalid query parameters',
          details: formatZodError(result.error),
        });
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (req as any).query = result.data;
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
 * Validation middleware factory for route parameter validation
 *
 * Creates Express middleware that validates route parameters (e.g., :id, :username)
 * against a Zod schema with proper error handling and logging.
 *
 * @param schema Zod schema to validate the route parameters against
 * @returns Express middleware function
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
          params: req.params,
        });

        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: 'Invalid route parameters',
          details: formatZodError(result.error),
        });
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
 * Format Zod validation errors into a user-friendly structure
 *
 * Transforms Zod's nested error structure into a flat object where
 * each key represents a field path and the value is an array of error messages.
 *
 * @param error ZodError instance from failed validation
 * @returns Formatted error object with field-specific error messages
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
 *
 * This collection provides standardized validation schemas for frequently
 * used data types, ensuring consistency across the API and reducing duplication.
 */
export const commonSchemas = {
  /**
   * URL validation with security checks and automatic protocol addition
   * Blocks private/local IP addresses and ensures valid domain structure
   */
  url: z
    .string()
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

        // Block local and private IP address ranges for security
        if (
          hostname === 'localhost' ||
          hostname === '127.0.0.1' ||
          hostname.startsWith('192.168.') ||
          hostname.startsWith('10.') ||
          hostname.match(/^172\.(1[6-9]|2[0-9]|3[01])\./)
        ) {
          return false;
        }

        return hostname.length >= 3 && hostname.includes('.');
      } catch {
        return false;
      }
    }, 'Private or local URLs are not allowed'),

  /**
   * Persona identifier validation
   * Allows alphanumeric characters, hyphens, and underscores with specific formatting rules
   */
  persona: z
    .string()
    .min(1, 'Persona is required')
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-_]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/, 'Invalid persona format'),

  /**
   * Text content validation for transformation requests
   * Enforces minimum length for meaningful content and maximum for processing limits
   */
  text: z
    .string()
    .min(50, 'Text must be at least 50 characters long')
    .max(50000, 'Text cannot exceed 50,000 characters')
    .trim(),

  /** Optional style parameter for content transformation */
  style: z.string().optional(),

  /**
   * MongoDB ObjectId validation
   * Ensures 24-character hexadecimal string format
   */
  objectId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format'),

  /** Standard email address validation */
  email: z.string().email('Invalid email format'),

  /**
   * Username validation with character restrictions
   * Allows letters, numbers, underscores, and hyphens only
   */
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens',
    ),
};
