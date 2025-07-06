// API utilities for Auth0 integration

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Create an API client that handles Auth0 tokens
export class ApiClient {
  private getAccessToken: (() => Promise<string | undefined>) | null = null;

  constructor(getAccessToken?: () => Promise<string | undefined>) {
    this.getAccessToken = getAccessToken || null;
  }

  private async getHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.getAccessToken) {
      try {
        const token = await this.getAccessToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (error) {
        console.warn('Failed to get access token:', error);
      }
    }

    return headers;
  }

  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: await this.getHeaders(),
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

  async post<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: await this.getHeaders(),
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

  async put<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: await this.getHeaders(),
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
}

// Specific API functions
export const transformContent = async (
  url: string, 
  persona: string,
  getAccessToken?: () => Promise<string | undefined>
): Promise<ApiResponse> => {
  const client = new ApiClient(getAccessToken);
  return client.post('/transform', { url, persona });
};

export const getPersonas = async (): Promise<ApiResponse> => {
  const client = new ApiClient();
  return client.get('/transform/personas');
};

export const getProtectedData = async (
  getAccessToken: () => Promise<string | undefined>
): Promise<ApiResponse> => {
  const client = new ApiClient(getAccessToken);
  return client.get('/protected');
};

export const getUserProfile = async (
  getAccessToken: () => Promise<string | undefined>
): Promise<ApiResponse> => {
  const client = new ApiClient(getAccessToken);
  return client.get('/auth/user');
};
