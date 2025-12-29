// Environment validation and safety checks for all environment variables

import { z } from "zod";
import { logger } from "./logger";

// Comprehensive environment schema
export const envSchema = z.object({
  // Node environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Server configuration
  PORT: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1).max(65535))
    .default("5000"),

  // Required core services
  MONGODB_URI: z.string().min(1, "MongoDB URI is required"),
  OPENAI_API_KEY: z.string().min(1, "OpenAI API key is required"),

  // Auth0 configuration
  AUTH0_DOMAIN: z.string().min(1, "Auth0 domain is required"),
  AUTH0_CLIENT_ID: z.string().min(1, "Auth0 client ID is required"),
  AUTH0_CLIENT_SECRET: z.string().min(1, "Auth0 client secret is required"),
  AUTH0_AUDIENCE: z.string().min(1, "Auth0 audience is required"),
  AUTH0_ISSUER: z
    .string()
    .url("Auth0 issuer must be a valid URL")
    .min(1, "Auth0 issuer is required"),

  // JWT configuration
  JWT_SECRET: z.string().min(32, "JWT secret must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  // OpenAI configuration
  OPENAI_MODEL: z.string().default("gpt-4"),

  // Optional but recommended
  CLIENT_URL: z.string().url("Invalid client URL").optional(),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .transform(Number)
    .pipe(z.number().positive())
    .default("900000"),
  RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .transform(Number)
    .pipe(z.number().positive())
    .default("100"),

  // Usage limits
  DAILY_LIMIT_FREE: z
    .string()
    .transform(Number)
    .pipe(z.number().positive())
    .default("10"),
  DAILY_LIMIT_PREMIUM: z
    .string()
    .transform(Number)
    .pipe(z.number().positive())
    .default("100"),

  // Cache configuration
  CACHE_TTL: z
    .string()
    .transform(Number)
    .pipe(z.number().positive())
    .default("3600"),

  // Redis configuration (optional)
  REDIS_URL: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().transform(Number).pipe(z.number().min(0)).default("0"),
  REDIS_DISABLED: z
    .string()
    .transform((val) => val === "true")
    .default("false"),

  // Web scraper configuration
  WEB_SCRAPER_MAX_CONTENT_LENGTH: z
    .string()
    .transform(Number)
    .pipe(z.number().positive())
    .default("8000"),
  WEB_SCRAPER_REQUEST_TIMEOUT_MS: z
    .string()
    .transform(Number)
    .pipe(z.number().positive())
    .default("10000"),
  WEB_SCRAPER_USER_AGENT: z
    .string()
    .default("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"),

  // CORS configuration
  ALLOWED_ORIGINS: z.string().optional(),

  // Auth0 custom claims (optional)
  AUTH0_CUSTOM_USER_ID_CLAIM: z.string().optional(),
  AUTH0_ROLES_CLAIM: z.string().optional(),
  AUTH0_PERMISSIONS_CLAIM: z.string().optional(),
});

/**
 * Parse and validate environment variables with fail-fast validation
 * This replaces all previous validation functions with a single, simple export
 */
function parseEnvironment(): z.infer<typeof envSchema> {
  const required = [
    "MONGODB_URI",
    "OPENAI_API_KEY",
    "AUTH0_DOMAIN",
    "AUTH0_CLIENT_ID",
    "AUTH0_CLIENT_SECRET",
    "AUTH0_AUDIENCE",
    "AUTH0_ISSUER",
    "JWT_SECRET",
  ];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length) {
    // In test environment, always throw to maintain test expectations
    // In development mode, log warning but continue with defaults
    const isTestEnv =
      process.env.NODE_ENV === "test" ||
      process.env.VITEST === "true" ||
      process.env.npm_lifecycle_event?.includes("test");

    if (isTestEnv || process.env.NODE_ENV === "production") {
      throw new Error(`Missing ENV vars: ${missing.join(", ")}`);
    }

    logger.warn(`⚠️ Missing ENV vars in development: ${missing.join(", ")}`);
    logger.warn("🚧 Using development defaults...");

    // Set temporary values to allow parsing
    const tempEnv = { ...process.env };
    for (const key of missing) {
      switch (key) {
        case "MONGODB_URI":
          tempEnv[key] = "mongodb://localhost:27017/pagepersonai-dev";
          break;
        case "OPENAI_API_KEY":
          tempEnv[key] = "sk-missing-openai-key-for-development-only";
          break;
        case "AUTH0_DOMAIN":
          tempEnv[key] = "dev-example.auth0.com";
          break;
        case "AUTH0_CLIENT_ID":
          tempEnv[key] = "dev-client-id-for-development";
          break;
        case "AUTH0_CLIENT_SECRET":
          tempEnv[key] = "dev-client-secret-for-development-only";
          break;
        case "AUTH0_AUDIENCE":
          tempEnv[key] = "https://dev-example-api";
          break;
        case "AUTH0_ISSUER":
          tempEnv[key] = "https://dev-example.auth0.com/";
          break;
        case "JWT_SECRET":
          tempEnv[key] =
            "dev-jwt-secret-must-be-at-least-32-characters-long-for-development";
          break;
      }
    }

    const parseResult = envSchema.safeParse(tempEnv);
    if (!parseResult.success) {
      throw new Error(
        "Environment validation failed. Please check your .env file.",
      );
    }
    return parseResult.data;
  }

  logger.info("✅ Environment validated");

  // Parse and return validated config
  const parseResult = envSchema.safeParse(process.env);
  if (!parseResult.success) {
    throw new Error(
      "Environment validation failed. Please check your .env file.",
    );
  }
  return parseResult.data;
}

/**
 * Single source of truth for all environment variables
 * Use this instead of process.env throughout the application
 */
export const parsedEnv = parseEnvironment();
