/**
 * Type checking utilities for the PagePersonAI server
 *
 * This file provides runtime type checking and validation utilities
 * to ensure type safety throughout the application.
 */

import { Request } from 'express';
import type { AuthenticatedUserContext } from '../types/common';
import type { IMongoUser } from '../models/mongo-user';

/**
 * Type guard to check if a request has a valid user context
 */
export function hasUserContext(
  req: Request,
): req is Request & { userContext: NonNullable<Request['userContext']> } {
  return req.userContext !== undefined && req.userContext !== null;
}

/**
 * Type guard to check if a request has Auth0 authentication
 */
export function hasAuth0User(
  req: Request,
): req is Request & { auth: NonNullable<Request['auth']> } {
  return req.auth !== undefined && req.auth !== null;
}

/**
 * Type guard to check if a request has a MongoDB user
 */
export function hasMongoUser(
  req: Request,
): req is Request & { mongoUser: NonNullable<Request['mongoUser']> } {
  return req.mongoUser !== undefined && req.mongoUser !== null;
}

/**
 * Runtime assertion for user context
 */
export function assertUserContext(req: Request): asserts req is Request & {
  userContext: NonNullable<Request['userContext']>;
} {
  if (!hasUserContext(req)) {
    throw new Error('User context is required but not found in request');
  }
}

/**
 * Runtime assertion for Auth0 user
 */
export function assertAuth0User(
  req: Request,
): asserts req is Request & { auth: NonNullable<Request['auth']> } {
  if (!hasAuth0User(req)) {
    throw new Error('Auth0 user is required but not found in request');
  }
}

/**
 * Runtime assertion for MongoDB user
 */
export function assertMongoUser(
  req: Request,
): asserts req is Request & { mongoUser: NonNullable<Request['mongoUser']> } {
  if (!hasMongoUser(req)) {
    throw new Error('MongoDB user is required but not found in request');
  }
}

/**
 * Safe accessor for user context with fallback
 */
export function getUserContext(
  req: Request,
  fallback: null = null,
): AuthenticatedUserContext | null {
  return req.userContext ?? fallback;
}

/**
 * Safe accessor for Auth0 user with fallback
 */
export function getAuth0User(req: Request, fallback: null = null): unknown | null {
  return req.auth ?? fallback;
}

/**
 * Safe accessor for MongoDB user with fallback
 */
export function getMongoUser(req: Request, fallback: null = null): IMongoUser | null {
  return req.mongoUser ?? fallback;
}
