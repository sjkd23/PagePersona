// Environment validation and safety checks for all environment variables

import { z } from 'zod';
import path from 'path';
import dotenv from 'dotenv';
import { logger } from './logger';

// Load environment variables from root
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: path.resolve(__dirname, '../../..', envFile) });

// Comprehensive environment schema
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Server configuration
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default('5000'),

  // Required core services
  MONGODB_URI: z.string().min(1, 'MongoDB URI is required'),
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),

  // Auth0 configuration
  AUTH0_DOMAIN: z.string().min(1, 'Auth0 domain is required'),
  AUTH0_CLIENT_ID: z.string().min(1, 'Auth0 client ID is required'),
  AUTH0_CLIENT_SECRET: z.string().min(1, 'Auth0 client secret is required'),
  AUTH0_AUDIENCE: z.string().min(1, 'Auth0 audience is required'),

  // JWT configuration
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // OpenAI configuration
  OPENAI_MODEL: z.string().default('gpt-4'),

  // Optional but recommended
  CLIENT_URL: z.string().url('Invalid client URL').optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().positive()).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().positive()).default('100'),

  // Usage limits
  DAILY_LIMIT_FREE: z.string().transform(Number).pipe(z.number().positive()).default('10'),
  DAILY_LIMIT_PREMIUM: z.string().transform(Number).pipe(z.number().positive()).default('100'),

  // Cache configuration
  CACHE_TTL: z.string().transform(Number).pipe(z.number().positive()).default('3600'),

  // Redis configuration (optional)
  REDIS_URL: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().transform(Number).pipe(z.number().min(0)).default('0'),
  REDIS_DISABLED: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),

  // Web scraper configuration
  WEB_SCRAPER_MAX_CONTENT_LENGTH: z
    .string()
    .transform(Number)
    .pipe(z.number().positive())
    .default('8000'),
  WEB_SCRAPER_REQUEST_TIMEOUT_MS: z
    .string()
    .transform(Number)
    .pipe(z.number().positive())
    .default('10000'),
  WEB_SCRAPER_USER_AGENT: z
    .string()
    .default('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),

  // CORS configuration
  ALLOWED_ORIGINS: z.string().optional(),

  // Auth0 custom claims (optional)
  AUTH0_CUSTOM_USER_ID_CLAIM: z.string().optional(),
  AUTH0_ROLES_CLAIM: z.string().optional(),
  AUTH0_PERMISSIONS_CLAIM: z.string().optional(),
});

/**
 * Validate all environment variables against the schema
 */
export function validateEnvironment(): z.infer<typeof envSchema> {
  const parseResult = envSchema.safeParse(process.env);

  if (!parseResult.success) {
    logger.error('❌ Environment validation failed:');
    parseResult.error.errors.forEach((error) => {
      logger.error(`  • ${error.path.join('.')}: ${error.message}`);
    });

    // List missing required variables
    const requiredVars = [
      'MONGODB_URI',
      'OPENAI_API_KEY',
      'AUTH0_DOMAIN',
      'AUTH0_CLIENT_ID',
      'AUTH0_CLIENT_SECRET',
      'AUTH0_AUDIENCE',
      'JWT_SECRET',
    ];
    const missingRequired = requiredVars.filter((key) => !process.env[key]);

    if (missingRequired.length > 0) {
      logger.error('❌ Missing required environment variables:');
      missingRequired.forEach((key) => logger.error(`  • ${key}`));
    }

    throw new Error('Environment validation failed. Please check your .env file.');
  }

  return parseResult.data;
}

/**
 * Validate critical Auth0 configuration
 */
export function validateAuth0Environment(): {
  isValid: boolean;
  missing: string[];
  warnings: string[];
  config: {
    domain: string;
    audience: string;
    clientId: string;
    environment: string;
    mongoUri: string;
    openaiApiKey: string;
    redisUrl?: string;
  };
} {
  const _envConfig = validateEnvironment();

  const missing: string[] = [];
  const warnings: string[] = [];

  // Production-specific warnings
  if (_envConfig.NODE_ENV === 'production') {
    if (!_envConfig.REDIS_URL) {
      warnings.push(
        'REDIS_URL not set in production - rate limiting and caching will not persist across restarts',
      );
    }
    if (!_envConfig.CLIENT_URL) {
      warnings.push('CLIENT_URL not set - CORS may not work properly');
    }
  }

  const config = {
    domain: _envConfig.AUTH0_DOMAIN,
    audience: _envConfig.AUTH0_AUDIENCE,
    clientId: _envConfig.AUTH0_CLIENT_ID,
    environment: _envConfig.NODE_ENV,
    mongoUri: _envConfig.MONGODB_URI,
    openaiApiKey: '***hidden***',
    redisUrl: _envConfig.REDIS_URL,
  };

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
    config,
  };
}

/**
 * Ensure safe environment configuration or exit
 */
export function ensureSafeAuth0Config(): void {
  try {
    const _envConfig = validateEnvironment();
    const validation = validateAuth0Environment();

    if (!validation.isValid) {
      logger.error('❌ Critical environment configuration errors:');
      for (const missing of validation.missing) {
        logger.error(`   - Missing required environment variable: ${missing}`);
      }
      logger.error('🚨 Application cannot start with missing configuration');
      process.exit(1);
    }

    if (validation.warnings.length > 0) {
      logger.warn('⚠️  Environment configuration warnings:');
      for (const warning of validation.warnings) {
        logger.warn(`   - ${warning}`);
      }
    }

    logger.info('✅ Environment validation passed:', {
      domain: validation.config.domain,
      audience: validation.config.audience,
      environment: validation.config.environment,
      mongoUri: validation.config.mongoUri ? 'SET' : 'NOT SET',
      openaiApiKey: validation.config.openaiApiKey ? 'SET' : 'NOT SET',
      redisUrl: validation.config.redisUrl ? 'SET' : 'NOT SET',
    });
  } catch (error) {
    logger.error('❌ Environment validation failed:', error);
    process.exit(1);
  }
}

/**
 * Get current environment info for debugging
 */
export function getEnvironmentInfo(): {
  isValid: boolean;
  missing: string[];
  warnings: string[];
  config: {
    domain: string;
    audience: string;
    clientId: string;
    environment: string;
    mongoUri: string;
    openaiApiKey: string;
    redisUrl?: string;
  };
  timestamp: string;
  nodeVersion: string;
} {
  const validation = validateAuth0Environment();
  return {
    ...validation,
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
  };
}
