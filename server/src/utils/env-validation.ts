// Environment validation and safety checks for Auth0 integration

import { logger } from './logger';

const requiredEnvVars = ['AUTH0_DOMAIN', 'MONGODB_URI', 'OPENAI_API_KEY'] as const;

const recommendedEnvVars = ['AUTH0_AUDIENCE', 'REDIS_URL', 'JWT_SECRET'] as const;

interface EnvValidationResult {
  isValid: boolean;
  missing: string[];
  warnings: string[];
  config: {
    domain: string;
    audience?: string;
    environment: string;
    mongoUri?: string;
    openaiApiKey?: string;
    redisUrl?: string;
  };
}

/**
 * Validate Auth0 environment configuration
 */
export function validateAuth0Environment(): EnvValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  // Check optional but important variables
  if (!process.env.AUTH0_AUDIENCE && process.env.NODE_ENV === 'production') {
    warnings.push(
      'AUTH0_AUDIENCE not set in production environment - JWT tokens will not be validated for audience',
    );
  }

  if (!process.env.NODE_ENV) {
    warnings.push('NODE_ENV not set - defaulting to development mode');
  }

  // Check recommended variables
  for (const envVar of recommendedEnvVars) {
    if (!process.env[envVar]) {
      warnings.push(`${envVar} not set - some features may not work optimally`);
    }
  }

  // Production-specific checks
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.REDIS_URL) {
      warnings.push(
        'REDIS_URL not set in production - rate limiting and caching will not persist across restarts',
      );
    }
    if (!process.env.JWT_SECRET) {
      warnings.push('JWT_SECRET not set - using default secret is insecure for production');
    }
  }

  const config = {
    domain: process.env.AUTH0_DOMAIN || '',
    audience: process.env.AUTH0_AUDIENCE,
    environment: process.env.NODE_ENV || 'development',
    mongoUri: process.env.MONGODB_URI,
    openaiApiKey: process.env.OPENAI_API_KEY ? '***hidden***' : undefined,
    redisUrl: process.env.REDIS_URL,
  };

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
    config,
  };
}

/**
 * Ensure safe Auth0 configuration or exit
 */
export function ensureSafeAuth0Config(): void {
  const validation = validateAuth0Environment();

  if (!validation.isValid) {
    logger.error('❌ Critical Auth0 configuration errors:');
    for (const missing of validation.missing) {
      logger.error(`   - Missing required environment variable: ${missing}`);
    }
    logger.error('🚨 Application cannot start with missing Auth0 configuration');
    process.exit(1);
  }

  if (validation.warnings.length > 0) {
    logger.warn('⚠️  Auth0 configuration warnings:');
    for (const warning of validation.warnings) {
      logger.warn(`   - ${warning}`);
    }
  }

  logger.info('✅ Auth0 environment validation passed:', {
    domain: validation.config.domain,
    audience: validation.config.audience || 'NOT SET',
    environment: validation.config.environment,
    mongoUri: validation.config.mongoUri ? 'SET' : 'NOT SET',
    openaiApiKey: validation.config.openaiApiKey ? 'SET' : 'NOT SET',
    redisUrl: validation.config.redisUrl ? 'SET' : 'NOT SET',
  });
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
    audience?: string;
    environment: string;
    mongoUri?: string;
    openaiApiKey?: string;
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
