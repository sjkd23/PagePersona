# Environment Variables Configuration

This document describes all environment variables used in the PagePersonAI application.

## Overview

The application uses environment variables for configuration management across different environments (development, staging, production). Environment variables are loaded from `.env` files and system environment.

## Environment Files

* `.env.development` - Development environment template
* `.env.production` - Production environment template  
* `.env.local` - Local overrides (not committed to git)

## Required Variables

### OpenAI Configuration

```bash
# OpenAI API Key (REQUIRED)
OPENAI_API_KEY=your_openai_api_key_here

# OpenAI Model (REQUIRED)
OPENAI_MODEL=gpt-4

# OpenAI API Base URL (Optional)
OPENAI_API_BASE_URL=https://api.openai.com/v1
```

### Database Configuration

```bash
# MongoDB Connection String (REQUIRED)
MONGODB_URI=mongodb://localhost:27017/pagepersona

# MongoDB Database Name (Optional)
MONGODB_DB_NAME=pagepersona
```

### Authentication (Auth0)

```bash
# Auth0 Domain (REQUIRED)
AUTH0_DOMAIN=your-tenant.auth0.com

# Auth0 Client ID (REQUIRED)
AUTH0_CLIENT_ID=your_auth0_client_id

# Auth0 Client Secret (REQUIRED)
AUTH0_CLIENT_SECRET=your_auth0_client_secret

# Auth0 API Audience (REQUIRED)
AUTH0_AUDIENCE=your_auth0_api_audience

# JWT Secret (REQUIRED)
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
```

## Optional Variables

### Server Configuration

```bash
# Server Port (Default: 5000)
PORT=5000

# Node Environment (Default: development)
NODE_ENV=development

# Allowed Origins for CORS (Default: localhost:3000,localhost:5173)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# API Base URL (Default: http://localhost:5000)
API_URL=http://localhost:5000
```

### Redis Configuration

```bash
# Redis Connection URL (Optional)
REDIS_URL=redis://localhost:6379

# Disable Redis (Optional)
REDIS_DISABLED=false

# Redis Connection Timeout (Default: 5000ms)
REDIS_CONNECT_TIMEOUT=5000
```

### Caching Configuration

```bash
# Cache TTL in seconds (Default: 3600)
CACHE_TTL_SECONDS=3600

# Enable/disable caching (Default: true)
ENABLE_CACHING=true
```

### Rate Limiting

```bash
# Rate limit window in milliseconds (Default: 900000 = 15 minutes)
RATE_LIMIT_WINDOW_MS=900000

# Rate limit max requests (Default: 100)
RATE_LIMIT_MAX=100

# Rate limit skip successful requests (Default: false)
RATE_LIMIT_SKIP_SUCCESSFUL=false
```

### Logging Configuration

```bash
# Log Level (Default: info)
LOG_LEVEL=info

# Log Format (Default: combined)
LOG_FORMAT=combined

# Enable request logging (Default: true)
ENABLE_REQUEST_LOGGING=true
```

### Web Scraping Configuration

```bash
# User Agent for web scraping (Default: PagePersonAI Bot)
USER_AGENT=PagePersonAI Bot 1.0

# Request timeout in milliseconds (Default: 30000)
REQUEST_TIMEOUT=30000

# Max redirects (Default: 5)
MAX_REDIRECTS=5
```

## Development Setup

1. **Copy the development template**:
   ```bash
   cp .env.development .env.local
   ```

2. **Update required variables**:
   ```bash
   # Edit .env.local with your actual values
   OPENAI_API_KEY=sk-your-actual-openai-key
   MONGODB_URI=mongodb://localhost:27017/pagepersona
   AUTH0_DOMAIN=your-domain.auth0.com
   # ... etc
   ```

3. **Start the development server**:
   ```bash
   npm run start:dev
   ```

## Production Setup

1. **Set environment variables** in your deployment platform
2. **Ensure all required variables are set**
3. **Use secure values** for secrets and keys
4. **Enable appropriate security settings**

## Security Considerations

### Required Security Variables

```bash
# Strong JWT secret (minimum 32 characters)
JWT_SECRET=your-super-secure-jwt-secret-key-here

# Secure MongoDB connection with authentication
MONGODB_URI=mongodb://username:password@host:port/database

# Production Auth0 configuration
AUTH0_DOMAIN=your-production-domain.auth0.com
AUTH0_CLIENT_SECRET=your-production-client-secret
```

### Security Best Practices

* Never commit actual values to version control
* Use different secrets for each environment
* Rotate secrets regularly
* Use environment-specific Auth0 applications
* Enable MongoDB authentication in production
* Use Redis AUTH in production
* Set appropriate CORS origins

## Validation

The application validates environment variables on startup. Missing required variables will cause the application to fail to start with helpful error messages.

### Validation Rules

* `OPENAI_API_KEY` - Must be present and start with 'sk-'
* `MONGODB_URI` - Must be a valid MongoDB connection string
* `AUTH0_DOMAIN` - Must be a valid Auth0 domain
* `JWT_SECRET` - Must be at least 32 characters
* `PORT` - Must be a valid port number (1-65535)

## Environment-Specific Configurations

### Development

```bash
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pagepersona
REDIS_URL=redis://localhost:6379
LOG_LEVEL=debug
ENABLE_REQUEST_LOGGING=true
```

### Production

```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://username:password@cluster.mongodb.net/pagepersona
REDIS_URL=redis://username:password@redis-host:6379
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=false
CACHE_TTL_SECONDS=7200
```

## Troubleshooting

### Common Issues

1. **OpenAI API Key Invalid**
   - Check that the key starts with 'sk-'
   - Verify the key is active in OpenAI dashboard

2. **MongoDB Connection Failed**
   - Ensure MongoDB is running
   - Check connection string format
   - Verify network access

3. **Auth0 Configuration Issues**
   - Verify domain and client ID
   - Check client secret
   - Ensure API audience is correct

4. **Redis Connection Issues**
   - Check if Redis is running
   - Verify connection URL format
   - Application will fall back to in-memory storage

### Environment Variable Loading

The application loads environment variables in this order:
1. System environment variables
2. `.env.local` file (highest priority)
3. `.env.development` or `.env.production` (based on NODE_ENV)
4. Default values in code

## Migration Notes

When upgrading between versions, check for:
* New required environment variables
* Changed variable names
* Updated validation rules
* Security recommendations

---

*Keep this documentation updated when adding new environment variables or changing existing ones.*
