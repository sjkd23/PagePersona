/**
 * Persona Definitions and Management
 *
 * This module contains the authoritative collection of all available personas
 * in the application. Each persona defines a unique writing style, tone, and
 * personality that can be used to transform content.
 *
 * The personas are defined as FullPersona objects containing both UI elements
 * (for client display) and AI instructions (for server-side transformation).
 * Utility functions are provided to extract specific views (client/server) as needed.
 *
 * @module PersonaConstants
 */
import type { FullPersona, ServerPersona, ClientPersona } from '../types/personas';
/**
 * Complete persona definitions containing both UI and AI transformation data.
 * This is the single source of truth for all persona information in the application.
 *
 * Each persona includes:
 * - Basic identification (id, name, description)
 * - UI presentation data (label, examples, avatar, theme colors)
 * - AI transformation instructions (tone modifier, system prompt)
 */
export declare const FULL_PERSONAS: Record<string, FullPersona>;
/**
 * Server-optimized persona collection containing only AI transformation fields.
 * Used by backend services that need persona prompts and tone modifiers
 * without UI-specific data like themes and avatars.
 */
export declare const PERSONAS: Record<string, ServerPersona>;
/**
 * Client-optimized persona collection containing only UI rendering fields.
 * Used by frontend components that need display data like themes, avatars,
 * and example texts without exposing AI prompts.
 */
export declare const CLIENT_PERSONAS: Record<string, ClientPersona>;
/**
 * Retrieves a server persona by ID for backend transformation operations.
 * Returns undefined if the persona does not exist.
 *
 * @param id - The unique persona identifier
 * @returns Server persona with AI prompts, or undefined if not found
 */
export declare function getPersona(id: string): ServerPersona | undefined;
/**
 * Gets all available server personas for backend operations.
 *
 * @returns Array of all server personas with AI transformation data
 */
export declare function getAllPersonas(): ServerPersona[];
/**
 * Retrieves a client persona by ID for frontend display purposes.
 * Returns undefined if the persona does not exist.
 *
 * @param id - The unique persona identifier
 * @returns Client persona with UI data, or undefined if not found
 */
export declare function getClientPersona(id: string): ClientPersona | undefined;
/**
 * Gets all available client personas for frontend components.
 *
 * @returns Array of all client personas with UI display data
 */
export declare function getAllClientPersonas(): ClientPersona[];
/**
 * Retrieves a complete persona by ID with both UI and AI fields.
 * Used primarily for data transformation and administrative purposes.
 *
 * @param id - The unique persona identifier
 * @returns Full persona with all data, or undefined if not found
 */
export declare function getFullPersona(id: string): FullPersona | undefined;
/**
 * Gets all available personas with complete data sets.
 *
 * @returns Array of all personas with both UI and AI data
 */
export declare function getAllFullPersonas(): FullPersona[];
//# sourceMappingURL=personas.d.ts.map
