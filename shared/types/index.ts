/**
 * Central export file for all shared types
 */

// Persona types
export type {
  BasePersona,
  ServerPersona,
  ClientPersona,
  FullPersona,
  Persona, // Legacy alias for ServerPersona
  TransformRequest,
  TransformResponse,
  BaseWebpageContent,
  ServerWebpageContent,
  ClientWebpageContent,
  WebpageContent, // Legacy alias for ClientWebpageContent
} from './personas.js';

// API types
export type { ApiResponse, ApiError, LoadingState } from './api.js';

// User types
export type { User, UserProfile, ChatMessage, ConversationHistory } from './user.js';

// Error types
export { ErrorCode, ERROR_MESSAGES, ErrorMapper } from './errors.js';
export type { UserFriendlyError } from './errors.js';
