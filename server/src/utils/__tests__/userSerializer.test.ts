import { describe, it, expect, vi } from "vitest";
import {
  serializeMongoUser,
  serializeUserUsage,
  serializeUserSummary,
  createSuccessResponse,
  createErrorResponse,
} from "../userSerializer";
import type { IMongoUser } from "../../models/mongo-user";

// Mock auth0-claims
vi.mock("../auth0-claims", () => ({
  safeGetAuth0Claims: vi.fn(() => ({})),
  safeGetEmail: vi.fn((user) => user?.email || "test@example.com"),
  safeGetDisplayName: vi.fn((user) => user?.name || "Test User"),
}));

const createMockUser = (overrides: Partial<IMongoUser> = {}): IMongoUser =>
  ({
    _id: "user123",
    auth0Id: "auth0|123",
    email: "test@example.com",
    username: "testuser",
    firstName: "John",
    lastName: "Doe",
    avatar: "https://example.com/avatar.jpg",
    isEmailVerified: true,
    role: "user",
    membership: "free",
    preferences: {
      theme: "light",
      language: "en",
      notifications: true,
    },
    usage: {
      totalTransformations: 10,
      monthlyUsage: 5,
      usageResetDate: new Date("2024-01-01"),
      lastTransformation: new Date("2024-01-15"),
    },
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2024-01-01"),
    lastLoginAt: new Date("2024-01-15"),
    incrementUsage: vi.fn(),
    incrementFailedAttempt: vi.fn(),
    resetMonthlyUsage: vi.fn(),
    checkUsageLimit: vi.fn(),
    ...overrides,
  }) as IMongoUser;

describe("utils/userSerializer", () => {
  describe("serializeMongoUser", () => {
    it("should serialize a complete user", () => {
      const mockUser = createMockUser();
      const result = serializeMongoUser(mockUser);

      expect(result).toEqual({
        id: "user123",
        auth0Id: "auth0|123",
        email: "test@example.com",
        username: "testuser",
        firstName: "John",
        lastName: "Doe",
        avatar: "https://example.com/avatar.jpg",
        isEmailVerified: true,
        role: "user",
        membership: "free",
        preferences: {
          theme: "light",
          language: "en",
          notifications: true,
        },
        usage: {
          totalTransformations: 10,
          monthlyUsage: 5,
          lastTransformation: "2024-01-15T00:00:00.000Z",
          usageResetDate: "2024-01-01T00:00:00.000Z",
        },
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
        lastLoginAt: "2024-01-15T00:00:00.000Z",
      });
    });

    it("should handle user with missing optional fields", () => {
      const mockUser = createMockUser({
        firstName: undefined,
        lastName: undefined,
        avatar: undefined,
        lastLoginAt: undefined,
        usage: {
          totalTransformations: 0,
          monthlyUsage: 0,
          usageResetDate: new Date("2024-01-01"),
        },
      });

      const result = serializeMongoUser(mockUser);

      expect(result.firstName).toBeUndefined();
      expect(result.lastName).toBeUndefined();
      expect(result.avatar).toBeUndefined();
      expect(result.lastLoginAt).toBeUndefined();
      expect(result.usage.lastTransformation).toBeUndefined();
    });
  });

  describe("serializeUserUsage", () => {
    it("should extract only usage statistics", () => {
      const mockUser = createMockUser();
      const result = serializeUserUsage(mockUser);

      expect(result).toEqual({
        totalTransformations: 10,
        monthlyUsage: 5,
        lastTransformation: "2024-01-15T00:00:00.000Z",
        usageResetDate: "2024-01-01T00:00:00.000Z",
      });
    });

    it("should handle user with no last transformation", () => {
      const mockUser = createMockUser({
        usage: {
          totalTransformations: 0,
          monthlyUsage: 0,
          usageResetDate: new Date("2024-01-01"),
        },
      });

      const result = serializeUserUsage(mockUser);

      expect(result.totalTransformations).toBe(0);
      expect(result.monthlyUsage).toBe(0);
      expect(result.lastTransformation).toBeUndefined();
    });
  });

  describe("serializeUserSummary", () => {
    it("should create a user summary", () => {
      const mockUser = createMockUser();
      const result = serializeUserSummary(mockUser);

      expect(result).toEqual({
        id: "user123",
        email: "test@example.com",
        username: "testuser",
        displayName: "John Doe",
        avatar: "https://example.com/avatar.jpg",
        role: "user",
        membership: "free",
        memberSince: "2023-01-01T00:00:00.000Z",
        lastActive: "2024-01-15T00:00:00.000Z",
        totalTransformations: 10,
        monthlyUsage: 5,
        isEmailVerified: true,
      });
    });

    it("should handle user with missing name fields", () => {
      const mockUser = createMockUser({
        firstName: undefined,
        lastName: undefined,
        username: "fallbackuser",
      });

      const result = serializeUserSummary(mockUser);

      expect(result.displayName).toBe("fallbackuser");
    });

    it("should handle user with partial name", () => {
      const mockUser = createMockUser({
        firstName: "John",
        lastName: undefined,
        username: "john123",
      });

      const result = serializeUserSummary(mockUser);

      expect(result.displayName).toBe("john123");
    });

    it("should fallback to email when no username", () => {
      const mockUser = createMockUser({
        firstName: undefined,
        lastName: undefined,
        username: undefined,
        email: "test@example.com",
      });

      const result = serializeUserSummary(mockUser);

      expect(result.displayName).toBe("test");
    });
  });

  describe("response helpers", () => {
    it("should create success response", () => {
      const data = { test: "value" };
      const result = createSuccessResponse(data);

      expect(result).toEqual({
        success: true,
        data: { test: "value" },
      });
    });

    it("should create success response with message", () => {
      const data = { test: "value" };
      const message = "Operation successful";
      const result = createSuccessResponse(data, message);

      expect(result).toEqual({
        success: true,
        message: "Operation successful",
        data: { test: "value" },
      });
    });

    it("should create error response", () => {
      const error = "Something went wrong";
      const result = createErrorResponse(error);

      expect(result).toEqual({
        success: false,
        error: "Something went wrong",
      });
    });

    it("should create error response with status code", () => {
      const error = "Validation failed";
      const statusCode = 400;
      const result = createErrorResponse(error, statusCode);

      expect(result).toEqual({
        success: false,
        error: "Validation failed",
        statusCode: 400,
      });
    });
  });
});
