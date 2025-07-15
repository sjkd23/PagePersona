import { validateEnvironment } from './src/utils/env-validation.js';

try {
  const env = validateEnvironment();
  console.log('✅ Environment validation passed');
  console.log('Environment:', env.NODE_ENV);
  console.log('Port:', env.PORT);
  console.log('Auth0 Domain:', env.AUTH0_DOMAIN);
  console.log('MongoDB URI:', env.MONGODB_URI ? 'SET' : 'NOT SET');
  console.log('OpenAI API Key:', env.OPENAI_API_KEY ? 'SET' : 'NOT SET');
} catch (error) {
  console.error('❌ Environment validation failed:', error.message);
  process.exit(1);
}
