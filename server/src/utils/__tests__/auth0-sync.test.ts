import { describe, it, expect, beforeEach, vi } from "vitest";
import { syncAuth0Fields, logSyncResults } from "../auth0-sync";
import type { IMongoUser } from "../../models/mongo-user";
import type { ProcessedAuth0User, SyncResult } from "../../types/common";

// Mock console.log
const mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

describe("auth0-sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConsoleLog.mockClear();
  });

  const createMockMongoUser = (
    overrides: Partial<IMongoUser> = {},
  ): IMongoUser =>
    ({
      _id: "mongo-id",
      auth0Id: "auth0|123",
      email: "test@example.com",
      username: "testuser",
      firstName: "Test",
      lastName: "User",
      avatar: "old-avatar.png",
      isEmailVerified: false,
      role: "user",
      preferences: {
        theme: "light",
        language: "en",
        notifications: true,
      },
      usage: {
        dailyRequests: 0,
        monthlyRequests: 0,
        totalRequests: 0,
      },
      createdAt: new Date("2023-01-01"),
      updatedAt: new Date("2023-01-01"),
      lastLoginAt: new Date("2023-01-01"),
      save: vi.fn().mockResolvedValue(true),
      toObject: vi.fn(),
      ...overrides,
    }) as any;

  const createMockAuth0User = (
    overrides: Partial<ProcessedAuth0User> = {},
  ): ProcessedAuth0User => ({
    id: "auth0|123",
    email: "new@example.com",
    givenName: "NewFirst",
    familyName: "NewLast",
    picture: "new-avatar.png",
    emailVerified: true,
    ...overrides,
  });

  describe("syncAuth0Fields", () => {
    it("should sync all changed fields", () => {
      const mongoUser = createMockMongoUser();
      const auth0User = createMockAuth0User();

      const result = syncAuth0Fields(mongoUser, auth0User);

      expect(result.updated).toBe(true);
      expect(result.changedFields).toHaveLength(5);
      expect(result.changedFields).toContain(
        "email (test@example.com → new@example.com)",
      );
      expect(result.changedFields).toContain("firstName (Test → NewFirst)");
      expect(result.changedFields).toContain("lastName (User → NewLast)");
      expect(result.changedFields).toContain(
        "avatar (old-avatar.png → new-avatar.png)",
      );
      expect(result.changedFields).toContain("isEmailVerified (false → true)");
      expect(result.errors).toEqual([]);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it("should not sync fields when values are the same", () => {
      const mongoUser = createMockMongoUser({
        email: "same@example.com",
        firstName: "Same",
        lastName: "User",
        avatar: "same-avatar.png",
        isEmailVerified: true,
      });
      const auth0User = createMockAuth0User({
        email: "same@example.com",
        givenName: "Same",
        familyName: "User",
        picture: "same-avatar.png",
        emailVerified: true,
      });

      const result = syncAuth0Fields(mongoUser, auth0User);

      expect(result.updated).toBe(true); // Still true because lastLoginAt is updated
      expect(result.changedFields).toEqual([]);
      expect(result.errors).toEqual([]);
    });

    it("should handle empty/null auth0 values", () => {
      const mongoUser = createMockMongoUser();
      const auth0User = createMockAuth0User({
        email: "",
        givenName: "",
        familyName: "",
        picture: "",
        emailVerified: undefined,
      });

      const result = syncAuth0Fields(mongoUser, auth0User);

      expect(result.updated).toBe(true); // lastLoginAt is still updated
      expect(result.changedFields).toEqual([]);
      expect(result.errors).toEqual([]);
    });

    it("should handle null/undefined mongo values", () => {
      const mongoUser = createMockMongoUser({
        email: undefined as any,
        firstName: undefined as any,
        lastName: undefined as any,
        avatar: undefined as any,
        isEmailVerified: undefined as any,
      });
      const auth0User = createMockAuth0User();

      const result = syncAuth0Fields(mongoUser, auth0User);

      expect(result.updated).toBe(true);
      expect(result.changedFields).toHaveLength(5);
      expect(result.errors).toEqual([]);
    });

    it("should always update lastLoginAt", () => {
      const originalDate = new Date("2023-01-01");
      const mongoUser = createMockMongoUser({
        lastLoginAt: originalDate,
      });
      const auth0User = createMockAuth0User({
        email: mongoUser.email, // Same values to avoid field changes
        givenName: mongoUser.firstName,
        familyName: mongoUser.lastName,
        picture: mongoUser.avatar,
        emailVerified: mongoUser.isEmailVerified,
      });

      const result = syncAuth0Fields(mongoUser, auth0User);

      expect(result.updated).toBe(true);
      expect(mongoUser.lastLoginAt).toBeDefined();
      expect(
        mongoUser.lastLoginAt && mongoUser.lastLoginAt.getTime(),
      ).toBeGreaterThan(originalDate.getTime());
    });

    it("should handle emailVerified boolean conversion", () => {
      const mongoUser = createMockMongoUser({
        isEmailVerified: false,
      });
      const auth0User = createMockAuth0User({
        emailVerified: "true" as any, // String that should be converted to boolean
      });

      const result = syncAuth0Fields(mongoUser, auth0User);

      expect(mongoUser.isEmailVerified).toBe(true);
      expect(result.changedFields).toContain("isEmailVerified (false → true)");
    });

    it("should handle falsy values for emailVerified", () => {
      const mongoUser = createMockMongoUser({
        isEmailVerified: true,
      });
      const auth0User = createMockAuth0User({
        emailVerified: 0 as any, // Falsy value
      });

      const result = syncAuth0Fields(mongoUser, auth0User);

      expect(mongoUser.isEmailVerified).toBe(false);
      expect(result.changedFields).toContain("isEmailVerified (true → false)");
    });

    it("should capture and continue on field sync errors", () => {
      const mongoUser = createMockMongoUser();
      const auth0User = createMockAuth0User();

      // Mock a field that will cause an error
      Object.defineProperty(mongoUser, "email", {
        set: () => {
          throw new Error("Database write error");
        },
        get: () => "test@example.com",
        configurable: true,
      });

      const result = syncAuth0Fields(mongoUser, auth0User);

      expect(result.updated).toBe(true); // Still updated due to lastLoginAt
      expect(result.errors).toContain(
        "Failed to sync field email: Database write error",
      );
      expect(result.changedFields.length).toBeGreaterThan(0); // Other fields should still sync
    });
  });

  describe("logSyncResults", () => {
    it("should log changed fields", () => {
      const result: SyncResult = {
        updated: true,
        changedFields: ["email (old → new)", "firstName (old → new)"],
        errors: [],
        timestamp: new Date(),
      };

      logSyncResults("user-123", result);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        "🔄 User user-123 - Fields updated:",
        ["email (old → new)", "firstName (old → new)"],
      );
    });

    it("should log sync errors", () => {
      const result: SyncResult = {
        updated: false,
        changedFields: [],
        errors: ["Error 1", "Error 2"],
        timestamp: new Date(),
      };

      logSyncResults("user-123", result);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        "⚠️  User user-123 - Sync errors:",
        ["Error 1", "Error 2"],
      );
    });

    it("should log no changes needed", () => {
      const result: SyncResult = {
        updated: true,
        changedFields: [],
        errors: [],
        timestamp: new Date(),
      };

      logSyncResults("user-123", result);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        "✅ User user-123 - No changes needed (lastLoginAt updated)",
      );
    });

    it("should handle undefined errors array", () => {
      const result: SyncResult = {
        updated: true,
        changedFields: [],
        errors: undefined,
        timestamp: new Date(),
      };

      expect(() => logSyncResults("user-123", result)).not.toThrow();
      expect(mockConsoleLog).toHaveBeenCalledWith(
        "✅ User user-123 - No changes needed (lastLoginAt updated)",
      );
    });

    it("should log both changes and errors", () => {
      const result: SyncResult = {
        updated: true,
        changedFields: ["field1 (old → new)"],
        errors: ["Some error"],
        timestamp: new Date(),
      };

      logSyncResults("user-123", result);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        "🔄 User user-123 - Fields updated:",
        ["field1 (old → new)"],
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        "⚠️  User user-123 - Sync errors:",
        ["Some error"],
      );
    });
  });
});
