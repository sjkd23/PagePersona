import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import express from "express";

// Mock environment validation first
vi.mock("../../utils/env-validation", () => ({
  parsedEnv: {
    NODE_ENV: "test",
    AUTH0_DOMAIN: "test.auth0.com",
    AUTH0_AUDIENCE: "https://api.test.com",
    AUTH0_CLIENT_ID: "test-client-id",
    AUTH0_CLIENT_SECRET: "test-secret",
    AUTH0_ISSUER: "https://test.auth0.com/",
    JWT_SECRET: "test-jwt-secret",
    MONGODB_URI: "mongodb://localhost:27017/test",
    OPENAI_API_KEY: "sk-test-key",
    PORT: 5000,
  },
}));

// Mock dependencies
vi.mock("../../middleware/jwtAuth", () => ({
  default: vi.fn((req: any, res: any, next: any) => {
    req.user = { sub: "test-user-id", email: "test@example.com" };
    req.userContext = {
      mongoUser: {
        _id: "test-mongo-id",
        email: "test@example.com",
        name: "Test User",
      },
    };
    next();
  }),
}));

vi.mock("../../middleware/auth-middleware", () => ({
  authErrorHandler: vi.fn((err: any, req: any, res: any, next: any) => {
    if (err) {
      res.status(401).json({ error: "Unauthorized" });
    } else {
      next();
    }
  }),
}));

vi.mock("../../middleware/auth0-middleware", () => ({
  verifyAuth0Token: vi.fn((req: any, res: any, next: any) => {
    req.user = { sub: "test-user-id", email: "test@example.com" };
    next();
  }),
  syncAuth0User: vi.fn((req: any, res: any, next: any) => next()),
}));

vi.mock("../../utils/response-helpers", () => ({
  sendSuccess: vi.fn((res, data) =>
    res.status(200).json({ success: true, data }),
  ),
  sendError: vi.fn((res, error) =>
    res.status(500).json({ success: false, error }),
  ),
  sendNotFound: vi.fn((res, message) =>
    res.status(404).json({ success: false, message }),
  ),
  sendUnauthorized: vi.fn((res, message) =>
    res.status(401).json({ success: false, message }),
  ),
}));

vi.mock("../../utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../services/user-service", () => ({
  userService: {
    getUserProfile: vi.fn(),
    updateUserProfile: vi.fn(),
    getUserUsage: vi.fn(),
  },
}));

vi.mock("../../models/mongo-user", () => ({
  MongoUser: {
    findByAuth0Id: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  },
}));

vi.mock("../../config/rateLimiter", () => ({
  createRateLimiter: vi.fn(() => (req: any, res: any, next: any) => next()),
}));

vi.mock("../../middleware/validation", () => ({
  validateRequest: vi.fn(() => (req: any, res: any, next: any) => next()),
}));

vi.mock("../../middleware/zod-validation", () => ({
  validateRequest: vi.fn(() => (req: any, res: any, next: any) => next()),
  validateBody: vi.fn(() => (req: any, res: any, next: any) => next()),
}));

vi.mock("../../utils/userSerializer", () => ({
  serializeMongoUser: vi.fn((user: any) => user),
  serializeAuth0User: vi.fn((user: any) => user),
  normalizeUserContext: vi.fn((user: any) => user),
  serializeUserUsage: vi.fn((user: any) => user),
  serializeUserSummary: vi.fn((user: any) => user),
  createErrorResponse: vi.fn((error: string, statusCode?: number) => ({
    success: false,
    error,
    ...(statusCode && { statusCode }),
  })),
  createSuccessResponse: vi.fn((data: any, message?: string) => ({
    success: true,
    data,
    ...(message && { message }),
  })),
  serialize: vi.fn((user: any) => user),
  deserialize: vi.fn((data: any) => data),
}));

vi.mock("../../middleware/rate-limit", () => ({
  syncRateLimit: vi.fn((req: any, res: any, next: any) => next()),
  profileUpdateRateLimit: vi.fn((req: any, res: any, next: any) => next()),
}));

describe("User Route", () => {
  let app: express.Application;

  beforeEach(async () => {
    app = express();
    app.use(express.json());

    // Import route after mocks are set up
    const { default: userRoute } = await import("../user-route");
    app.use("/api/user", userRoute);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/user/profile", () => {
    it("should return user profile successfully", async () => {
      const mockUserService = await import("../../services/user-service");
      vi.mocked(mockUserService.userService.getUserProfile).mockResolvedValue({
        success: true,
        data: {
          _id: "test-id",
          email: "test@example.com",
          name: "Test User",
        },
      });

      const response = await request(app).get("/api/user/profile").expect(200);

      expect(response.body.success).toBe(true);
    });

    it("should handle user not found", async () => {
      const mockUserService = await import("../../services/user-service");
      vi.mocked(mockUserService.userService.getUserProfile).mockResolvedValue({
        success: false,
        error: "User not found",
      });

      await request(app).get("/api/user/profile").expect(404);
    });
  });

  describe("PUT /api/user/profile", () => {
    it("should update user profile successfully", async () => {
      const mockUserService = await import("../../services/user-service");
      vi.mocked(
        mockUserService.userService.updateUserProfile,
      ).mockResolvedValue({
        success: true,
        data: {
          _id: "test-id",
          email: "test@example.com",
          name: "Updated User",
        },
      });

      const updateData = { name: "Updated User" };

      const response = await request(app)
        .put("/api/user/profile")
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
    }, 15000); // Increase timeout

    it("should handle profile update errors", async () => {
      const mockUserService = await import("../../services/user-service");
      vi.mocked(
        mockUserService.userService.updateUserProfile,
      ).mockRejectedValue(new Error("Update failed"));

      const updateData = { name: "Updated User" };

      await request(app).put("/api/user/profile").send(updateData).expect(500);
    }, 15000); // Increase timeout
  });

  describe("GET /api/user/usage", () => {
    it("should return user usage stats successfully", async () => {
      const mockUserService = await import("../../services/user-service");
      vi.mocked(mockUserService.userService.getUserUsage).mockResolvedValue({
        success: true,
        data: {
          totalTransformations: 10,
          monthlyUsage: 5,
          lastTransformation: new Date(),
        },
      });

      const response = await request(app).get("/api/user/usage").expect(200);

      expect(response.body.success).toBe(true);
    });

    it("should handle usage stats errors", async () => {
      const mockUserService = await import("../../services/user-service");
      vi.mocked(mockUserService.userService.getUserUsage).mockRejectedValue(
        new Error("Usage fetch failed"),
      );

      await request(app).get("/api/user/usage").expect(500);
    });
  });
});
