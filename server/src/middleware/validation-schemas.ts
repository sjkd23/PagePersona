/**
 * 🛡️ Validation schemas for API endpoints
 * Defines Zod schemas for all major API routes
 */

import { z } from 'zod';
import { commonSchemas } from './zod-validation';

/**
 * Transform endpoint schemas
 */
export const transformSchemas = {
  // POST /api/transform - Transform webpage with URL
  transformUrl: z.object({
    url: commonSchemas.url,
    persona: commonSchemas.persona,
    style: commonSchemas.style,
  }),

  // POST /api/transform/text - Transform text content directly
  transformText: z.object({
    text: commonSchemas.text,
    persona: commonSchemas.persona,
    style: commonSchemas.style,
  }),
};

/**
 * User endpoint schemas
 */
export const userSchemas = {
  // PUT /api/user/profile - Update user profile
  updateProfile: z.object({
    firstName: z.string()
      .max(50, 'First name cannot exceed 50 characters')
      .optional(),
    lastName: z.string()
      .max(50, 'Last name cannot exceed 50 characters')
      .optional(),
    displayName: z.string()
      .min(1, 'Display name is required')
      .max(100, 'Display name cannot exceed 100 characters')
      .optional(),
    bio: z.string()
      .max(500, 'Bio cannot exceed 500 characters')
      .optional(),
    preferences: z.object({
      theme: z.enum(['light', 'dark', 'auto']).optional(),
      language: z.string().min(2).max(5).optional(),
      notifications: z.boolean().optional(),
    }).optional(),
  }).refine(
    data => Object.keys(data).length > 0,
    { message: 'At least one field must be provided for update' }
  ),

  // GET /api/user/profile - Query params for user profile
  profileQuery: z.object({
    include: z.enum(['stats', 'preferences', 'history']).optional(),
  }),
};

/**
 * Chat/GPT endpoint schemas
 */
export const chatSchemas = {
  // POST /api/gpt/chat - Send chat message
  chatMessage: z.object({
    message: z.string()
      .min(1, 'Message is required')
      .max(4000, 'Message cannot exceed 4000 characters'),
    context: z.string().max(10000, 'Context cannot exceed 10000 characters').optional(),
    model: z.enum(['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo']).optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(1).max(4000).optional(),
  }),
};

/**
 * Authentication endpoint schemas
 */
export const authSchemas = {
  // POST /api/auth/register - User registration
  register: z.object({
    email: commonSchemas.email,
    username: commonSchemas.username,
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password cannot exceed 128 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    displayName: z.string()
      .min(1, 'Display name is required')
      .max(100, 'Display name cannot exceed 100 characters'),
  }),

  // POST /api/auth/login - User login
  login: z.object({
    email: commonSchemas.email,
    password: z.string().min(1, 'Password is required'),
  }),

  // POST /api/auth/reset-password - Password reset
  resetPassword: z.object({
    email: commonSchemas.email,
  }),

  // POST /api/auth/change-password - Change password
  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string()
      .min(8, 'New password must be at least 8 characters')
      .max(128, 'New password cannot exceed 128 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'New password must contain at least one lowercase letter, one uppercase letter, and one number'),
  }),
};

/**
 * Common route parameter schemas
 */
export const paramSchemas = {
  // MongoDB ObjectId parameter
  objectId: z.object({
    id: commonSchemas.objectId,
  }),

  // Username parameter
  username: z.object({
    username: commonSchemas.username,
  }),
};

/**
 * Common query parameter schemas
 */
export const querySchemas = {
  // Pagination parameters
  pagination: z.object({
    page: z.string().regex(/^\d+$/, 'Page must be a number').transform(Number).refine(n => n >= 1, 'Page must be at least 1').optional(),
    limit: z.string().regex(/^\d+$/, 'Limit must be a number').transform(Number).refine(n => n >= 1 && n <= 100, 'Limit must be between 1 and 100').optional(),
    sort: z.enum(['asc', 'desc']).optional(),
    sortBy: z.string().min(1).max(50).optional(),
  }),

  // Search parameters
  search: z.object({
    q: z.string().min(1, 'Search query is required').max(200, 'Search query cannot exceed 200 characters'),
    type: z.enum(['user', 'content', 'transformation']).optional(),
  }),

  // Date range parameters
  dateRange: z.object({
    startDate: z.string().datetime('Invalid start date format').optional(),
    endDate: z.string().datetime('Invalid end date format').optional(),
  }).refine(
    data => !data.startDate || !data.endDate || new Date(data.startDate) <= new Date(data.endDate),
    { message: 'Start date must be before end date' }
  ),
};
