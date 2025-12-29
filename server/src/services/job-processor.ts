/**
 * Background Job Processor
 *
 * Handles asynchronous transformation jobs without blocking the HTTP request-response cycle.
 * Runs transformations in the background with progress tracking and proper error handling.
 */

import { createTransformationService } from "./transformation-service";
import { cacheService } from "./cache-service";
import {
  updateJobProgress,
  completeJob,
  failJob,
  releaseJobLock,
} from "./job-manager";
import { logger } from "../utils/logger";
import type { TransformationResult } from "./content-transformer";

/**
 * Process webpage transformation job in the background
 *
 * This function runs independently of the HTTP request lifecycle,
 * ensuring that even if the client disconnects, the job continues.
 *
 * @param jobId - Job identifier for status tracking
 * @param url - Target URL to scrape and transform
 * @param persona - Persona ID for transformation
 * @param userId - Optional user ID for usage tracking
 */
export async function processWebpageTransformJob(
  jobId: string,
  url: string,
  persona: string,
  userId?: string,
): Promise<void> {
  try {
    logger.transform.info("Starting background webpage transformation job", {
      jobId,
      url,
      persona,
      userId,
    });

    // Update job to running status
    await updateJobProgress(jobId, "scrape", 10);

    const transformationService = createTransformationService();

    // Note: We don't pass an AbortSignal here because we want the job
    // to complete even if the client disconnects
    const result = await transformationService.transformWebpage({
      url,
      persona,
      userId,
    });

    // Check if transformation succeeded
    if (result.success && result.data) {
      logger.transform.info("Background job completed successfully", { jobId });

      // Complete the job with the result data
      await completeJob(jobId, result.data);
    } else {
      // Transformation failed
      logger.transform.error("Background job failed during transformation", {
        jobId,
        error: result.error,
        errorCode: result.errorCode,
      });

      await failJob(jobId, result.error || "Transformation failed");
    }
  } catch (error) {
    logger.transform.error("Background job processing error", {
      jobId,
      error,
    });

    await failJob(
      jobId,
      error instanceof Error ? error.message : "Unknown error",
    );
  } finally {
    // Always release the lock when done
    await releaseJobLock(jobId);
  }
}

/**
 * Process text transformation job in the background
 *
 * @param jobId - Job identifier for status tracking
 * @param text - Text content to transform
 * @param persona - Persona ID for transformation
 * @param userId - Optional user ID for usage tracking
 */
export async function processTextTransformJob(
  jobId: string,
  text: string,
  persona: string,
  userId?: string,
): Promise<void> {
  try {
    logger.transform.info("Starting background text transformation job", {
      jobId,
      textLength: text.length,
      persona,
      userId,
    });

    // Update job to running status
    await updateJobProgress(jobId, "clean", 20);

    const transformationService = createTransformationService();

    const result = await transformationService.transformText({
      text,
      persona,
      userId,
    });

    // Check if transformation succeeded
    if (result.success && result.data) {
      logger.transform.info("Background text job completed successfully", {
        jobId,
      });

      await completeJob(jobId, result.data);
    } else {
      logger.transform.error("Background text job failed", {
        jobId,
        error: result.error,
        errorCode: result.errorCode,
      });

      await failJob(jobId, result.error || "Text transformation failed");
    }
  } catch (error) {
    logger.transform.error("Background text job processing error", {
      jobId,
      error,
    });

    await failJob(
      jobId,
      error instanceof Error ? error.message : "Unknown error",
    );
  } finally {
    // Always release the lock when done
    await releaseJobLock(jobId);
  }
}

/**
 * Check if a cached result exists for the transformation
 *
 * This is used before creating a job to see if we can return immediately.
 *
 * @param url - URL or text identifier
 * @param persona - Persona ID
 * @returns Cached transformation result or null
 */
export function getCachedResult(
  url: string,
  persona: string,
): TransformationResult | null {
  return cacheService.getCachedTransformation(url, persona);
}
