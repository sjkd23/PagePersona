/**
 * Comprehensive Error Types and User-Friendly Error Messages
 *
 * This module defines standardized error types and user-friendly messages
 * for consistent error handling across the entire application.
 */
/**
 * Standard error codes used throughout the application
 */
export declare enum ErrorCode {
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_INVALID = 'AUTH_INVALID',
  AUTH_EXPIRED = 'AUTH_EXPIRED',
  USAGE_LIMIT_EXCEEDED = 'USAGE_LIMIT_EXCEEDED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_URL = 'INVALID_URL',
  INVALID_TEXT = 'INVALID_TEXT',
  INVALID_PERSONA = 'INVALID_PERSONA',
  TEXT_TOO_LONG = 'TEXT_TOO_LONG',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  SCRAPING_FAILED = 'SCRAPING_FAILED',
  TRANSFORMATION_FAILED = 'TRANSFORMATION_FAILED',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  PROFILE_UPDATE_FAILED = 'PROFILE_UPDATE_FAILED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}
/**
 * User-friendly error messages mapped to error codes
 */
export declare const ERROR_MESSAGES: Record<
  ErrorCode,
  {
    title: string;
    message: string;
    actionText?: string;
    helpText?: string;
  }
>;
/**
 * Enhanced error response interface
 */
export interface UserFriendlyError {
  code: ErrorCode;
  title: string;
  message: string;
  actionText?: string;
  helpText?: string;
  details?: unknown;
  timestamp: Date;
  currentUsage?: number;
  usageLimit?: number;
  membership?: string;
  upgradeUrl?: string;
  retryAfter?: number;
  penaltyDuration?: number;
}
/**
 * Error mapping utilities
 */
export declare class ErrorMapper {
  /**
   * Maps a generic error to a user-friendly error with appropriate code
   */
  static mapError(error: unknown): UserFriendlyError;
  /**
   * Maps usage limit error with specific details
   */
  static mapUsageLimitError(details: {
    currentUsage: number;
    usageLimit: number;
    membership: string;
  }): UserFriendlyError;
  /**
   * Maps rate limit error with retry information
   */
  static mapRateLimitError(retryAfter?: number, penaltyDuration?: number): UserFriendlyError;
  /**
   * Creates a user-friendly error from an error code
   */
  private static createError;
}
//# sourceMappingURL=errors.d.ts.map
