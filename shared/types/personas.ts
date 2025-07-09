/**
 * Shared Persona types used across client and server
 */

// Base persona interface with core shared fields
export interface BasePersona {
  id: string
  name: string
  description: string
}

// Complete persona with both UI and AI fields
export interface FullPersona extends BasePersona {
  // UI fields (for client)
  label: string
  exampleTexts: string[]
  avatarUrl: string
  theme: {
    primary: string
    secondary: string
    accent: string
  }
  
  // AI fields (for server)
  toneModifier: string
  systemPrompt: string
}

// Server-side persona with AI/transformation specific fields
export interface ServerPersona extends BasePersona {
  toneModifier: string
  systemPrompt: string
}

// Client-side persona with UI specific fields
export interface ClientPersona extends BasePersona {
  label: string
  exampleTexts: string[]
  avatarUrl: string
  theme: {
    primary: string
    secondary: string
    accent: string
  }
}

// Legacy alias for backward compatibility
export type Persona = ServerPersona

export interface TransformRequest {
  url: string
  persona: string
}

export interface TransformResponse {
  success: boolean
  originalContent: {
    title: string
    content: string
    url: string
  }
  transformedContent: string
  error?: string
}

// Base interface for webpage content
export interface BaseWebpageContent {
  originalUrl: string
  originalTitle: string
  originalContent: string
  transformedContent: string
  timestamp: Date
}

// Server-side webpage content with ServerPersona
export interface ServerWebpageContent extends BaseWebpageContent {
  persona: ServerPersona
}

// Client-side webpage content with ClientPersona  
export interface ClientWebpageContent extends BaseWebpageContent {
  persona: ClientPersona
}

// Legacy alias - defaults to client version for UI compatibility
export type WebpageContent = ClientWebpageContent
