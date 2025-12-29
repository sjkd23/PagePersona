/**
 * Job Manager Service
 *
 * Manages background transformation jobs with Redis-based locking and status tracking.
 * Ensures that expensive operations (scraping + LLM) can run asynchronously while
 * preventing duplicate jobs for the same request parameters.
 *
 * Features:
 * - Deterministic job ID generation (hash of request params)
 * - Distributed locking with Redis SETNX
 * - Job status tracking (queued, running, done, error)
 * - Progress updates during transformation stages
 * - TTL-based job expiration
 */

import crypto from "crypto";
import redisClient from "../utils/redis-client";
import { logger } from "../utils/logger";

const JOB_TTL_SECONDS = Number(process.env.JOB_TTL_SECONDS) || 3600; // 1 hour
const JOB_LOCK_TTL_SECONDS = Number(process.env.JOB_LOCK_TTL_SECONDS) || 300; // 5 minutes

/**
 * Job status enum
 */
export type JobStatus = "queued" | "running" | "done" | "error";

/**
 * Job processing stage
 */
export type JobStage = "scrape" | "clean" | "llm" | "save";

/**
 * Job record structure stored in Redis
 */
export interface JobRecord {
  jobId: string;
  status: JobStatus;
  stage?: JobStage;
  progress?: number; // 0-100
  data?: unknown;
  error?: string;
  createdAt: string;
  updatedAt: string;
  cacheKey?: string; // For linking to cached result
}

/**
 * Generate deterministic job ID from request parameters
 *
 * Creates a consistent hash based on all transformation inputs so
 * that identical requests produce the same job ID, enabling deduplication.
 *
 * @param url - Source URL or text identifier
 * @param persona - Persona ID
 * @param options - Additional transformation options
 * @returns Deterministic job ID string
 */
export function generateJobId(
  url: string,
  persona: string,
  options?: Record<string, unknown>,
): string {
  const payload = JSON.stringify({
    url,
    persona,
    options: options || {},
  });
  return crypto
    .createHash("sha256")
    .update(payload)
    .digest("hex")
    .substring(0, 32);
}

/**
 * Get Redis key for job record
 */
function getJobKey(jobId: string): string {
  return `job:${jobId}`;
}

/**
 * Get Redis key for job lock
 */
function getJobLockKey(jobId: string): string {
  return `job:lock:${jobId}`;
}

/**
 * Attempt to acquire a distributed lock for job processing
 *
 * Uses Redis SETNX (SET if Not eXists) to implement a distributed lock
 * that prevents multiple workers from processing the same job.
 *
 * @param jobId - Job identifier to lock
 * @returns true if lock acquired, false otherwise
 */
export async function acquireJobLock(jobId: string): Promise<boolean> {
  const lockKey = getJobLockKey(jobId);
  try {
    // SETNX returns 1 if key was set (lock acquired), 0 if key already exists
    const result = await redisClient.set(lockKey, "locked", {
      EX: JOB_LOCK_TTL_SECONDS,
      NX: true,
    });
    const acquired = result === "OK";
    if (acquired) {
      logger.info("Job lock acquired", { jobId });
    } else {
      logger.info("Job lock already held by another worker", { jobId });
    }
    return acquired;
  } catch (error) {
    logger.error("Error acquiring job lock", { jobId, error });
    return false;
  }
}

/**
 * Release a job lock after processing completes
 *
 * @param jobId - Job identifier to unlock
 */
export async function releaseJobLock(jobId: string): Promise<void> {
  const lockKey = getJobLockKey(jobId);
  try {
    await redisClient.del(lockKey);
    logger.info("Job lock released", { jobId });
  } catch (error) {
    logger.error("Error releasing job lock", { jobId, error });
  }
}

/**
 * Create a new job record in Redis
 *
 * @param jobId - Unique job identifier
 * @param initialData - Initial job data (optional)
 * @returns Created job record
 */
export async function createJob(
  jobId: string,
  initialData?: Partial<JobRecord>,
): Promise<JobRecord> {
  const jobKey = getJobKey(jobId);
  const now = new Date().toISOString();

  const job: JobRecord = {
    jobId,
    status: "queued",
    createdAt: now,
    updatedAt: now,
    ...initialData,
  };

  try {
    await redisClient.setEx(jobKey, JOB_TTL_SECONDS, JSON.stringify(job));
    logger.info("Job created", { jobId, status: job.status });
    return job;
  } catch (error) {
    logger.error("Error creating job", { jobId, error });
    throw new Error("Failed to create job record");
  }
}

/**
 * Retrieve job record from Redis
 *
 * @param jobId - Job identifier
 * @returns Job record or null if not found
 */
export async function getJob(jobId: string): Promise<JobRecord | null> {
  const jobKey = getJobKey(jobId);
  try {
    const data = await redisClient.get(jobKey);
    if (!data) {
      return null;
    }
    return JSON.parse(data) as JobRecord;
  } catch (error) {
    logger.error("Error getting job", { jobId, error });
    return null;
  }
}

/**
 * Update job status and optional metadata
 *
 * @param jobId - Job identifier
 * @param updates - Partial job record updates
 */
export async function updateJob(
  jobId: string,
  updates: Partial<JobRecord>,
): Promise<void> {
  const jobKey = getJobKey(jobId);
  try {
    const existing = await getJob(jobId);
    if (!existing) {
      logger.warn("Cannot update non-existent job", { jobId });
      return;
    }

    const updated: JobRecord = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await redisClient.setEx(jobKey, JOB_TTL_SECONDS, JSON.stringify(updated));
    logger.info("Job updated", {
      jobId,
      status: updated.status,
      stage: updated.stage,
      progress: updated.progress,
    });
  } catch (error) {
    logger.error("Error updating job", { jobId, error });
  }
}

/**
 * Mark job as complete with result data
 *
 * @param jobId - Job identifier
 * @param data - Transformation result data
 * @param cacheKey - Optional cache key for linking
 */
export async function completeJob(
  jobId: string,
  data: unknown,
  cacheKey?: string,
): Promise<void> {
  await updateJob(jobId, {
    status: "done",
    data,
    progress: 100,
    cacheKey,
  });
}

/**
 * Mark job as failed with error message
 *
 * @param jobId - Job identifier
 * @param error - Error message or object
 */
export async function failJob(
  jobId: string,
  error: string | unknown,
): Promise<void> {
  const errorMessage =
    typeof error === "string"
      ? error
      : (error as Error).message || "Unknown error";
  await updateJob(jobId, {
    status: "error",
    error: errorMessage,
  });
}

/**
 * Update job progress during processing
 *
 * @param jobId - Job identifier
 * @param stage - Current processing stage
 * @param progress - Progress percentage (0-100)
 */
export async function updateJobProgress(
  jobId: string,
  stage: JobStage,
  progress: number,
): Promise<void> {
  await updateJob(jobId, {
    status: "running",
    stage,
    progress: Math.min(100, Math.max(0, progress)),
  });
}
