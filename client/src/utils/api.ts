const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Global token getter function - will be set by Auth0 provider
let getAccessTokenFunction: (() => Promise<string | undefined>) | null = null

export function setTokenGetter(tokenGetter: () => Promise<string | undefined>) {
  getAccessTokenFunction = tokenGetter
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
    wordCount: number
  }
  transformedContent: string
  persona: {
    id: string
    name: string
    description: string
  }
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  error?: string
}

export interface PersonaResponse {
  success: boolean
  personas: {
    id: string
    name: string
    description: string
  }[]
}

export interface UserProfile {
  id: string
  auth0Id: string
  email: string
  username?: string
  firstName?: string
  lastName?: string
  avatar?: string
  isEmailVerified: boolean
  role: string
  preferences: {
    theme: 'light' | 'dark'
    language: string
    notifications: boolean
  }
  usage: {
    totalTransformations: number
    monthlyUsage: number
    lastTransformation?: string
    usageResetDate: string
  }
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
}

export interface UserProfileResponse {
  success: boolean
  data: UserProfile
}

export interface UsageStatsResponse {
  success: boolean
  data: {
    totalTransformations: number
    monthlyUsage: number
    lastTransformation?: string
    usageResetDate: string
  }
}

export interface TransformTextRequest {
  text: string
  persona: string
}

export class ApiService {
  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    }

    // Add Auth0 token if available
    if (getAccessTokenFunction) {
      try {
        const token = await getAccessTokenFunction()
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }
      } catch (error) {
        console.warn('Failed to get Auth0 token:', error)
      }
    }
    
    const config: RequestInit = {
      headers,
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  static async transformWebpage(request: TransformRequest): Promise<TransformResponse> {
    return this.makeRequest<TransformResponse>('/transform', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  static async healthCheck(): Promise<{ status: string }> {
    return this.makeRequest<{ status: string }>('/health')
  }

  static async getPersonas(): Promise<PersonaResponse> {
    return this.makeRequest<PersonaResponse>('/transform/personas')
  }

  // User profile methods
  static async getUserProfile(): Promise<UserProfileResponse> {
    return this.makeRequest<UserProfileResponse>('/user/profile')
  }

  static async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfileResponse> {
    return this.makeRequest<UserProfileResponse>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  static async getUserUsageStats(): Promise<UsageStatsResponse> {
    return this.makeRequest<UsageStatsResponse>('/user/usage')
  }

  static async transformText(request: TransformTextRequest): Promise<TransformResponse> {
    return this.makeRequest<TransformResponse>('/transform/text', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }
}

export default ApiService
