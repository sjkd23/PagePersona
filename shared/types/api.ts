/**
 * Canonical ApiResponse interface for consistent API responses across the application
 *
 * This interface ensures all API endpoints return the same response format:
 * - success: boolean indicating if the operation was successful
 * - data: optional generic data payload
 * - message: optional success or informational message
 * - error: optional error message when success is false
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}
