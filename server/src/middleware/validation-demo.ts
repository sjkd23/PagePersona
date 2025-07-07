/**
 * 🛡️ Validation Demo - Example usage of the new Zod validation system
 * 
 * This file demonstrates how to use the validation middleware for new endpoints
 */

import express from 'express';
import { z } from 'zod';
import { validateBody, validateQuery } from '../middleware/zod-validation';
import { commonSchemas } from '../middleware/zod-validation';

const router = express.Router();

// Example 1: Simple validation using common schemas
const simpleSchema = z.object({
  email: commonSchemas.email,
  username: commonSchemas.username,
});

router.post('/simple', validateBody(simpleSchema), (req, res) => {
  // req.body is now validated and typed
  const { email, username } = req.body; // TypeScript knows these are strings
  res.json({ message: `Hello ${username} (${email})` });
});

// Example 2: Custom validation with refinements
const advancedSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  content: z.string().min(10).max(1000),
  tags: z.array(z.string()).min(1, 'At least one tag is required').max(5),
  published: z.boolean().default(false),
  publishDate: z.string().datetime().optional(),
}).refine(
  data => !data.published || data.publishDate,
  { message: 'Published posts must have a publish date' }
);

router.post('/advanced', validateBody(advancedSchema), (req, res) => {
  // All validation passed, data is clean and typed
  res.json({ success: true, data: req.body });
});

// Example 3: Query parameter validation
const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  category: z.enum(['tech', 'business', 'lifestyle']).optional(),
  limit: z.preprocess(
    (val) => val ? Number(val) : undefined,
    z.number().max(100).optional()
  ),
});

router.get('/search', validateQuery(searchQuerySchema), (req, res) => {
  const { q, category, limit } = req.query; // All typed correctly
  res.json({ query: q, category, limit });
});

// Example 4: Combining validations
const combinedParamsSchema = z.object({
  id: commonSchemas.objectId,
});

const combinedBodySchema = z.object({
  action: z.enum(['approve', 'reject', 'pending']),
  reason: z.string().optional(),
});

router.put('/items/:id/status', 
  validateQuery(combinedParamsSchema), 
  validateBody(combinedBodySchema), 
  (req, res) => {
    const { id } = req.params;
    const { action, reason } = req.body;
    res.json({ id, action, reason });
  }
);

/**
 * Error Response Examples:
 * 
 * Invalid email:
 * {
 *   "success": false,
 *   "error": "Invalid input",
 *   "details": {
 *     "email": ["Invalid email format"]
 *   }
 * }
 * 
 * Multiple validation errors:
 * {
 *   "success": false,
 *   "error": "Invalid input", 
 *   "details": {
 *     "title": ["Title must be at least 5 characters"],
 *     "tags": ["At least one tag is required"],
 *     "_errors": ["Published posts must have a publish date"]
 *   }
 * }
 */

export default router;
