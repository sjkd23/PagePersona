// Re-export shared persona types - this file is deprecated, use @shared/types/personas instead
export type { 
  BasePersona,
  ServerPersona,
  ClientPersona,
  TransformRequest,
  TransformResponse,
  WebpageContent
} from '@shared/types/personas'

import type { ClientPersona } from '@shared/types/personas'

// Legacy alias for existing client code
export type Persona = ClientPersona
