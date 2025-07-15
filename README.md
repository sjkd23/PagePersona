# PagePersonAI

Transform any webpage into your favorite writing style using AI-powered personas.  
Turn boring articles into engaging narratives, clear explanations, or creative stories.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?logo=mongodb&logoColor=white)](https://mongodb.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?logo=openai&logoColor=white)](https://openai.com/)
[![Auth0](https://img.shields.io/badge/Auth0-EB5424?logo=auth0&logoColor=white)](https://auth0.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://docker.com/)

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Clone & Install](#clone--install)
   - [Environment Setup](#environment-setup)
   - [Run in Development](#run-in-development)
   - [Run in Production](#run-in-production)
3. [Docker Deployment](#docker-deployment)
4. [Environment Variables](#environment-variables)
5. [API Documentation](#api-documentation)
6. [Contributing](#contributing)
7. [Versioning](#versioning)
8. [Monorepo Structure](#monorepo-structure)
9. [Development Workflow](#development-workflow)
10. [Testing](#testing)
11. [License](#license)

---

## Project Overview

## Project Overview

PagePersonAI reimagines web content through different writing personas. Want to read a technical article as if it were written by a medieval knight? Or understand complex topics through simple explanations? This tool makes it happen.

### Key Features

- **AI-Powered Transformations**: Uses OpenAI's GPT models with custom persona prompts
- **Multiple Personas**: ELI5, Medieval Knight, Anime Hacker, Plague Doctor, and Robot
- **Flexible Input**: Transform content from URLs or paste text directly  
- **Secure Authentication**: Auth0 integration with social logins
- **Usage Tracking**: Rate limiting and analytics with tier-based access
- **Smart Caching**: Redis-backed caching with MongoDB persistence
- **Response Compression**: Gzip compression for optimized API responses
- **Modern Interface**: Responsive React UI with Tailwind CSS
- **Production Ready**: Docker containerization and CI/CD pipeline
- **Well Tested**: Comprehensive test coverage

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- MongoDB instance (local or cloud)
- Redis instance (optional, for caching)
- Docker and docker-compose (for containerized deployment)
- OpenAI API key
- Auth0 tenant and application

### Clone & Install

```bash
# Clone the repository
git clone https://github.com/<org>/PagePersonAI.git
cd PagePersonAI

# Install all dependencies for all workspaces
npm install

# Build all workspaces
npm run build
```

### Environment Setup

```bash
# Copy environment template
cp .env.development .env

# Edit .env with your values
# See Environment Variables section below for detailed configuration
```

### Run in Development

```bash
# Start development servers (server + client)
npm run start:dev

# Or start individual services
npm run start:dev --workspace=server
npm run dev --workspace=client
```

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
```

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
```

### Client Variables (VITE_ prefix)

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

All API endpoints require a valid Auth0 JWT token in the Authorization header:

```bash
Authorization: Bearer <jwt_token>
```

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
└── middleware/__tests__/ # Middleware tests

client/src/
├── __tests__/           # App-level tests
├── components/__tests__/ # Component tests
├── hooks/__tests__/     # Hook tests
└── utils/__tests__/     # Utility tests
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
```

### Testing Compression

To verify that the compression middleware is working properly, you can use the included test script:

```bash
# Start the server in development mode
npm run dev

# In another terminal, run the compression test
node test-compression.js
```

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

*Ready to transform web content? Get started with the installation guide above!*
