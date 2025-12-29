/**
 * Response Helper Utilities
 *
 * Centralized response formatting utilities ensuring consistent API response
 * structure across all endpoints. Provides standardized success/error response
 * formats with proper HTTP status codes and structured data formatting.
 *
 * Features:
 * - Consistent response format across all endpoints
 * - Standardized error handling and formatting
 * - HTTP status code management
 * - Response logging and debugging support
 * - Type-safe response data handling
 */

import { Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "./logger";
import type { ApiResponse } from "@pagepersonai/shared";
import type {
  AuthenticatedRequest,
  ErrorHandlerFunction,
  AsyncRouteHandler,
} from "../types/common";
import { HttpStatus } from "../constants/http-status";

/**
 * Send successful API response with optional data and message
 *
 * Formats and sends a standardized success response with consistent
 * structure and appropriate HTTP status code.
 *
 * @param res - Express response object
 * @param data - Optional response data payload
 * @param message - Optional success message
 * @param statusCode - HTTP status code (defaults to 200)
 */
export function sendSuccess<T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode: number = HttpStatus.OK,
): void {
  const response: ApiResponse<T> = {
    success: true,
    ...(message && { message }),
    ...(data !== undefined && data !== null && { data }),
  };

  res.status(statusCode).json(response);
}

/**
 * Send an error response with consistent format
 */
export function sendError(
  res: Response,
  error: string,
  statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
  data?: unknown,
): void {
  const response: ApiResponse = {
    success: false,
    error,
    ...(data !== undefined && { data }),
  };

  res.status(statusCode).json(response);
}

/**
 * Send a validation error (400 Bad Request)
 */
export function sendValidationError(
  res: Response,
  error: string,
  data?: unknown,
): void {
  sendError(res, error, HttpStatus.BAD_REQUEST, data);
}

/**
 * Send a not found error (404 Not Found)
 */
export function sendNotFound(
  res: Response,
  error: string = "Resource not found",
): void {
  sendError(res, error, HttpStatus.NOT_FOUND);
}

/**
 * Send an unauthorized error (401 Unauthorized)
 */
export function sendUnauthorized(
  res: Response,
  error: string = "Unauthorized access",
): void {
  sendError(res, error, HttpStatus.UNAUTHORIZED);
}

/**
 * Send a forbidden error (403 Forbidden)
 */
export function sendForbidden(
  res: Response,
  error: string = "Access forbidden",
): void {
  sendError(res, error, HttpStatus.FORBIDDEN);
}

/**
 * Send an internal server error (500 Internal Server Error)
 */
export function sendInternalError(
  res: Response,
  error: string = "Internal server error",
): void {
  sendError(res, error, HttpStatus.INTERNAL_SERVER_ERROR);
}

/**
 * Middleware to catch and format unhandled route errors
 * Conforms to Express's standard error handler signature: (err, req, res)
 */
export const errorHandler: ErrorHandlerFunction = (err, req, res) => {
  logger.error("Unhandled route error", err as Error, {
    route: `${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
  });

  // Handle specific error types
  if (err && typeof err === "object" && "name" in err) {
    if (err instanceof ZodError) {
      res.status(HttpStatus.BAD_REQUEST).json({
        error: "Validation failed",
        issues: err.issues,
      });
      return;
    }

    if (err.name === "ValidationError") {
      sendValidationError(res, (err as Error).message);
      return;
    }

    if (err.name === "UnauthorizedError") {
      sendUnauthorized(res, "Invalid or missing authentication token");
      return;
    }
  }

  // Handle errors with status codes
  if (err && typeof err === "object" && "status" in err && err.status === 404) {
    const message =
      (err as { message?: string }).message || "Resource not found";
    sendNotFound(res, message);
    return;
  }

  // Default to internal server error
  const errorMessage =
    err && typeof err === "object" && "message" in err
      ? (err as Error).message
      : "Unknown error occurred";

  sendInternalError(
    res,
    process.env.NODE_ENV === "production"
      ? "Something went wrong"
      : errorMessage,
  );
};

/**
 * Async route wrapper to catch promise rejections
 */
export function asyncHandler(
  fn: AsyncRouteHandler,
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Generic response helper that automatically chooses between success and error
 * Example: sendResponse(res, HttpStatus.OK, data) or sendResponse(res, HttpStatus.BAD_REQUEST, null, 'Error message')
 */
export function sendResponse<T>(
  res: Response,
  statusCode: HttpStatus,
  data?: T,
  error?: string,
  message?: string,
): void {
  // Determine if this is a success or error response based on status code
  const isSuccess = statusCode >= 200 && statusCode < 400;

  if (isSuccess) {
    sendSuccess(res, data, message, statusCode);
  } else {
    sendError(res, error || "An error occurred", statusCode, data);
  }
}
