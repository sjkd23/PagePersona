/**
 * Authentication Controller
 *
 * This module provides REST API controllers for user authentication and profile
 * management operations. It handles authenticated user data retrieval, usage
 * statistics, and user summary information.
 *
 * Key Features:
 * - Authenticated user profile retrieval
 * - User usage statistics and limits
 * - User summary information for dashboards
 * - Consistent error handling and logging
 * - Serialized response formatting
 *
 * All endpoints require valid authentication middleware to populate
 * the userContext with MongoDB user data.
 */

import "../types/loader";
import { Response } from "express";
import { logger } from "../utils/logger";
import { HttpStatus } from "../constants/http-status";
import type { AuthenticatedRequest } from "../types/common";
import {
  serializeMongoUser,
  serializeUserUsage,
  serializeUserSummary,
  createSuccessResponse,
  createErrorResponse,
} from "../utils/userSerializer";

/**
 * Get current authenticated user information
 *
 * Retrieves the complete user profile for the currently authenticated user.
 * Returns serialized user data including profile information, preferences,
 * and membership details.
 *
 * @route GET /api/user
 * @access Private - Requires authentication
 * @param req Authenticated request with user context
 * @param res Express response object
 */
export const getUser = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const user = req.userContext?.mongoUser;

    if (!user) {
      res
        .status(HttpStatus.NOT_FOUND)
        .json(createErrorResponse("User not found"));
      return;
    }

    const serializedUser = serializeMongoUser(user);
    res.json(createSuccessResponse({ user: serializedUser }));
  } catch (error) {
    logger.auth.error("Error fetching user", error);
    res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json(createErrorResponse("Internal server error"));
    return;
  }
};

/**
 * Get current user's usage statistics
 *
 * Retrieves detailed usage information for the authenticated user including
 * current monthly usage, limits based on membership tier, and usage history.
 *
 * @route GET /api/user/usage
 * @access Private - Requires authentication
 * @param req Authenticated request with user context
 * @param res Express response object
 */
export const getUserUsage = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const user = req.userContext?.mongoUser;

    if (!user) {
      res
        .status(HttpStatus.NOT_FOUND)
        .json(createErrorResponse("User not found"));
      return;
    }

    const usage = serializeUserUsage(user);
    res.json(createSuccessResponse(usage));
  } catch (error) {
    logger.auth.error("Error fetching user usage", error);
    res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json(createErrorResponse("Internal server error"));
    return;
  }
};

/**
 * Get current user's summary information
 *
 * Retrieves a condensed summary of user information suitable for dashboard
 * displays and quick user information panels. Includes key metrics and
 * status information.
 *
 * @route GET /api/user/summary
 * @access Private - Requires authentication
 * @param req Authenticated request with user context
 * @param res Express response object
 */
export const getUserSummary = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const user = req.userContext?.mongoUser;

    if (!user) {
      res
        .status(HttpStatus.NOT_FOUND)
        .json(createErrorResponse("User not found"));
      return;
    }

    const summary = serializeUserSummary(user);
    res.json(createSuccessResponse(summary));
  } catch (error) {
    logger.auth.error("Error fetching user summary", error);
    res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json(createErrorResponse("Internal server error"));
    return;
  }
};
