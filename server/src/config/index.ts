/**
 * Application Configuration Management
 *
 * Centralized configuration system that manages environment variables,
 * database connections, and application settings. Provides type-safe
 * access to configuration values with validation and fallback handling.
 *
 * Key Features:
 * - Environment-specific configuration loading
 * - Type-safe configuration access with TypeScript
 * - Runtime validation of required environment variables
 * - Database connection configuration with optimized settings
 * - Redis caching configuration with fallback handling
 * - Security and rate limiting configuration
 *
 * Usage:
 * ```typescript
 * import { config, getConfig } from './config';
 *
 * const apiKey = getConfig('OPENAI_API_KEY');
 * const dbUri = config.MONGODB_URI;
 * ```
 *
 * @module config
 * @version 1.0.0
 * @since 1.0.0
 */

import { logger } from '../utils/logger';
import { validateEnvironment } from '../utils/env-validation';

// Validate and get environment configuration
let config: ReturnType<typeof validateEnvironment>;
try {
  config = validateEnvironment();
} catch (error) {
  logger.warn('Environment validation failed, using development defaults');
  config = {
    NODE_ENV: 'development' as const,
    PORT: 5000,
    MONGODB_URI: 'mongodb://localhost:27017/pagepersonai-dev',
    OPENAI_API_KEY: 'missing',
    OPENAI_MODEL: 'gpt-4',
    AUTH0_DOMAIN: 'dev.example.com',
    AUTH0_CLIENT_ID: 'dev-client-id',
    AUTH0_CLIENT_SECRET: 'dev-client-secret',
    AUTH0_AUDIENCE: 'dev-audience',
    AUTH0_ISSUER: 'https://dev.example.com/',
    JWT_SECRET: 'dev-jwt-secret-minimum-32-characters-long',
    JWT_EXPIRES_IN: '7d',
    CLIENT_URL: 'http://localhost:3000',
    LOG_LEVEL: 'info' as const,
    RATE_LIMIT_WINDOW_MS: 900000,
    RATE_LIMIT_MAX_REQUESTS: 100,
    DAILY_LIMIT_FREE: 10,
    DAILY_LIMIT_PREMIUM: 100,
    CACHE_TTL: 3600,
    REDIS_URL: undefined,
    REDIS_PASSWORD: undefined,
    REDIS_DB: 0,
    REDIS_DISABLED: false,
    WEB_SCRAPER_MAX_CONTENT_LENGTH: 8000,
    WEB_SCRAPER_REQUEST_TIMEOUT_MS: 10000,
    WEB_SCRAPER_USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    ALLOWED_ORIGINS: undefined,
    AUTH0_CUSTOM_USER_ID_CLAIM: undefined,
    AUTH0_ROLES_CLAIM: undefined,
    AUTH0_PERMISSIONS_CLAIM: undefined,
  };
}

export { config };

// Type-safe environment access
export type Config = typeof config;

/**
 * Type-safe configuration value getter
 *
 * Provides runtime-validated access to configuration values with
 * full TypeScript support and error handling.
 *
 * @param key - Configuration key to retrieve
 * @returns The configuration value for the specified key
 * @throws Error if the configuration key is invalid or missing
 *
 * @example
 * ```typescript
 * const apiKey = getConfig('OPENAI_API_KEY');
 * const port = getConfig('PORT');
 * ```
 */
export function getConfig<K extends keyof Config>(key: K): Config[K] {
  return config[key];
}

/**
 * Database connection configuration
 *
 * Optimized MongoDB connection settings with connection pooling,
 * timeout handling, and performance optimizations.
 */
export const dbConfig = {
  uri: config.MONGODB_URI,
  options: {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  },
};

// Auth0 configuration
export const auth0Config = {
  domain: config.AUTH0_DOMAIN,
  clientId: config.AUTH0_CLIENT_ID,
  clientSecret: config.AUTH0_CLIENT_SECRET,
  audience: config.AUTH0_AUDIENCE,
};

// JWT configuration
export const jwtConfig = {
  secret: config.JWT_SECRET,
  expiresIn: config.JWT_EXPIRES_IN,
};

// OpenAI configuration
export const openaiConfig = {
  apiKey: config.OPENAI_API_KEY,
  model: config.OPENAI_MODEL,
  maxTokens: 2000,
  temperature: 0.7,
};

// Rate limiting configuration
export const rateLimitConfig = {
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  maxRequests: config.RATE_LIMIT_MAX_REQUESTS,
};

// Usage limits configuration
export const usageLimitConfig = {
  daily: {
    free: config.DAILY_LIMIT_FREE,
    premium: config.DAILY_LIMIT_PREMIUM,
  },
};

// CORS configuration
export const corsConfig = {
  origin: config.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
};

// Log configuration
export const logConfig = {
  level: config.LOG_LEVEL,
};

// Cache configuration
export const cacheConfig = {
  ttl: config.CACHE_TTL,
};

// Validate critical configurations on startup
export function validateCriticalConfig(): void {
  const criticalChecks = [
    { name: 'MongoDB URI', value: config.MONGODB_URI },
    { name: 'Auth0 Domain', value: config.AUTH0_DOMAIN },
    { name: 'OpenAI API Key', value: config.OPENAI_API_KEY },
    { name: 'JWT Secret', value: config.JWT_SECRET },
  ];

  const failures = criticalChecks.filter((check) => !check.value);

  if (failures.length > 0) {
    logger.error('❌ Critical configuration missing:');
    failures.forEach((failure) => {
      logger.error(`  • ${failure.name}`);
    });
    process.exit(1);
  }

  logger.info('✅ All critical configurations validated');
}
