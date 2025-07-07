// Environment validation and safety checks for Auth0 integration

const requiredEnvVars = [
  'AUTH0_DOMAIN'
] as const;

const optionalEnvVars = [
  'AUTH0_AUDIENCE',
  'NODE_ENV'
] as const;

interface EnvValidationResult {
  isValid: boolean;
  missing: string[];
  warnings: string[];
  config: {
    domain: string;
    audience?: string;
    environment: string;
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
    warnings.push('AUTH0_AUDIENCE not set in production environment - JWT tokens will not be validated for audience');
  }

  if (!process.env.NODE_ENV) {
    warnings.push('NODE_ENV not set - defaulting to development mode');
  }

  const config = {
    domain: process.env.AUTH0_DOMAIN || '',
    audience: process.env.AUTH0_AUDIENCE,
    environment: process.env.NODE_ENV || 'development'
  };

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
    config
  };
}

/**
 * Ensure safe Auth0 configuration or exit
 */
export function ensureSafeAuth0Config(): void {
  const validation = validateAuth0Environment();

  if (!validation.isValid) {
    console.error('❌ Critical Auth0 configuration errors:');
    for (const missing of validation.missing) {
      console.error(`   - Missing required environment variable: ${missing}`);
    }
    console.error('🚨 Application cannot start with missing Auth0 configuration');
    process.exit(1);
  }

  if (validation.warnings.length > 0) {
    console.warn('⚠️  Auth0 configuration warnings:');
    for (const warning of validation.warnings) {
      console.warn(`   - ${warning}`);
    }
  }

  console.log('✅ Auth0 environment validation passed:', {
    domain: validation.config.domain,
    audience: validation.config.audience || 'NOT SET',
    environment: validation.config.environment
  });
}

/**
 * Get current environment info for debugging
 */
export function getEnvironmentInfo() {
  const validation = validateAuth0Environment();
  return {
    ...validation,
    timestamp: new Date().toISOString(),
    nodeVersion: process.version
  };
}
