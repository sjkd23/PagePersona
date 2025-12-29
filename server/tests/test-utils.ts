import { vi } from "vitest";

// Utility function to properly mock functions that should work with vi.mocked()
export function createMockFunction<
  T extends (...args: unknown[]) => unknown,
>() {
  return vi.fn() as unknown as T & {
    mockResolvedValue: (value: unknown) => unknown;
    mockRejectedValue: (value: unknown) => unknown;
    mockReturnValue: (value: unknown) => unknown;
    mockImplementation: (fn: unknown) => unknown;
    mockResolvedValueOnce: (value: unknown) => unknown;
  };
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
  };
}

// Create properly typed mocks for utility functions
export function createUtilityMocks() {
  return {
    serializeMongoUser: createMockFunction(),
    serializeUserUsage: createMockFunction(),
    serializeUserSummary: createMockFunction(),
    createSuccessResponse: createMockFunction(),
    createErrorResponse: createMockFunction(),
  };
}
