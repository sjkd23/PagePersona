/**
 * API Validation Schemas
 *
 * This module defines comprehensive Zod validation schemas for all API endpoints
 * in the PagePersonAI application. It provides type-safe request validation with
 * detailed error messages and business rule enforcement.
 *
 * Schema Categories:
 * - Transform endpoints (URL and text transformation)
 * - User management endpoints (profile updates, queries)
 * - Chat/GPT endpoints (AI conversation handling)
 * - Authentication endpoints (login, registration, password management)
 * - Common route parameters (IDs, usernames)
 * - Query parameters (pagination, search, date ranges)
 *
 * All schemas use consistent validation patterns and error messages
 * to provide a uniform API experience.
 */

import { z } from 'zod';
import { commonSchemas } from './zod-validation';

/**
 * Validation schemas for content transformation endpoints
 *
 * These schemas validate requests to transform web content and text
 * using different personas and styling options.
 */
export const transformSchemas = {
  /** Schema for URL-based content transformation requests */
  transformUrl: z.object({
    url: commonSchemas.url,
    persona: commonSchemas.persona,
    style: commonSchemas.style,
  }),

  /** Schema for direct text transformation requests */
  transformText: z.object({
    text: commonSchemas.text,
    persona: commonSchemas.persona,
    style: commonSchemas.style,
  }),
};

/**
 * Validation schemas for user management endpoints
 *
 * These schemas handle user profile operations, updates, and queries
 * with comprehensive field validation and business rules.
 */
export const userSchemas = {
  /** Schema for user profile update requests */
  updateProfile: z
    .object({
      firstName: z.string().max(50, 'First name cannot exceed 50 characters').optional(),
      lastName: z.string().max(50, 'Last name cannot exceed 50 characters').optional(),
      displayName: z
        .string()
        .min(1, 'Display name is required')
        .max(100, 'Display name cannot exceed 100 characters')
        .optional(),
      bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional(),
      preferences: z
        .object({
          theme: z.enum(['light', 'dark', 'auto']).optional(),
          language: z.string().min(2).max(5).optional(),
          notifications: z.boolean().optional(),
        })
        .optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    }),

  /** Schema for user profile query parameters */
  profileQuery: z.object({
    include: z.enum(['stats', 'preferences', 'history']).optional(),
  }),
};

/**
 * Validation schemas for chat and AI interaction endpoints
 *
 * These schemas validate requests to AI chat services with proper
 * message formatting, context handling, and model configuration.
 */
export const chatSchemas = {
  /** Schema for chat message requests to AI models */
  chatMessage: z.object({
    message: z
      .string()
      .min(1, 'Message is required')
      .max(4000, 'Message cannot exceed 4000 characters'),
    context: z.string().max(10000, 'Context cannot exceed 10000 characters').optional(),
    model: z.enum(['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo']).optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(1).max(4000).optional(),
  }),
};

/**
 * Validation schemas for authentication endpoints
 *
 * These schemas handle user authentication operations including
 * registration, login, and password management with security requirements.
 */
export const authSchemas = {
  /** Schema for user registration requests */
  register: z.object({
    email: commonSchemas.email,
    username: commonSchemas.username,
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password cannot exceed 128 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one lowercase letter, one uppercase letter, and one number',
      ),
    displayName: z
      .string()
      .min(1, 'Display name is required')
      .max(100, 'Display name cannot exceed 100 characters'),
  }),

  /** Schema for user login requests */
  login: z.object({
    email: commonSchemas.email,
    password: z.string().min(1, 'Password is required'),
  }),

  /** Schema for password reset requests */
  resetPassword: z.object({
    email: commonSchemas.email,
  }),

  /** Schema for password change requests */
  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .max(128, 'New password cannot exceed 128 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'New password must contain at least one lowercase letter, one uppercase letter, and one number',
      ),
  }),
};

/**
 * Validation schemas for common route parameters
 *
 * These schemas validate path parameters used across multiple endpoints
 * such as object IDs and usernames.
 */
export const paramSchemas = {
  /** Schema for MongoDB ObjectId path parameters */
  objectId: z.object({
    id: commonSchemas.objectId,
  }),

  /** Schema for username path parameters */
  username: z.object({
    username: commonSchemas.username,
  }),
};

/**
 * Validation schemas for common query parameters
 *
 * These schemas handle query string parameters for pagination,
 * searching, filtering, and other common operations.
 */
export const querySchemas = {
  /** Schema for pagination query parameters */
  pagination: z.object({
    page: z
      .string()
      .regex(/^\d+$/, 'Page must be a number')
      .transform(Number)
      .refine((n) => n >= 1, 'Page must be at least 1')
      .optional(),
    limit: z
      .string()
      .regex(/^\d+$/, 'Limit must be a number')
      .transform(Number)
      .refine((n) => n >= 1 && n <= 100, 'Limit must be between 1 and 100')
      .optional(),
    sort: z.enum(['asc', 'desc']).optional(),
    sortBy: z.string().min(1).max(50).optional(),
  }),

  /** Schema for search query parameters */
  search: z.object({
    q: z
      .string()
      .min(1, 'Search query is required')
      .max(200, 'Search query cannot exceed 200 characters'),
    type: z.enum(['user', 'content', 'transformation']).optional(),
  }),

  /** Schema for date range query parameters */
  dateRange: z
    .object({
      startDate: z.string().datetime('Invalid start date format').optional(),
      endDate: z.string().datetime('Invalid end date format').optional(),
    })
    .refine(
      (data) =>
        !data.startDate || !data.endDate || new Date(data.startDate) <= new Date(data.endDate),
      { message: 'Start date must be before end date' },
    ),
};
