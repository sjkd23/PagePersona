import { vi } from 'vitest'

// Utility function to properly mock functions that should work with vi.mocked()
export function createMockFunction<T extends (...args: any[]) => any>() {
  return vi.fn() as T & { 
    mockResolvedValue: (value: any) => any
    mockRejectedValue: (value: any) => any
    mockReturnValue: (value: any) => any
    mockImplementation: (fn: any) => any
    mockResolvedValueOnce: (value: any) => any
  }
}

// Create properly typed mocks for Mongoose models
export function createMockModel() {
  return {
    findById: createMockFunction(),
    findByAuth0Id: createMockFunction(),
    findByIdAndUpdate: createMockFunction(),
    incrementUsageById: createMockFunction(),
    incrementFailedAttemptById: createMockFunction(),
    bulkIncrementUsage: createMockFunction(),
    getUsageStats: createMockFunction(),
  }
}

// Create properly typed mocks for utility functions
export function createUtilityMocks() {
  return {
    serializeMongoUser: createMockFunction(),
    serializeUserUsage: createMockFunction(),
    serializeUserSummary: createMockFunction(),
    createSuccessResponse: createMockFunction(),
    createErrorResponse: createMockFunction(),
  }
}
