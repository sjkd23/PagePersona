/**
 * Global TypeScript declarations for the PagePersonAI server
 *
 * This file ensures Express module augmentation is loaded by ts-node
 */

// Import types to ensure they're loaded by TypeScript
import type {} from './express';
import type {} from './auth';
import type {} from './common';
import type {} from './user-types';

// Re-export for convenience
export type { UserContext, Auth0JwtPayload, ProcessedAuth0User } from './express';

export {};
