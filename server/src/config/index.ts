import dotenv from 'dotenv';
import path from 'path';
import { logger } from '../utils/logger';
import { validateEnvironment } from '../utils/env-validation';

// Load environment variables from root
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: path.resolve(__dirname, '../../..', envFile) });

// Validate and get environment configuration
export const config = validateEnvironment();

// Type-safe environment access
export type Config = typeof config;

// Helper function to get config values with runtime validation
export function getConfig<K extends keyof Config>(key: K): Config[K] {
  return config[key];
}

// Database configuration
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
