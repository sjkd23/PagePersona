/**
 * API Usage Tracking Middleware
 *
 * This middleware tracks API usage metrics for authenticated users, including
 * request duration, response size, token consumption, and endpoint access patterns.
 *
 * Features:
 * - Automatic usage increment in MongoDB
 * - Response time and size measurement
 * - Token usage extraction from AI API responses
 * - Detailed logging for monitoring and analytics
 * - Asynchronous processing to avoid blocking responses
 * - Test environment compatibility
 *
 * The middleware hooks into the response lifecycle to capture metrics
 * without impacting the user experience.
 */

import { Response, NextFunction } from "express";
import { incrementUserUsage } from "../utils/usage-tracking";
import type { AuthenticatedRequest } from "../types/common";
import { logger } from "../utils/logger";

/**
 * Express middleware to track API usage metrics
 *
 * This middleware captures comprehensive usage data for authenticated requests:
 * - Request timing and response size
 * - Token consumption from AI API responses
 * - Success/failure status
 * - User identification and endpoint tracking
 *
 * Usage data is recorded asynchronously to MongoDB and logged for analysis.
 *
 * @param req Authenticated Express request object
 * @param res Express response object
 * @param next Next middleware function
 */
export const trackUsage = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  const startTime = Date.now();
  const originalSend = res.send;

  // Override res.send to capture response data and metrics
  res.send = function (data: unknown) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Extract user ID from authenticated request context
    const userId = req.userContext?.mongoUser?._id?.toString();

    if (userId) {
      // Initialize metric variables
      let responseSize = 0;
      let tokensUsed = 0;
      let model = "";

      try {
        if (typeof data === "string") {
          responseSize = Buffer.byteLength(data, "utf8");

          // Parse response to extract AI API usage data
          const parsed = JSON.parse(data);
          if (parsed.usage) {
            tokensUsed = parsed.usage.total_tokens || 0;
            model = (req.body as { model?: string })?.model || "gpt-4o-mini";
          }
        }
      } catch (error) {
        // Response is not JSON or parsing failed - continue without token data
      }

      // Record usage asynchronously to avoid blocking the response
      const recordUsage = async () => {
        try {
          // Update user usage counter in MongoDB
          await incrementUserUsage(userId, {
            logSuccess: true,
            logErrors: true,
          });

          // Log detailed usage metrics for monitoring and analytics
          logger.usage.info("API usage tracked", {
            userId,
            endpoint: req.originalUrl,
            method: req.method,
            tokensUsed: tokensUsed || 0,
            responseSize,
            duration,
            success: res.statusCode >= 200 && res.statusCode < 400,
            model: model || undefined,
          });
        } catch (error) {
          logger.usage.error("Error recording usage:", error);
        }
      };

      // Execute usage recording based on environment
      // In test environment, run synchronously for deterministic testing
      // In production, use setImmediate for non-blocking execution
      if (process.env.NODE_ENV === "test") {
        recordUsage();
      } else {
        setImmediate(recordUsage);
      }
    }

    // Call the original send function to complete the response
    return originalSend.call(this, data);
  };

  next();
};

/**
 * Default export for convenient importing
 */
export default trackUsage;
