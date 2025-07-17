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

## Documentation Standards

### Code Documentation

All code follows comprehensive documentation standards:

#### JSDoc Comments

```typescript
/**
 * Transform content using specified persona
 *
 * @param content - The content to transform
 * @param personaId - The persona ID for transformation
 * @returns Promise resolving to transformation result
 * @throws {ValidationError} When content validation fails
 * @throws {AIServiceError} When AI service is unavailable
 *
 * @example
 * ```typescript
 * const result = await transformContent(
 *   'Hello world',
 *   'professional'
 * );
 * ```
 */
export async function transformContent(
  content: string,
  personaId: string
): Promise<TransformResult> {
  // Implementation
}
```

#### Component Documentation

```tsx
/**
 * User Profile Component
 *
 * Displays user profile information with edit capabilities.
 * Integrates with Auth0 for authentication and MongoDB for data persistence.
 *
 * @param user - User object containing profile data
 * @param onUpdate - Callback function for profile updates
 * @returns JSX element representing the user profile
 */
export function UserProfile({ user, onUpdate }: UserProfileProps) {
  // Implementation
}
```

### File-Level Documentation

Every module includes comprehensive header documentation:

```typescript
/**
 * Authentication Service Module
 *
 * Provides comprehensive authentication functionality including
 * token management, user session handling, and Auth0 integration.
 *
 * Key Features:
 * - JWT token management and validation
 * - User session state management
 * - Auth0 integration for social authentication
 * - Automatic token refresh handling
 * - Secure logout functionality
 *
 * @module AuthService
 * @version 1.0.0
 * @since 1.0.0
 */
```

### API Documentation

Complete API documentation with:

- **OpenAPI 3.0 Specification**: Machine-readable API docs
- **Swagger UI**: Interactive API documentation
- **Request/Response Examples**: Comprehensive examples
- **Error Handling**: Detailed error response documentation
- **Authentication**: Security scheme documentation

### README Standards

Each component/module includes:

- **Purpose**: What the component/module does
- **Usage**: How to use it with examples
- **Configuration**: Required configuration options
- **Dependencies**: External dependencies and requirements
- **Testing**: How to test the component/module
- **Contributing**: Guidelines for contributions

## Best Practices

### Code Quality

1. **TypeScript Strict Mode**: All code uses TypeScript with strict type checking
2. **ESLint and Prettier**: Consistent code style and formatting
3. **Comprehensive Testing**: Unit, integration, and e2e tests with >80% coverage
4. **Error Handling**: Comprehensive error handling with proper logging
5. **Performance**: Optimized code with proper caching and lazy loading

### Security Best Practices

1. **Input Validation**: All inputs validated using Zod schemas
2. **Authentication**: JWT tokens with proper expiration handling
3. **Authorization**: Role-based access control throughout the application
4. **Data Sanitization**: All user inputs sanitized before processing
5. **HTTPS**: All communication encrypted in production

### Performance

1. **Caching**: Redis caching for frequently accessed data
2. **Database Optimization**: Proper indexing and query optimization
3. **Bundle Optimization**: Code splitting and lazy loading
4. **CDN**: Static assets served from CDN in production
5. **Monitoring**: Application performance monitoring and logging

---

_This documentation is maintained by the PagePersonAI development team and updated with each release._
