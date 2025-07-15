import { z } from 'zod';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

// Environment schema validation
const envSchema = z.object({
  // Server configuration
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database configuration
  MONGODB_URI: z.string().url('Invalid MongoDB URI'),

  // Auth0 configuration
  AUTH0_DOMAIN: z.string().min(1, 'Auth0 domain is required'),
  AUTH0_CLIENT_ID: z.string().min(1, 'Auth0 client ID is required'),
  AUTH0_CLIENT_SECRET: z.string().min(1, 'Auth0 client secret is required'),
  AUTH0_AUDIENCE: z.string().min(1, 'Auth0 audience is required'),

  // JWT configuration
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),

  // OpenAI configuration
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
  OPENAI_MODEL: z.string().default('gpt-4'),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().positive()).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().positive()).default('100'),

  // Usage limits
  DAILY_LIMIT_FREE: z.string().transform(Number).pipe(z.number().positive()).default('10'),
  DAILY_LIMIT_PREMIUM: z.string().transform(Number).pipe(z.number().positive()).default('100'),

  // Client URL for CORS
  CLIENT_URL: z.string().url('Invalid client URL').default('http://localhost:5173'),

  // Optional configurations
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  CACHE_TTL: z.string().transform(Number).pipe(z.number().positive()).default('3600'), // 1 hour
});

// Validate environment variables
const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  logger.error('❌ Environment validation failed:');
  parseResult.error.errors.forEach((error) => {
    logger.error(`  • ${error.path.join('.')}: ${error.message}`);
  });
  process.exit(1);
}

export const config = parseResult.data;

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
  origin: config.CLIENT_URL,
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
