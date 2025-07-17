# PagePersonAI

Transform any webpage into your favorite writing style using AI-powered personas.  
Turn boring articles into engaging narratives, clear explanations, or creative stories.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?logo=mongodb&logoColor=white)](https://mongodb.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?logo=openai&logoColor=white)](https://openai.com/)
[![Auth0](https://img.shields.io/badge/Auth0-EB5424?logo=auth0&logoColor=white)](https://auth0.com/)

## Overview

PagePersonAI reimagines web content through different writing personas. Want to read a technical article as if it were written by a medieval knight? Or understand complex topics through simple explanations? This tool makes it happen.

### Key Features

- **AI-Powered Transformations**: Uses OpenAI's GPT models with custom persona prompts
- **Multiple Personas**: ELI5, Medieval Knight, Anime Hacker, Plague Doctor, and Robot
- **Flexible Input**: Transform content from URLs or paste text directly
- **Secure Authentication**: Auth0 integration with social logins
- **Usage Tracking**: Rate limiting and analytics with tier-based access
- **Smart Caching**: Redis-backed caching with MongoDB persistence
- **Modern Interface**: Responsive React UI with Tailwind CSS
- **Production Ready**: Docker containerization and nginx reverse proxy

## Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- MongoDB instance (local or cloud)
- Redis instance (optional, for caching)
- OpenAI API key
- Auth0 tenant and application

### Installation

```bash
# Clone the repository
git clone https://github.com/sjkd23/PagePersonai.git
cd PagePersonai

# Install dependencies
npm install

# Set up environment variables
cp .env.development .env
# Edit .env with your values

# Build and start
npm run build
npm run start:dev
```

Access the application at:

- Frontend: <http://localhost:5173>
- Backend API: <http://localhost:5000>

## Environment Variables

Create a `.env` file with the following required variables:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4

# Database
MONGODB_URI=mongodb://localhost:27017/pagepersona

# Authentication
AUTH0_DOMAIN=your-auth0-domain.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret
AUTH0_AUDIENCE=your-auth0-api-identifier
AUTH0_ISSUER=https://your-auth0-domain.auth0.com/

# Client Configuration
VITE_API_URL=http://localhost:5000/api
VITE_AUTH0_DOMAIN=your-auth0-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-auth0-client-id
VITE_AUTH0_AUDIENCE=your-auth0-api-identifier

# Optional
REDIS_URL=redis://localhost:6379
PORT=5000
NODE_ENV=development
```

## Docker Deployment

### Quick Start with Docker Compose

```bash
# Copy environment file
cp .env.development .env

# Update .env with your credentials
# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost
# Backend API: http://localhost:5000
```

### Individual Container Builds

```bash
# Build server image
docker build -t pagepersonai-server -f server/Dockerfile .

# Build client image
docker build -t pagepersonai-client -f client/Dockerfile .
```

## API Documentation

### Interactive Documentation

- Development: <http://localhost:5000/docs>
- Swagger UI with full API documentation

### Main Endpoints

- `POST /api/transform` - Transform content with selected persona
- `GET /api/health` - Health check endpoint
- `GET /api/user/profile` - Get user profile information

### Authentication

All API endpoints require Auth0 JWT tokens:

```bash
Authorization: Bearer <jwt_token>
```

## Project Structure

This monorepo uses npm workspaces:

```text
PagePersonAI/
├── config/                  # Configuration files
│   ├── eslint.config.mjs   # ESLint configuration
│   ├── .prettierrc         # Prettier configuration
│   ├── tsconfig.json       # TypeScript configuration
│   └── vitest.config.ts    # Vitest configuration
├── shared/                  # Shared types and constants
├── server/                  # Express.js API backend
├── client/                  # React frontend
├── nginx/                   # Reverse proxy configuration
└── docker-compose.yml       # Multi-container setup
```

## Development

### Available Scripts

```bash
# Development
npm run start:dev           # Start both server and client in dev mode
npm run build              # Build all workspaces
npm run test               # Run all tests
npm run test:coverage      # Run tests with coverage
npm run lint               # Lint all code
npm run format             # Format all code
npm run typecheck          # TypeScript type checking
npm run clean              # Clean build artifacts
```

### Working with Workspaces

```bash
# Build specific workspace
npm run build --workspace=server
npm run build --workspace=client

# Run tests for specific workspace
npm run test --workspace=server
npm run test --workspace=client

# Start individual services
npm run start:dev --workspace=server
npm run dev --workspace=client
```

## Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Ensure all tests pass: `npm test`
5. Run linting: `npm run lint`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Submit a pull request

### Code Standards

- **ESLint**: Enforces coding standards and catches errors
- **Prettier**: Automatic code formatting
- **Husky**: Pre-commit hooks for code quality
- **TypeScript**: Strict mode enabled for type safety
- **Testing**: Comprehensive test coverage with Vitest

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenAI for the GPT API
- Auth0 for authentication services
- The open-source community for amazing tools and libraries

---

_Ready to transform web content? Get started with the installation guide above!_
npm run dev --workspace=client

````

Access the application at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

### Run in Production

```bash
# Build all workspaces
npm run build

# Start production server
npm run start --workspace=server

# Serve client build (use a web server like nginx)
npm run serve --workspace=client
````

---

## Docker Deployment

### Build Images

```bash
# Build server image
docker build -t pagepersonai-server -f server/Dockerfile .

# Build client image
docker build -t pagepersonai-client -f client/Dockerfile .
```

### Start Services

```bash
# Start all services with docker-compose
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Useful Commands

```bash
# View logs for specific service
docker-compose logs -f server
docker-compose logs -f client

# Restart specific service
docker-compose restart server

# Execute command in running container
docker-compose exec server npm run test

# Remove all containers and volumes
docker-compose down -v
```

---

## Environment Variables

Configure your application by copying `.env.development` to `.env` and updating the values:

### Required Variables

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here          # OpenAI API key for AI transformations
OPENAI_MODEL=gpt-4                               # OpenAI model to use

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/pagepersona # MongoDB connection string

# Authentication

JWT_SECRET=your-super-secret-jwt-key             # JWT signing secret (min 32 chars)
AUTH0_DOMAIN=your-auth0-domain.auth0.com         # Auth0 tenant domain
AUTH0_CLIENT_ID=your-auth0-client-id             # Auth0 application client ID
AUTH0_CLIENT_SECRET=your-auth0-client-secret     # Auth0 application client secret
AUTH0_AUDIENCE=your-auth0-api-identifier         # Auth0 API identifier
AUTH0_ISSUER=https://your-auth0-domain.auth0.com/ # Auth0 issuer URL (required for JWT validation)
```

### Client Variables (VITE\_ prefix)

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api           # Backend API base URL
VITE_APP_NAME=PagePersonAI                       # Application name
VITE_SITE_URL=http://localhost:5173              # Frontend URL

# Auth0 Configuration (Client-side)
VITE_AUTH0_DOMAIN=your-auth0-domain.auth0.com    # Auth0 tenant domain
VITE_AUTH0_CLIENT_ID=your-auth0-client-id        # Auth0 application client ID
VITE_AUTH0_AUDIENCE=your-auth0-api-identifier    # Auth0 API identifier
```

### Optional Variables

```env
# Server Configuration
PORT=5000                                        # Server port
NODE_ENV=development                             # Environment mode

# Redis Cache (Optional)
REDIS_URL=redis://localhost:6379                # Redis connection string

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000                     # Rate limit window (15 minutes)
RATE_LIMIT_MAX_REQUESTS=100                     # Max requests per window

# Usage Limits
DAILY_LIMIT_FREE=10                             # Daily limit for free users
DAILY_LIMIT_PREMIUM=100                         # Daily limit for premium users

# Web Scraper
WEB_SCRAPER_MAX_CONTENT_LENGTH=8000             # Max content length for scraping
WEB_SCRAPER_REQUEST_TIMEOUT_MS=10000            # Request timeout for scraping

# Logging
LOG_LEVEL=debug                                 # Logging level

# Analytics (Optional)
VITE_GA_TRACKING_ID=GA-XXXXXXXXX                # Google Analytics tracking ID
VITE_HOTJAR_ID=XXXXXXX                          # Hotjar tracking ID
```

---

## API Documentation

### Swagger UI

Access the interactive API documentation at:

- Development: http://localhost:5000/docs
- Production: https://your-domain.com/docs

### Main Endpoints

- `POST /api/transform` - Transform content with selected persona
- `GET /api/health` - Health check endpoint
- `GET /api/user/profile` - Get user profile information
- `POST /api/user/sync` - Sync user data with Auth0

### Authentication

PagePersonAI uses Auth0 for secure authentication with JWT tokens and scope-based authorization.

#### Required Auth0 Configuration

1. **Create Auth0 Application**:
   - Application Type: Single Page Application
   - Enable RS256 token signing algorithm
   - Configure Allowed Callback URLs: `http://localhost:5173` (development)

2. **Create Auth0 API**:
   - Create an API in Auth0 Dashboard
   - Set API Identifier (this becomes your `AUTH0_AUDIENCE`)
   - Enable RS256 signing algorithm
   - Configure scopes for your application

3. **Enable Refresh Token Rotation**:
   - In Auth0 Dashboard → Applications → [Your App] → Advanced Settings
   - Enable "Refresh Token Rotation"
   - Set "Refresh Token Expiration" to appropriate value

#### Environment Variables

Required environment variables for authentication:

```env
# Server-side Auth0 configuration
AUTH0_DOMAIN=your-auth0-domain.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret
AUTH0_AUDIENCE=your-auth0-api-identifier
AUTH0_ISSUER=https://your-auth0-domain.auth0.com/

# Client-side Auth0 configuration
VITE_AUTH0_DOMAIN=your-auth0-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-auth0-client-id
VITE_AUTH0_AUDIENCE=your-auth0-api-identifier
```

#### JWT Token Format

All API endpoints require a valid Auth0 JWT token in the Authorization header:

```bash
Authorization: Bearer <jwt_token>
```

#### Scope-Based Authorization

The API uses scope-based authorization for different endpoint access levels:

- **Public Routes**: No authentication required
- **User Routes**: Requires valid JWT token (`jwtCheck`)
- **Admin Routes**: Requires valid JWT token + admin role (`jwtCheck` + `requireRoles(['admin'])`)
- **Protected Actions**: Requires specific scopes (`requireScopes(['read:admin'])`)

#### Security Features

- **RS256 Algorithm**: Uses asymmetric keys for token validation
- **JWKS Caching**: Public keys cached with rate limiting (5 requests/minute)
- **Refresh Token Rotation**: Automatic token refresh with rotation
- **Memory Cache**: Tokens stored in memory for security (client-side)
- **Scope Validation**: Granular permission checking
- **Error Handling**: Comprehensive error responses without information leakage

### Example API Usage

```bash
# Transform content
curl -X POST http://localhost:5000/api/transform \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Your content here",
    "persona": "eli5"
  }'
```

---

## Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Ensure all tests pass: `npm test`
5. Ensure code is formatted: `npm run format`
6. Run linting: `npm run lint`
7. Commit your changes: `git commit -m 'Add amazing feature'`
8. Push to the branch: `git push origin feature/amazing-feature`
9. Submit a pull request

### Code Standards

- **ESLint**: Enforces coding standards and catches errors
- **Prettier**: Automatic code formatting
- **Husky & lint-staged**: Pre-commit hooks for code quality
- **Conventional Commits**: Use conventional commit messages
- **TypeScript**: Strict mode enabled for type safety
- **Test Coverage**: Write tests for new features

### Pull Request Process

1. Update documentation for any new features
2. Ensure all tests pass and coverage is maintained
3. Update the README if needed
4. Link to relevant issues in your PR description
5. Request review from maintainers

---

## Versioning

We use [Semantic Versioning](https://semver.org/).  
See the [CHANGELOG.md](./CHANGELOG.md) for details on each release.

This project follows [Semantic Versioning](https://semver.org/) (SemVer):

- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality
- **PATCH** version for backwards-compatible bug fixes

### Current Version: v0.1.0

For detailed changes, see the [CHANGELOG.md](CHANGELOG.md) file.

### Release Process

1. Update version in `package.json` files
2. Update `CHANGELOG.md` with release notes
3. Create git tag: `git tag v1.x.x`
4. Push changes and tags
5. CI/CD pipeline handles deployment

---

## Monorepo Structure

This project is organized as a monorepo using **npm workspaces** for efficient dependency management and development workflow.

```text
PagePersonAI/
├── package.json                 # Root package.json with workspace configuration
├── shared/                      # Shared types and constants
│   ├── src/
│   │   ├── types/              # TypeScript interfaces
│   │   └── constants/          # Shared constants (personas, prompts)
│   └── package.json
├── server/                      # Express.js API backend
│   ├── src/
│   │   ├── controllers/        # Route handlers
│   │   ├── middleware/         # Authentication, validation, etc.
│   │   ├── services/           # Business logic
│   │   └── utils/              # Utility functions
│   └── package.json
├── client/                      # React frontend
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── contexts/           # React contexts
│   │   └── utils/              # Frontend utilities
│   └── package.json
└── docker-compose.yml           # Multi-container setup
```

### Workspace Benefits

- **Shared Dependencies**: Common packages like TypeScript, ESLint, and Prettier are hoisted to the root
- **Type Safety**: The `@pagepersonai/shared` package provides consistent types across client and server
- **Unified Scripts**: Run commands across all workspaces from the root
- **Efficient Development**: Changes to shared types are immediately available to all workspaces

---

## Development Workflow

### Making Changes

1. **Shared Types**: Update `shared/src/types/` and run `npm run build --workspace=shared`
2. **Server Changes**: Work in `server/src/` and use `npm run start:dev --workspace=server`
3. **Client Changes**: Work in `client/src/` and use `npm run dev --workspace=client`

### Individual Workspace Commands

```bash
# Work with specific workspaces
npm run build --workspace=shared
npm run test --workspace=server
npm run dev --workspace=client

# Or navigate to workspace directory
cd server
npm run start:dev

cd client
npm run dev
```

### Code Quality

```bash
# Lint all workspaces
npm run lint

# Format all code
npm run format

# Type check
npm run type-check --workspace=shared
```

---

## Testing

### Test Structure

```text
shared/          # No tests (just types/constants)
server/src/
├── __tests__/           # Integration tests
├── services/__tests__/  # Unit tests for services
├── utils/__tests__/     # Utility tests
├── middleware/__tests__/ # Middleware tests
├── config/__tests__/    # Configuration tests
└── routes/__tests__/    # Route handler tests

client/src/
├── __tests__/           # App-level tests
├── components/__tests__/ # Component tests
├── hooks/__tests__/     # Hook tests
├── utils/__tests__/     # Utility tests
└── lib/__tests__/       # Library tests
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests for specific workspace
npm run test --workspace=server
npm run test --workspace=client

# Run tests in watch mode
npm run test:watch --workspace=server

# Run tests with coverage
npm run test:coverage --workspace=server
npm run test:coverage --workspace=client
```

### Coverage Policy

PagePersonAI maintains comprehensive test coverage to ensure code quality and reliability.

#### Coverage Targets

- **Overall Coverage**: ≥90% for statements, branches, functions, and lines
- **Critical Components**: 100% coverage for core business logic
- **Test Framework**: Vitest with V8 coverage provider
- **CI Integration**: Coverage enforcement in GitHub Actions

#### Coverage Configuration

Coverage thresholds are enforced in `vitest.config.ts`:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
  },
});
```

#### Test Categories

1. **Unit Tests**: Test individual functions and components in isolation
2. **Integration Tests**: Test interactions between components
3. **API Tests**: Test endpoint behavior and error handling
4. **Component Tests**: Test React components with user interactions
5. **Hook Tests**: Test custom React hooks
6. **Utility Tests**: Test helper functions and utilities

#### Test Patterns

- **AAA Pattern**: Arrange, Act, Assert for clear test structure
- **Mocking**: Use `vi.mock()` for external dependencies
- **Test Isolation**: Each test runs independently
- **Edge Cases**: Test error conditions and boundary cases
- **Async Testing**: Proper handling of promises and async operations

#### Coverage Reports

Generate and view coverage reports:

```bash
# Generate coverage report
npm run test:coverage --workspace=server

# View HTML coverage report
open server/coverage/index.html

# View client coverage report
open client/coverage/index.html
```

#### CI/CD Integration

- **GitHub Actions**: Runs tests and checks coverage on all PRs
- **Coverage Enforcement**: Builds fail if coverage drops below 90%
- **Branch Protection**: Requires passing tests before merging
- **Automated Reporting**: Coverage reports uploaded to CI artifacts

#### Testing Best Practices

1. **Test Names**: Use descriptive test names that explain expected behavior
2. **Setup/Teardown**: Use proper beforeEach/afterEach for test isolation
3. **Mock External Dependencies**: Mock APIs, databases, and external services
4. **Test Real User Scenarios**: Focus on user-facing functionality
5. **Keep Tests Fast**: Unit tests should run quickly
6. **Test Error Conditions**: Include negative test cases
7. **Use Test Utilities**: Leverage testing library helpers

#### Current Coverage Status

As of the latest build:

- **Server**: 31.57% overall (target: 90%)
- **Client**: 23.06% overall (target: 90%)
- **Well-Tested Components**: Individual modules achieving 80-100% coverage

#### Improving Coverage

To contribute to coverage improvements:

1. **Add Missing Tests**: Focus on untested files and functions
2. **Test Edge Cases**: Add tests for error conditions and boundary cases
3. **Integration Tests**: Add tests for component interactions
4. **Mock External Dependencies**: Ensure external services are properly mocked
5. **Review Coverage Reports**: Use HTML reports to identify untested code paths

#### Known Coverage Gaps

Current areas needing test coverage:

- Authentication middleware (auth.ts)
- User route handlers (user-route.ts)
- Redis configuration (redis.ts)
- Landing page components
- Error boundary components
- Theme and utility functions

#### Contributing Tests

When adding new features:

1. Write tests alongside new code
2. Ensure new code meets coverage thresholds
3. Update existing tests if changing functionality
4. Run coverage locally before submitting PR
5. Fix any coverage regressions

```bash
# Test new feature with coverage
npm run test:coverage --workspace=server src/services/new-feature.test.ts

# Check coverage impact
npm run test:coverage --workspace=server
```

# Run tests with coverage

npm run test:coverage --workspace=server

````

### Testing Compression

To verify that the compression middleware is working properly, you can use the included test script:

```bash
# Start the server in development mode
npm run dev

# In another terminal, run the compression test
node test-compression.js
````

This will test both small and large responses to ensure compression is working correctly.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- OpenAI for the GPT API
- Auth0 for authentication services
- The open-source community for amazing tools and libraries

---

_Ready to transform web content? Get started with the installation guide above!_
