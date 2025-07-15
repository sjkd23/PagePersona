/**
 * Persona Type Definitions
 *
 * Defines the type hierarchy for persona objects used throughout the application.
 * Personas represent different writing styles and tones that can transform content.
 *
 * The type system separates concerns between client-side UI display and server-side
 * AI transformation functionality while maintaining type safety across boundaries.
 */

/**
 * Core persona properties shared across all persona variants.
 * Contains the minimal identifying information for any persona.
 */
export interface BasePersona {
  /** Unique identifier for the persona */
  id: string;
  /** Display name shown to users */
  name: string;
  /** Brief description of the persona's characteristics */
  description: string;
}

/**
 * Complete persona definition containing both UI and AI transformation fields.
 * This is the authoritative source of truth for persona data, typically used
 * in the shared constants and during data transformation between client/server variants.
 */
export interface FullPersona extends BasePersona {
  // UI-specific fields for client-side rendering
  /** User-friendly label for UI components */
  label: string;
  /** Sample texts demonstrating the persona's style */
  exampleTexts: string[];
  /** Path to the persona's avatar image */
  avatarUrl: string;
  /** Color theme for UI theming */
  theme: {
    /** Primary brand color */
    primary: string;
    /** Secondary accent color */
    secondary: string;
    /** Highlight/accent color */
    accent: string;
  };

  // AI-specific fields for server-side transformation
  /** Tone modification instructions for AI model */
  toneModifier: string;
  /** Complete system prompt template for AI transformations */
  systemPrompt: string;
}

/**
 * Server-optimized persona containing only AI transformation fields.
 * Used in backend services for content transformation and AI interactions.
 * Excludes UI-specific data to reduce payload size and maintain separation of concerns.
 */
export interface ServerPersona extends BasePersona {
  /** Instructions for modifying the tone and style */
  toneModifier: string;
  /** System prompt template for AI model instructions */
  systemPrompt: string;
}

/**
 * Client-optimized persona containing only UI rendering fields.
 * Used in frontend components for display, theming, and user interaction.
 * Excludes AI prompts and transformation logic for security and payload optimization.
 */
export interface ClientPersona extends BasePersona {
  /** Display label for UI components */
  label: string;
  /** Example texts showing the persona's writing style */
  exampleTexts: string[];
  /** Avatar image path for visual representation */
  avatarUrl: string;
  /** Theme colors for dynamic UI styling */
  theme: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

/**
 * Legacy type alias for backward compatibility.
 * Defaults to ServerPersona for existing code that expects transformation capabilities.
 * @deprecated Use ServerPersona or ClientPersona explicitly for better type safety
 */
export type Persona = ServerPersona;

/**
 * Request payload for content transformation operations.
 * Defines the parameters needed to transform webpage content using a specific persona.
 */
export interface TransformRequest {
  /** URL of the webpage to transform */
  url: string;
  /** ID of the persona to use for transformation */
  persona: string;
}

/**
 * Response structure for transformation operations.
 * Contains both the original content and the AI-transformed result.
 */
export interface TransformResponse {
  /** Indicates if the transformation was successful */
  success: boolean;
  /** Original webpage content before transformation */
  originalContent: {
    /** Page title */
    title: string;
    /** Main content text */
    content: string;
    /** Source URL */
    url: string;
  };
  /** AI-transformed content in the requested persona style */
  transformedContent: string;
  /** Error message if transformation failed */
  error?: string;
}

/**
 * Base structure for webpage content objects.
 * Contains the essential fields shared across all webpage content representations.
 */
export interface BaseWebpageContent {
  /** Original URL of the source webpage */
  originalUrl: string;
  /** Original title of the webpage */
  originalTitle: string;
  /** Original text content before transformation */
  originalContent: string;
  /** AI-transformed content in persona style */
  transformedContent: string;
  /** Timestamp when the transformation was performed */
  timestamp: Date;
}

/**
 * Server-side webpage content object with server persona reference.
 * Used in backend operations where AI transformation details are available.
 */
export interface ServerWebpageContent extends BaseWebpageContent {
  /** Persona used for transformation, including AI prompts */
  persona: ServerPersona;
}

/**
 * Client-side webpage content object with client persona reference.
 * Used in frontend components where only UI-relevant persona data is needed.
 */
export interface ClientWebpageContent extends BaseWebpageContent {
  /** Persona used for transformation, UI fields only */
  persona: ClientPersona;
}

/**
 * Default webpage content type for UI components.
 * Aliases to ClientWebpageContent to ensure UI-safe data handling.
 */
export type WebpageContent = ClientWebpageContent;
