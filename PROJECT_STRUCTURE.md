# PagePersonAI - Project Structure

This document outlines the project structure and development guidelines for the PagePersonAI application.

## Overview

PagePersonAI is a full-stack TypeScript application that transforms web content using AI-powered personas.

## Architecture

### Monorepo Structure

```text
PagePersonAI/
├── config/          # Configuration files (ESLint, Prettier, TypeScript)
├── client/          # React frontend application
├── server/          # Node.js Express backend API
├── shared/          # Shared TypeScript types and constants
├── nginx/           # Reverse proxy configuration
└── .github/         # GitHub Actions CI/CD
```

### Technology Stack

#### Frontend (client/)

- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Auth0 for authentication
- Vitest for testing

#### Backend (server/)

- Node.js with Express and TypeScript
- MongoDB with Mongoose ODM
- OpenAI API for content transformation
- Redis for caching
- Auth0 for JWT validation

#### Shared (shared/)

- TypeScript types shared between client and server
- Constants and personas definitions

## Key Features

### 1. AI-Powered Content Transformation

- Multiple persona types (ELI5, Medieval Knight, Anime Hacker, etc.)
- URL-based content extraction
- Direct text transformation
- OpenAI GPT-4 integration

### 2. Authentication & Authorization

- Auth0 integration with social logins
- JWT token validation
- Role-based access control

### 3. Performance & Scalability

- Redis caching for API responses
- MongoDB for persistent storage
- Rate limiting with tier-based access
- Nginx reverse proxy

## Development Workflow

### Prerequisites

- Node.js 18+
- MongoDB
- Redis (optional)
- Auth0 account

### Setup

1. Clone repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Start development: `npm run start:dev`

### Available Scripts

- `npm run build` - Build all workspaces
- `npm run start:dev` - Start development servers
- `npm run test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code

## Security

### Authentication

- JWT tokens with RS256 signing
- Auth0 integration
- Rate limiting to prevent abuse

### Data Protection

- Environment variables for sensitive data
- Input validation and sanitization
- HTTPS enforcement in production

## Deployment

### Docker Support

- Multi-stage builds
- Docker Compose for development
- Nginx reverse proxy
- Health checks

## File Organization

### Client Structure

```text
client/
├── src/
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── contexts/       # React context providers
│   ├── utils/          # Utility functions
│   └── __tests__/      # Test files
└── public/             # Static assets
```

### Server Structure

```text
server/
├── src/
│   ├── controllers/    # Request handlers
│   ├── services/       # Business logic
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── middleware/     # Express middleware
│   ├── config/         # Configuration files
│   └── __tests__/      # Test files
└── dist/               # Compiled output
```

## Best Practices

### Code Quality

- TypeScript for type safety
- ESLint and Prettier for formatting
- Comprehensive test coverage
- Descriptive naming conventions

### Performance

- Caching strategies
- Lazy loading for components
- Optimized database queries
- Bundle size monitoring

### Contributing

1. Create feature branches
2. Follow existing code style
3. Write tests for new functionality
4. Update documentation
5. Submit pull requests

---

_This documentation is maintained by the PagePersonAI development team._
