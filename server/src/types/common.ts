/**
 * Common TypeScript interfaces and types to replace unsafe 'any' types
 * These provide proper typing for Auth0 users, errors, middleware, and utility functions
 */

import { Request, Response, NextFunction } from 'express';
import { IMongoUser } from '../models/mongo-user';

// ============================================================================
// AUTH0 & USER TYPES
// ============================================================================

/**
 * Raw Auth0 JWT payload structure
 * Represents the decoded JWT token from Auth0
 */
export interface Auth0JwtPayload {
  /** Unique Auth0 user identifier (required) */
  sub: string;
  
  /** User's email address */
  email?: string;
  
  /** Whether the email has been verified */
  email_verified?: boolean;
  
  /** User's given name (first name) */
  given_name?: string;
  
  /** User's family name (last name) */
  family_name?: string;
  
  /** User's full name */
  name?: string;
  
  /** User's nickname/username */
  nickname?: string;
  
  /** Profile picture URL */
  picture?: string;
  
  /** User's locale/language preference */
  locale?: string;
  
  /** Timestamp when user was last updated */
  updated_at?: string;
  
  /** JWT audience */
  aud?: string | string[];
  
  /** JWT issuer */
  iss?: string;
  
  /** JWT issued at timestamp */
  iat?: number;
  
  /** JWT expiration timestamp */
  exp?: number;
  
  /** Any custom Auth0 claims - keyed by full claim URL */
  [key: string]: unknown;
}

/**
 * Processed Auth0 user information after safe extraction
 * Used throughout the application for consistent Auth0 user access
 */
export interface ProcessedAuth0User {
  sub: string;
  email?: string;
  emailVerified?: boolean;
  name?: string;
  givenName?: string;
  familyName?: string;
  nickname?: string;
  picture?: string;
  locale?: string;
  updatedAt?: string;
  /** Allow additional properties for compatibility with Auth0User */
  [key: string]: unknown;
}

/**
 * Complete user context passed through requests
 * Combines MongoDB user data with Auth0 information
 */
export interface AuthenticatedUserContext {
  jwtPayload: Auth0JwtPayload;
  auth0User: ProcessedAuth0User;
  mongoUser: IMongoUser;
}

// ============================================================================
// REQUEST & MIDDLEWARE TYPES
// ============================================================================

/**
 * Enhanced Express Request with proper typing for auth fields
 * Replaces unsafe (req as any) patterns
 */
export interface AuthenticatedRequest extends Request {
  /**
   * ✅ UNIFIED USER CONTEXT (CURRENT STANDARD)
   * Contains all user-related data in a single, well-typed object
   */
  userContext?: AuthenticatedUserContext;
  
  // Legacy fields (deprecated but kept for backward compatibility)
  user?: Auth0JwtPayload;
  mongoUser?: IMongoUser;
  auth0User?: ProcessedAuth0User;
  userId?: string;
}

/**
 * Standard Express middleware function type
 * Replaces (req: any, res: any, next: any) patterns
 */
export type MiddlewareFunction = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

/**
 * Express error handler middleware function type
 * Follows Express error handler signature
 */
export type ErrorHandlerFunction = (
  err: AppError | Error | unknown,
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => void;

/**
 * Generic async route handler type
 * For route handlers that may throw async errors
 */
export type AsyncRouteHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Application-specific error interface
 * Provides structured error information
 */
export interface AppError extends Error {
  name: string;
  message: string;
  status?: number;
  code?: string;
  type?: string;
  param?: string;
  details?: unknown;
  stack?: string;
}

/**
 * OpenAI API error structure
 * Based on OpenAI's error response format
 */
export interface OpenAIError extends Error {
  status?: number;
  code?: string;
  type?: string;
  param?: string;
  error?: {
    message?: string;
    type?: string;
    param?: string;
    code?: string;
  };
}

/**
 * Validation error details
 * For form validation and input validation errors
 */
export interface ValidationErrorDetails {
  field: string;
  message: string;
  value?: unknown;
  code?: string;
}

/**
 * Comprehensive validation error
 */
export interface ValidationError extends Error {
  name: 'ValidationError';
  errors: ValidationErrorDetails[];
  details?: unknown;
}

// ============================================================================
// UTILITY & TRANSFORM TYPES
// ============================================================================

/**
 * Content transformation request structure
 */
export interface TransformationRequest {
  url?: string;
  content?: string;
  persona: string;
  options?: {
    preserveFormatting?: boolean;
    maxLength?: number;
    tone?: string;
  };
}

/**
 * Scraped content structure
 */
export interface ScrapedContent {
  title?: string;
  content: string;
  url: string;
  metadata?: {
    description?: string;
    author?: string;
    publishDate?: string;
    wordCount?: number;
  };
}

/**
 * Content transformation result
 */
export interface TransformationResult {
  originalContent: string;
  transformedContent: string;
  persona: string;
  wordCount: {
    original: number;
    transformed: number;
  };
  processingTime: number;
  metadata?: {
    model?: string;
    tokens?: number;
    cost?: number;
  };
}

// ============================================================================
// DATA SYNC & MAPPING TYPES
// ============================================================================

/**
 * Sync rule function type for Auth0 to MongoDB field mapping
 * Determines whether a field should be synced based on values
 */
export type SyncRuleFunction<T = unknown> = (
  auth0Value: T,
  mongoValue: T
) => boolean;

/**
 * Transform function type for converting Auth0 values to MongoDB format
 */
export type TransformFunction<TInput = unknown, TOutput = unknown> = (
  value: TInput
) => TOutput;

/**
 * Field mapping configuration for Auth0 to MongoDB sync
 */
export interface FieldMapping<T = unknown> {
  auth0Field: string;
  mongoField: string;
  syncRule: SyncRuleFunction<T>;
  transform: TransformFunction<T>;
}

/**
 * Sync operation result
 */
export interface SyncResult {
  updated: boolean;
  changedFields: string[];
  errors?: string[];
  timestamp: Date;
}

// ============================================================================
// LOGGING & DEBUGGING TYPES
// ============================================================================

/**
 * Structured logging data
 */
export interface LogData {
  [key: string]: unknown;
}

/**
 * Log context for categorized logging
 */
export interface LogContext {
  category: string;
  operation?: string;
  userId?: string;
  timestamp: Date;
  metadata?: LogData;
}

// ============================================================================
// UTILITY HELPER TYPES
// ============================================================================

/**
 * Type guard for unknown values
 * Helps safely narrow unknown types
 */
export type TypeGuard<T> = (value: unknown) => value is T;

/**
 * Safe date value type
 * Accepts various date representations
 */
export type DateLike = Date | string | number;

/**
 * Generic record with string keys
 * Safer alternative to { [key: string]: any }
 */
export type StringRecord<T = unknown> = Record<string, T>;

/**
 * Function that safely processes unknown input
 * Returns either the processed result or null on error
 */
export type SafeProcessor<TInput, TOutput> = (
  input: TInput
) => TOutput | null;

// ============================================================================
// API CONFIGURATION TYPES
// ============================================================================

/**
 * JWT verification configuration
 */
export interface JwtConfig {
  domain: string;
  audience: string;
  algorithms: string[];
  issuer?: string;
  clockTolerance?: number;
}

/**
 * Enhanced JWT verifier configuration
 */
export interface EnhancedJwtConfig extends JwtConfig {
  cacheExpiration?: number;
  retryAttempts?: number;
  timeoutMs?: number;
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: AuthenticatedRequest) => string;
}
