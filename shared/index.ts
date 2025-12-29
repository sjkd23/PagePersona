/**
 * Main export file for shared types and constants
 */

// Re-export all types (type-only to avoid runtime imports)
export type * from "./types/index.js";

// Re-export all constants (runtime values) - explicit imports to avoid directory imports
export { BASE_SYSTEM_PROMPT } from "./constants/prompts.js";
export {
  PERSONAS,
  CLIENT_PERSONAS,
  FULL_PERSONAS,
  getPersona,
  getAllPersonas,
  getClientPersona,
  getAllClientPersonas,
  getFullPersona,
  getAllFullPersonas,
} from "./constants/personas.js";

// Re-export error types (mixed - need to handle separately)
export type { UserFriendlyError } from "./types/errors.js";
export { ErrorCode, ERROR_MESSAGES, ErrorMapper } from "./types/errors.js";
