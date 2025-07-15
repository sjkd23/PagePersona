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
} from './personas';

// API types
export type { ApiResponse, ApiError, LoadingState } from './api';

// User types
export type { User, UserProfile, ChatMessage, ConversationHistory } from './user';

// Error types
export { ErrorCode, ERROR_MESSAGES, ErrorMapper } from './errors';
export type { UserFriendlyError } from './errors';
