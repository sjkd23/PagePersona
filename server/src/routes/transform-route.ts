/**
 * Transform Route Handler
 *
 * Provides RESTful endpoints for content transformation using various personas.
 * Handles both URL-based webpage transformation and direct text transformation
 * with persona-specific AI processing. Includes rate limiting, usage tracking,
 * and optional authentication for premium features.
 *
 * Routes:
 * - GET /personas: Retrieve available transformation personas
 * - POST /: Transform webpage content from URL
 * - POST /text: Transform direct text input
 * - GET /cache/stats: Development cache statistics
 * - DELETE /cache: Development cache clearing
 */

import "../types/loader";
import express, { Request, Response } from "express";
import { getAllClientPersonas } from "@pagepersonai/shared";
import { optionalAuth0 } from "../middleware/auth0-middleware";
import { checkUsageLimit } from "../middleware/usage-limit-middleware";
import { sendSuccess, sendInternalError } from "../utils/response-helpers";
import { validateRequest } from "../middleware/zod-validation";
import {
  transformSchema,
  transformTextSchema,
} from "../schemas/transform.schema";
import { logger } from "../utils/logger";
import { HttpStatus } from "../constants/http-status";
import { cacheService } from "../services/cache-service";
import { ErrorCode, ErrorMapper } from "@pagepersonai/shared";
import { sanitize } from "../utils/sanitizer";
import type { TransformationResult } from "../services/content-transformer";
import {
  generateJobId,
  acquireJobLock,
  createJob,
  getJob,
} from "../services/job-manager";
import {
  processWebpageTransformJob,
  processTextTransformJob,
  getCachedResult,
} from "../services/job-processor";

const router = express.Router();

// Only log route registration in production or when explicitly requested
if (
  process.env.NODE_ENV === "production" ||
  process.env.LOG_ROUTE_REGISTRATION === "true"
) {
  logger.transform.info("Transform routes module loaded");
  logger.transform.info("Registering transform routes", {
    routes: [
      "GET  /personas",
      "POST / (URL transform)",
      "POST /text (direct text transform)",
      "GET  /cache/stats (dev only)",
      "DELETE /cache (dev only)",
    ],
  });
}

/**
 * Health check endpoint for service monitoring
 *
 * @openapi
 * /api/transform/test:
 *   get:
 *     summary: Health check for transform service
 *     tags: [Transform]
 *     responses:
 *       '200':
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         message:
 *                           type: string
 *                           example: Transform routes are working
 *
 * @route GET /test
 * @returns {object} Success response with status message
 */
router.get("/test", (_req: Request, res: Response) => {
  sendSuccess(res, { message: "Transform routes are working" });
});

/**
 * Retrieve all available transformation personas
 *
 * Returns the complete list of personas available for content transformation,
 * including UI-specific fields like avatar URLs and theme information.
 *
 * @openapi
 * /api/transform/personas:
 *   get:
 *     summary: Get all available transformation personas
 *     tags: [Transform]
 *     responses:
 *       '200':
 *         description: Successfully retrieved personas
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         personas:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Persona'
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * @route GET /personas
 * @returns {object} Success response containing personas array
 * @throws {500} Internal server error if persona fetching fails
 */
router.get("/personas", (_req: Request, res: Response) => {
  try {
    // Return client personas with all UI fields (avatarUrl, theme, etc.)
    const personas = getAllClientPersonas();

    sendSuccess(res, { personas });
  } catch (error) {
    logger.transform.error("Error fetching personas", error);
    sendInternalError(res, "Failed to fetch personas");
  }
});

/**
 * Transform webpage content using selected persona
 *
 * Accepts a URL and persona selection, fetches the webpage content,
 * and applies AI-powered transformation based on the chosen persona's
 * characteristics and prompts. Includes usage tracking and rate limiting.
 *
 * @openapi
 * /api/transform:
 *   post:
 *     summary: Transform webpage content via AI persona
 *     tags: [Transform]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransformRequest'
 *           examples:
 *             basic:
 *               summary: Basic transformation request
 *               value:
 *                 url: "https://example.com/article"
 *                 persona: "professional"
 *             with_options:
 *               summary: Request with truncation options
 *               value:
 *                 url: "https://example.com/article"
 *                 persona: "casual"
 *                 options:
 *                   truncateLength: 5000
 *     responses:
 *       '200':
 *         description: Transformation successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/TransformResponse'
 *       '400':
 *         description: Invalid input or malformed URL
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '403':
 *         description: Forbidden - blocked or restricted content
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '404':
 *         description: Page not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '429':
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * @route POST /
 * @param {string} url - Target webpage URL to transform
 * @param {string} persona - Selected persona identifier for transformation
 * @returns {object} Transformed content or error response
 * @throws {400} Bad request for invalid URLs or private/internal URLs
 * @throws {403} Forbidden for blocked or restricted content
 * @throws {404} Not found for non-existent pages
 * @throws {500} Internal server error for processing failures
 */
router.post(
  "/",
  /*transformRateLimit,*/ validateRequest(transformSchema, "body"),
  optionalAuth0,
  checkUsageLimit(),
  async (req: Request, res: Response): Promise<void> => {
    logger.transform.info("POST /api/transform route hit");

    try {
      const { url, persona } = req.body;
      const mongoUser = (
        req as Request & {
          userContext?: { mongoUser?: { _id?: { toString(): string } } };
        }
      ).userContext?.mongoUser;
      const userId = mongoUser?._id?.toString();

      // Generate deterministic job ID based on request parameters
      const jobId = generateJobId(url, persona);

      // Check if cached result exists - return immediately if found
      const cachedResult = getCachedResult(url, persona);
      if (cachedResult) {
        logger.transform.info(
          "Cache hit! Returning cached result immediately",
          { jobId },
        );
        const sanitizedResult = sanitizeTransformationResult(cachedResult);
        res.status(HttpStatus.OK).json({
          status: "done",
          data: sanitizedResult,
          jobId,
          cached: true,
        });
        return;
      }

      // Check if job already exists
      const existingJob = await getJob(jobId);
      if (existingJob) {
        // Job already queued or in progress
        logger.transform.info(
          "Job already exists, returning existing job status",
          {
            jobId,
            status: existingJob.status,
          },
        );

        if (existingJob.status === "done" && existingJob.data) {
          // Job completed - return the result
          const sanitizedResult = sanitizeTransformationResult(
            existingJob.data as TransformationResult,
          );
          res.status(HttpStatus.OK).json({
            status: "done",
            data: sanitizedResult,
            jobId,
          });
        } else {
          // Job still processing or queued
          res.status(HttpStatus.ACCEPTED).json({
            status: existingJob.status,
            jobId,
            stage: existingJob.stage,
            progress: existingJob.progress,
            error: existingJob.error,
          });
        }
        return;
      }

      // Create new job record
      await createJob(jobId);

      // Try to acquire lock to process this job
      const lockAcquired = await acquireJobLock(jobId);
      if (lockAcquired) {
        // We got the lock - start background processing
        // Use setImmediate to ensure this runs outside the request context
        setImmediate(() => {
          processWebpageTransformJob(jobId, url, persona, userId).catch(
            (error) => {
              logger.transform.error("Background job failed", { jobId, error });
            },
          );
        });

        logger.transform.info("Background job started", { jobId });
      } else {
        // Another worker is already processing this job
        logger.transform.info("Job lock held by another worker", { jobId });
      }

      // Return 202 Accepted with job ID for polling
      res.status(HttpStatus.ACCEPTED).json({
        status: "queued",
        jobId,
        message: "Transformation job queued. Use the jobId to check status.",
      });
      return;
    } catch (error) {
      logger.transform.error("Webpage transformation route error", error);

      // Create user-friendly error response
      const userFriendlyError = ErrorMapper.mapError(error);

      // Handle specific known errors
      if (error instanceof Error) {
        if (error.message.includes("OpenAI API key is not configured")) {
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            error:
              "Our AI service is currently unavailable. Please try again later.",
            errorCode: ErrorCode.SERVICE_UNAVAILABLE,
            timestamp: new Date(),
          });
          return;
        }
      }

      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: userFriendlyError.message,
        errorCode: userFriendlyError.code,
        timestamp: userFriendlyError.timestamp,
      });
      return;
    }
  },
);

/**
 * Transform text content directly using selected persona
 *
 * Accepts raw text input and applies AI-powered transformation based on
 * the chosen persona's characteristics and prompts. Bypasses web scraping
 * for direct text processing scenarios.
 *
 * @openapi
 * /api/transform/text:
 *   post:
 *     summary: Transform text content directly via AI persona
 *     tags: [Transform]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransformTextRequest'
 *           examples:
 *             basic:
 *               summary: Basic text transformation
 *               value:
 *                 text: "This is some sample text to transform"
 *                 persona: "professional"
 *             with_options:
 *               summary: Text transformation with options
 *               value:
 *                 text: "This is some sample text to transform"
 *                 persona: "casual"
 *                 options:
 *                   truncateLength: 1000
 *     responses:
 *       '200':
 *         description: Text transformation successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/TransformResponse'
 *       '400':
 *         description: Invalid input or missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '429':
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * @route POST /text
 * @param {string} text - Raw text content to transform
 * @param {string} persona - Selected persona identifier for transformation
 * @returns {object} Transformed text content or error response
 * @throws {500} Internal server error for processing failures
 */
router.post(
  "/text",
  /*transformRateLimit,*/ validateRequest(transformTextSchema, "body"),
  optionalAuth0,
  checkUsageLimit(),
  async (req: Request, res: Response): Promise<void> => {
    logger.transform.info("POST /api/transform/text route hit");

    try {
      const { text, persona } = req.body;
      const mongoUser = (
        req as Request & {
          userContext?: { mongoUser?: { _id?: { toString(): string } } };
        }
      ).userContext?.mongoUser;
      const userId = mongoUser?._id?.toString();

      // Use text sample as URL for job ID generation (consistent with text caching)
      const textIdentifier = `text:${text.substring(0, 100)}`;
      const jobId = generateJobId(textIdentifier, persona);

      // Check if cached result exists
      const cachedResult = getCachedResult(textIdentifier, persona);
      if (cachedResult) {
        logger.transform.info(
          "Text cache hit! Returning cached result immediately",
          { jobId },
        );
        const sanitizedResult = sanitizeTransformationResult(cachedResult);
        res.status(HttpStatus.OK).json({
          status: "done",
          data: sanitizedResult,
          jobId,
          cached: true,
        });
        return;
      }

      // Check if job already exists
      const existingJob = await getJob(jobId);
      if (existingJob) {
        logger.transform.info("Text job already exists", {
          jobId,
          status: existingJob.status,
        });

        if (existingJob.status === "done" && existingJob.data) {
          const sanitizedResult = sanitizeTransformationResult(
            existingJob.data as TransformationResult,
          );
          res.status(HttpStatus.OK).json({
            status: "done",
            data: sanitizedResult,
            jobId,
          });
        } else {
          res.status(HttpStatus.ACCEPTED).json({
            status: existingJob.status,
            jobId,
            stage: existingJob.stage,
            progress: existingJob.progress,
            error: existingJob.error,
          });
        }
        return;
      }

      // Create new job record
      await createJob(jobId);

      // Try to acquire lock to process this job
      const lockAcquired = await acquireJobLock(jobId);
      if (lockAcquired) {
        // Start background processing
        setImmediate(() => {
          processTextTransformJob(jobId, text, persona, userId).catch(
            (error) => {
              logger.transform.error("Background text job failed", {
                jobId,
                error,
              });
            },
          );
        });

        logger.transform.info("Background text job started", { jobId });
      } else {
        logger.transform.info("Text job lock held by another worker", {
          jobId,
        });
      }

      // Return 202 Accepted with job ID for polling
      res.status(HttpStatus.ACCEPTED).json({
        status: "queued",
        jobId,
        message:
          "Text transformation job queued. Use the jobId to check status.",
      });
      return;
    } catch (error) {
      logger.transform.error("Text transformation route error", error);

      // Create user-friendly error response
      const userFriendlyError = ErrorMapper.mapError(error);

      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: userFriendlyError.message,
        errorCode: userFriendlyError.code,
        timestamp: userFriendlyError.timestamp,
      });
      return;
    }
  },
);

/**
 * Get transformation job status and result
 *
 * Polls for the status of an asynchronous transformation job.
 * Returns job progress, stage information, and final result when complete.
 *
 * @openapi
 * /api/transform/jobs/{jobId}:
 *   get:
 *     summary: Get transformation job status
 *     tags: [Transform]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique job identifier returned from POST /api/transform
 *     responses:
 *       '200':
 *         description: Job status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [queued, running, done, error]
 *                 stage:
 *                   type: string
 *                   enum: [scrape, clean, llm, save]
 *                 progress:
 *                   type: number
 *                   minimum: 0
 *                   maximum: 100
 *                 data:
 *                   $ref: '#/components/schemas/TransformResponse'
 *                 error:
 *                   type: string
 *       '404':
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * @route GET /jobs/:jobId
 * @param {string} jobId - Unique job identifier
 * @returns {object} Job status, progress, and result data
 */
router.get(
  "/jobs/:jobId",
  async (req: Request, res: Response): Promise<void> => {
    const { jobId } = req.params;

    logger.transform.info("GET /api/transform/jobs/:jobId route hit", {
      jobId,
    });

    try {
      const job = await getJob(jobId);

      if (!job) {
        res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          error: "Job not found",
          errorCode: ErrorCode.UNKNOWN_ERROR,
          timestamp: new Date(),
        });
        return;
      }

      // If job is done and has data, sanitize it
      if (job.status === "done" && job.data) {
        const sanitizedData = sanitizeTransformationResult(
          job.data as TransformationResult,
        );
        res.status(HttpStatus.OK).json({
          status: job.status,
          stage: job.stage,
          progress: job.progress,
          data: sanitizedData,
          jobId: job.jobId,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
        });
        return;
      }

      // Return job status without data for queued/running/error states
      res.status(HttpStatus.OK).json({
        status: job.status,
        stage: job.stage,
        progress: job.progress,
        error: job.error,
        jobId: job.jobId,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      });
    } catch (error) {
      logger.transform.error("Error getting job status", { jobId, error });
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: "Failed to retrieve job status",
        errorCode: ErrorCode.UNKNOWN_ERROR,
        timestamp: new Date(),
      });
    }
  },
);

// Development and debugging endpoints (non-production environment only)
if (process.env.NODE_ENV !== "production") {
  /**
   * Get cache statistics for debugging purposes
   *
   * @route GET /cache/stats
   * @returns {object} Cache performance and usage statistics
   * @access Development environment only
   */
  router.get("/cache/stats", (_req: Request, res: Response) => {
    try {
      const stats = cacheService.getCacheStats();
      sendSuccess(res, { cacheStats: stats });
    } catch (error) {
      logger.transform.error("Error getting cache stats", error);
      sendInternalError(res, "Failed to get cache statistics");
    }
  });

  /**
   * Clear all application caches for debugging purposes
   *
   * @route DELETE /cache
   * @returns {object} Success confirmation of cache clearing
   * @access Development environment only
   */
  router.delete("/cache", (_req: Request, res: Response) => {
    try {
      cacheService.clearAllCaches();
      sendSuccess(res, null, "All caches cleared");
    } catch (error) {
      logger.transform.error("Error clearing cache", error);
      sendInternalError(res, "Failed to clear cache");
    }
  });
}

export default router;

/**
 * Sanitize transformation result to prevent XSS attacks
 *
 * Applies HTML sanitization to user-supplied and AI-generated content
 * to ensure safe rendering in web applications.
 */
function sanitizeTransformationResult(
  result: TransformationResult,
): TransformationResult {
  return {
    ...result,
    transformedContent: sanitize(result.transformedContent),
    originalContent: {
      ...result.originalContent,
      title: sanitize(result.originalContent.title),
      content: sanitize(result.originalContent.content),
    },
    persona: {
      ...result.persona,
      name: sanitize(result.persona.name),
      description: sanitize(result.persona.description),
    },
  };
}
