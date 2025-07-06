export interface Persona {
  id: string
  name: string
  emoji: string
  description: string
  theme: {
    primary: string
    secondary: string
    accent: string
  }
}

export interface WebpageContent {
  originalUrl: string
  originalTitle: string
  originalContent: string
  transformedContent: string
  persona: Persona
  timestamp: Date
}

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
