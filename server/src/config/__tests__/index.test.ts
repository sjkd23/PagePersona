import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  config,
  getConfig,
  dbConfig,
  auth0Config,
  jwtConfig,
  openaiConfig,
} from "../index";

// Mock the env-validation module to avoid actual validation
vi.mock("../../utils/env-validation", () => ({
  parsedEnv: {
    MONGODB_URI: "mongodb://localhost:27017/test",
    AUTH0_DOMAIN: "test.auth0.com",
    AUTH0_CLIENT_ID: "test-client-id",
    AUTH0_CLIENT_SECRET: "test-client-secret",
    AUTH0_AUDIENCE: "https://test.api",
    AUTH0_ISSUER: "https://test.auth0.com/",
    JWT_SECRET: "test-jwt-secret",
    JWT_EXPIRES_IN: "1h",
    OPENAI_API_KEY: "test-openai-key",
    OPENAI_MODEL: "gpt-3.5-turbo",
    REDIS_URL: "redis://localhost:6379",
    CACHE_TTL: 3600,
    WEB_SCRAPER_MAX_CONTENT_LENGTH: 8000,
    WEB_SCRAPER_REQUEST_TIMEOUT_MS: 10000,
    WEB_SCRAPER_USER_AGENT: "test-user-agent",
    PORT: 3001,
    NODE_ENV: "test",
  },
}));

describe("Config Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("config object", () => {
    it("should export a valid config object", () => {
      expect(config).toBeDefined();
      expect(typeof config).toBe("object");
    });

    it("should have required properties", () => {
      expect(config.MONGODB_URI).toBeDefined();
      expect(config.AUTH0_DOMAIN).toBeDefined();
      expect(config.JWT_SECRET).toBeDefined();
      expect(config.OPENAI_API_KEY).toBeDefined();
    });
  });

  describe("getConfig function", () => {
    it("should return config values by key", () => {
      const mongoUri = getConfig("MONGODB_URI");
      expect(mongoUri).toBe("mongodb://localhost:27017/test");

      const auth0Domain = getConfig("AUTH0_DOMAIN");
      expect(auth0Domain).toBe("test.auth0.com");
    });

    it("should return undefined for non-existent keys", () => {
      // @ts-expect-error - Testing invalid key
      const nonExistent = getConfig("NON_EXISTENT_KEY");
      expect(nonExistent).toBeUndefined();
    });
  });

  describe("dbConfig", () => {
    it("should have correct database configuration", () => {
      expect(dbConfig.uri).toBe("mongodb://localhost:27017/test");
      expect(dbConfig.options.maxPoolSize).toBe(10);
      expect(dbConfig.options.serverSelectionTimeoutMS).toBe(5000);
      expect(dbConfig.options.socketTimeoutMS).toBe(45000);
    });
  });

  describe("auth0Config", () => {
    it("should have correct Auth0 configuration", () => {
      expect(auth0Config.domain).toBe("test.auth0.com");
      expect(auth0Config.clientId).toBe("test-client-id");
      expect(auth0Config.clientSecret).toBe("test-client-secret");
      expect(auth0Config.audience).toBe("https://test.api");
    });
  });

  describe("jwtConfig", () => {
    it("should have correct JWT configuration", () => {
      expect(jwtConfig.secret).toBe("test-jwt-secret");
      expect(jwtConfig.expiresIn).toBe("1h");
    });
  });

  describe("openaiConfig", () => {
    it("should have correct OpenAI configuration", () => {
      expect(openaiConfig.apiKey).toBe("test-openai-key");
      expect(openaiConfig.model).toBe("gpt-3.5-turbo");
      expect(openaiConfig.maxTokens).toBe(2000);
      expect(openaiConfig.temperature).toBe(0.7);
    });
  });

  describe("Edge Cases", () => {
    it("should handle config access safely", () => {
      expect(() => getConfig("MONGODB_URI")).not.toThrow();
      expect(() => getConfig("AUTH0_DOMAIN")).not.toThrow();
    });

    it("should work with different config values", () => {
      const testKeys = [
        "MONGODB_URI",
        "AUTH0_DOMAIN",
        "JWT_SECRET",
        "OPENAI_API_KEY",
      ] as const;
      testKeys.forEach((key) => {
        const value = getConfig(key);
        expect(value).toBeDefined();
        expect(typeof value).toBe("string");
      });
    });
  });
});
