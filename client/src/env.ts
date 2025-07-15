import { z } from 'zod';

// Client environment variables schema
const clientEnvSchema = z.object({
  // API Configuration
  VITE_API_URL: z.string().url('Invalid API URL').default('http://localhost:5000/api'),

  // App Configuration
  VITE_APP_NAME: z.string().default('PagePersonAI'),
  VITE_APP_VERSION: z.string().default('1.0.0'),
  VITE_SITE_URL: z.string().url('Invalid site URL').default('http://localhost:5173'),

  // Development flags
  VITE_DEV_MODE: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  VITE_DEBUG: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),

  // Auth0 Configuration
  VITE_AUTH0_DOMAIN: z.string().min(1, 'Auth0 domain is required'),
  VITE_AUTH0_CLIENT_ID: z.string().min(1, 'Auth0 client ID is required'),
  VITE_AUTH0_AUDIENCE: z.string().min(1, 'Auth0 audience is required'),

  // Analytics (Optional)
  VITE_GA_TRACKING_ID: z.string().optional(),
  VITE_HOTJAR_ID: z.string().optional(),
});

/**
 * Validate client environment variables
 */
function validateClientEnv() {
  const parseResult = clientEnvSchema.safeParse(import.meta.env);

  if (!parseResult.success) {
    console.error('❌ Client environment validation failed:');
    parseResult.error.errors.forEach((error) => {
      console.error(`  • ${error.path.join('.')}: ${error.message}`);
    });

    // In development, show the error but don't crash
    if (import.meta.env.DEV) {
      console.warn('⚠️  Running in development mode with missing environment variables');
      // Return defaults for development
      return {
        VITE_API_URL: 'http://localhost:5000/api',
        VITE_APP_NAME: 'PagePersonAI',
        VITE_APP_VERSION: '1.0.0',
        VITE_SITE_URL: 'http://localhost:5173',
        VITE_DEV_MODE: true,
        VITE_DEBUG: true,
        VITE_AUTH0_DOMAIN: 'dev-domain.auth0.com',
        VITE_AUTH0_CLIENT_ID: 'dev-client-id',
        VITE_AUTH0_AUDIENCE: 'dev-audience',
        VITE_GA_TRACKING_ID: undefined,
        VITE_HOTJAR_ID: undefined,
      };
    }

    throw new Error(
      'Client environment validation failed. Please check your environment variables.',
    );
  }

  return parseResult.data;
}

// Export validated environment
export const env = validateClientEnv();

// Type for the environment object
export type ClientEnv = typeof env;
