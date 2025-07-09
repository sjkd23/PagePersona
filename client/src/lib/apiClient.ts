/**
 * Unified API Client for PagePersonAI
 * 
 * This module consolidates all API communication functionality including:
 * - Auth0 authenticated requests
 * - General-purpose HTTP methods
 * - Specific business logic endpoints
 * - Consistent error handling and response formatting
 */

import type { ApiResponse } from '../types/api-response.js';
import type { ClientPersona } from '../types/personas';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Global token getter function - will be set by Auth0 provider
let getAccessTokenFunction: (() => Promise<string | undefined>) | null = null;

export function setTokenGetter(tokenGetter: () => Promise<string | undefined>) {
  getAccessTokenFunction = tokenGetter;
}

// Type definitions
export interface TransformRequest {
  url: string;
  persona: string;
}

export interface TransformResponse {
  success: boolean;
  originalContent: {
    title: string;
    content: string;
    url: string;
    wordCount: number;
  };
  transformedContent: string;
  persona: {
    id: string;
    name: string;
    description: string;
  };
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error?: string;
}

export interface PersonaResponse {
  success: boolean;
  data?: {
    personas: ClientPersona[];
  };
  error?: string;
}

export interface UserProfile {
  id: string;
  auth0Id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isEmailVerified: boolean;
  role: string;
  membership: 'free' | 'premium' | 'admin';
  preferences: {
    theme: 'light' | 'dark';
    language: string;
    notifications: boolean;
  };
  usage: {
    totalTransformations: number;
    monthlyUsage: number;
    lastTransformation?: string;
    usageResetDate: string;
  };
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface UserProfileResponse {
  success: boolean;
  data: UserProfile;
}

export interface UsageStatsResponse {
  success: boolean;
  data: {
    totalTransformations: number;
    monthlyUsage: number;
    lastTransformation?: string;
    usageResetDate: string;
  };
}

export interface TransformTextRequest {
  text: string;
  persona: string;
}

/**
 * Core HTTP client for making authenticated requests
 */
class HttpClient {
  private async getHeaders(customHeaders?: HeadersInit): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(customHeaders as Record<string, string> || {}),
    };

    // Add Auth0 token if available
    if (getAccessTokenFunction) {
      try {
        const token = await getAccessTokenFunction();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (error) {
        console.warn('Failed to get Auth0 token:', error);
      }
    }

    return headers;
  }

  async request<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: await this.getHeaders(options.headers),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async get<T = unknown>(endpoint: string, customHeaders?: HeadersInit): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: await this.getHeaders(customHeaders),
      });

      const data = await response.json();
      return {
        success: response.ok,
        data: response.ok ? data : undefined,
        error: response.ok ? undefined : (data.error || 'Request failed'),
        message: data.message
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  async post<T = unknown>(endpoint: string, body?: unknown, customHeaders?: HeadersInit): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: await this.getHeaders(customHeaders),
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();
      return {
        success: response.ok,
        data: response.ok ? data : undefined,
        error: response.ok ? undefined : (data.error || 'Request failed'),
        message: data.message
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  async put<T = unknown>(endpoint: string, body?: unknown, customHeaders?: HeadersInit): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: await this.getHeaders(customHeaders),
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();
      return {
        success: response.ok,
        data: response.ok ? data : undefined,
        error: response.ok ? undefined : (data.error || 'Request failed'),
        message: data.message
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  async delete<T = unknown>(endpoint: string, customHeaders?: HeadersInit): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: await this.getHeaders(customHeaders),
      });

      const data = await response.json();
      return {
        success: response.ok,
        data: response.ok ? data : undefined,
        error: response.ok ? undefined : (data.error || 'Request failed'),
        message: data.message
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }
}

/**
 * Unified API Client with organized endpoints
 */
class ApiClient {
  public http = new HttpClient();

  // Transform-related methods
  transform = {
    webpage: async (request: TransformRequest): Promise<TransformResponse> => {
      return this.http.request<TransformResponse>('/transform', {
        method: 'POST',
        body: JSON.stringify(request),
      });
    },

    text: async (request: TransformTextRequest): Promise<TransformResponse> => {
      return this.http.request<TransformResponse>('/transform/text', {
        method: 'POST',
        body: JSON.stringify(request),
      });
    },

    personas: async (): Promise<PersonaResponse> => {
      return this.http.request<PersonaResponse>('/transform/personas');
    }
  };

  // User-related methods
  user = {
    profile: async (): Promise<UserProfileResponse> => {
      return this.http.request<UserProfileResponse>('/user/profile');
    },

    updateProfile: async (updates: Partial<UserProfile>): Promise<UserProfileResponse> => {
      return this.http.request<UserProfileResponse>('/user/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },

    usage: async (): Promise<UsageStatsResponse> => {
      return this.http.request<UsageStatsResponse>('/user/usage');
    }
  };

  // Auth-related methods
  auth = {
    user: async (): Promise<ApiResponse> => {
      return this.http.get('/auth/user');
    },

    protected: async (): Promise<ApiResponse> => {
      return this.http.get('/protected');
    }
  };

  // General utility methods
  general = {
    healthCheck: async (): Promise<{ status: string }> => {
      return this.http.request<{ status: string }>('/health');
    }
  };

  // Legacy compatibility methods (for backward compatibility during migration)
  async transformWebpage(request: TransformRequest): Promise<TransformResponse> {
    return this.transform.webpage(request);
  }

  async getPersonas(): Promise<PersonaResponse> {
    return this.transform.personas();
  }

  async getUserProfile(): Promise<UserProfileResponse> {
    return this.user.profile();
  }

  async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfileResponse> {
    return this.user.updateProfile(updates);
  }

  async getUserUsageStats(): Promise<UsageStatsResponse> {
    return this.user.usage();
  }

  async transformText(request: TransformTextRequest): Promise<TransformResponse> {
    return this.transform.text(request);
  }

  async healthCheck(): Promise<{ status: string }> {
    return this.general.healthCheck();
  }
}

// Create singleton instance
const apiClient = new ApiClient();

// Export both the instance and class for flexibility
export { ApiClient };
export default apiClient;

// Legacy exports for backward compatibility during migration
export const ApiService = apiClient;

// Legacy function exports from auth0Api.ts
export const transformContent = async (
  url: string, 
  persona: string,
  getAccessToken?: () => Promise<string | undefined>
): Promise<ApiResponse> => {
  if (getAccessToken) {
    const originalGetter = getAccessTokenFunction;
    setTokenGetter(getAccessToken);
    const result = await apiClient.http.post('/transform', { url, persona });
    if (originalGetter) {
      setTokenGetter(originalGetter);
    }
    return result;
  }
  return apiClient.http.post('/transform', { url, persona });
};

export const getPersonas = async (): Promise<ApiResponse> => {
  return apiClient.http.get('/transform/personas');
};

export const getProtectedData = async (
  getAccessToken: () => Promise<string | undefined>
): Promise<ApiResponse> => {
  const originalGetter = getAccessTokenFunction;
  setTokenGetter(getAccessToken);
  const result = await apiClient.http.get('/protected');
  if (originalGetter) {
    setTokenGetter(originalGetter);
  }
  return result;
};

export const getUserProfile = async (
  getAccessToken: () => Promise<string | undefined>
): Promise<ApiResponse> => {
  const originalGetter = getAccessTokenFunction;
  setTokenGetter(getAccessToken);
  const result = await apiClient.http.get('/auth/user');
  if (originalGetter) {
    setTokenGetter(originalGetter);
  }
  return result;
};
