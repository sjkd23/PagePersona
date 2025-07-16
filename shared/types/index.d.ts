/**
 * Central export file for all shared types
 */
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
  WebpageContent,
} from './personas';
export type { ApiResponse, ApiError, LoadingState } from './api';
export type { User, UserProfile, ChatMessage, ConversationHistory } from './user';
export { ErrorCode, ERROR_MESSAGES, ErrorMapper } from './errors';
export type { UserFriendlyError } from './errors';
//# sourceMappingURL=index.d.ts.map
