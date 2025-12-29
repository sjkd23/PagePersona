import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import express from "express";

// Mock all required dependencies before importing the route
vi.mock("../../../shared/constants/personas", () => ({
  getAllPersonas: vi
    .fn()
    .mockReturnValue([{ id: "professional", name: "Professional" }]),
  getAllClientPersonas: vi
    .fn()
    .mockReturnValue([{ id: "professional", name: "Professional" }]),
}));

vi.mock("../../middleware/jwtAuth", () => ({
  default: vi.fn((req: any, res: any, next: any) => {
    req.user = { sub: "test-user-123" };
    next();
  }),
}));

vi.mock("../../middleware/auth0-middleware", () => ({
  optionalAuth0: vi.fn((req: any, res: any, next: any) => {
    req.user = { sub: "test-user-id", email: "test@example.com" };
    next();
  }),
}));

vi.mock("../../middleware/usage-limit-middleware", () => ({
  checkUsageLimit: vi.fn(() => (req: any, res: any, next: any) => next()),
}));

vi.mock("../../middleware/zod-validation", () => ({
  validateRequest: vi.fn(() => (req: any, res: any, next: any) => next()),
  validateBody: vi.fn(() => (req: any, res: any, next: any) => next()),
  validateQuery: vi.fn(() => (req: any, res: any, next: any) => next()),
  validateParams: vi.fn(() => (req: any, res: any, next: any) => next()),
}));

vi.mock("../../config/rateLimiter", () => ({
  createRateLimiter: vi
    .fn()
    .mockReturnValue((req: any, res: any, next: any) => next()),
}));

vi.mock("../../utils/response-helpers", () => ({
  sendSuccess: vi.fn((res, data) =>
    res.status(200).json({ success: true, data }),
  ),
  sendInternalError: vi.fn((res, error) =>
    res.status(500).json({ success: false, error }),
  ),
}));

vi.mock("../../services/transformation-service", () => ({
  createTransformationService: vi.fn().mockReturnValue({
    transformWebpage: vi.fn().mockResolvedValue({
      success: true,
      data: {
        success: true,
        transformedContent: "Test transformed content",
        originalContent: {
          title: "Test",
          content: "Test content",
          url: "https://example.com",
          wordCount: 2,
        },
        persona: { id: "professional", name: "Professional" },
      },
    }),
    transformText: vi.fn().mockResolvedValue({
      success: true,
      data: {
        success: true,
        transformedContent: "Test transformed content",
        persona: { id: "professional", name: "Professional" },
      },
    }),
  }),
}));

vi.mock("../../services/cache-service", () => ({
  cacheService: {
    getCachedContent: vi.fn().mockReturnValue(null),
    setCachedContent: vi.fn(),
    getCachedTransformation: vi.fn().mockReturnValue(null),
    setCachedTransformation: vi.fn(),
    getCacheStats: vi.fn().mockReturnValue({
      scrapeCache: {
        keys: 10,
        stats: { hits: 5, misses: 2, keys: 10, ksize: 1024, vsize: 2048 },
      },
      transformCache: {
        keys: 5,
        stats: { hits: 3, misses: 1, keys: 5, ksize: 512, vsize: 1024 },
      },
    }),
    clearAllCaches: vi.fn(),
  },
}));

vi.mock("../../middleware/validation-schemas", () => ({
  transformSchemas: {
    transformUrl: {
      safeParse: vi.fn((body) => ({
        success: true,
        data: {
          url: body.url,
          persona: body.persona,
          style: body.style,
        },
      })),
    },
  },
}));

describe("Transform Route", () => {
  let app: express.Application;

  beforeEach(async () => {
    app = express();
    app.use(express.json());

    // Import route after mocks are set up
    const { default: transformRoute } = await import("../transform-route");
    app.use("/api/transform", transformRoute);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/transform", () => {
    it("should handle basic requests", async () => {
      const response = await request(app)
        .post("/api/transform")
        .set("Content-Type", "application/json")
        .send({
          url: "https://example.com",
          persona: "professional",
          style: "clear",
        });

      // With our mocks, this should succeed
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.transformedContent).toBe("Test transformed content");
    });
  });

  describe("Cache endpoints", () => {
    it("should return cache statistics", async () => {
      const response = await request(app).get("/api/transform/cache/stats");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.cacheStats).toBeDefined();
    });

    it("should clear all caches", async () => {
      const response = await request(app).delete("/api/transform/cache");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
