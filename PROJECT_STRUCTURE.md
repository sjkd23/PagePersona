# PagePersonAI - Project Structure Documentation

This document outlines the complete project structure, architectural decisions, and development guidelines for the PagePersonAI application.

## Overview

PagePersonAI is a modern full-stack application built with TypeScript, React, Node.js, and MongoDB. It transforms web content using AI-powered personas to create engaging, personalized reading experiences.

## Architecture

### Monorepo Structure

```text
PagePersonAI/
├── client/          # React frontend application
├── server/          # Node.js Express backend API
├── shared/          # Shared TypeScript types and constants
├── nginx/           # Reverse proxy configuration
├── .github/         # GitHub Actions CI/CD
├── .husky/          # Git hooks for code quality
└── docs/            # Project documentation
```

### Technology Stack

#### Frontend (client/)

* React 18 with TypeScript
* Vite for build tooling and development server
* Tailwind CSS for styling
* Auth0 for authentication
* Vitest for testing

#### Backend (server/)

* Node.js with Express and TypeScript
* MongoDB with Mongoose ODM
* OpenAI API for content transformation
* Redis for caching and session management
* Auth0 for JWT validation
* Rate limiting with express-rate-limit

#### Shared (shared/)

* TypeScript types shared between client and server
* Constants and enums for consistency
* Validation schemas and error handling

## Key Features

### 1. AI-Powered Content Transformation

* Multiple persona types (ELI5, Medieval Knight, Anime Hacker, etc.)
* URL-based content extraction with Cheerio
* Direct text transformation capability
* OpenAI GPT-4 integration with custom prompts

### 2. Authentication & Authorization

* Auth0 integration with social logins
* JWT token validation
* Role-based access control
* User profile management

### 3. Performance & Scalability

* Redis caching for API responses
* MongoDB for persistent data storage
* Rate limiting with tier-based access
* Clustering support for multi-core deployment

### 4. Developer Experience

* TypeScript for type safety
* ESLint and Prettier for code quality
* Husky for pre-commit hooks
* Comprehensive test coverage
* Hot reloading in development

## Development Workflow

### Prerequisites

* Node.js 18+
* MongoDB
* Redis (optional, falls back to in-memory)
* Auth0 account and application

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Start development servers: `npm run start:dev`

### Available Scripts

* `npm run build` - Build all workspaces
* `npm run start:dev` - Start development servers
* `npm run test` - Run tests across all workspaces
* `npm run lint` - Lint all code
* `npm run typecheck` - TypeScript type checking

## Security Considerations

### Authentication

* JWT tokens with RS256 signing
* Auth0 integration for secure authentication
* Rate limiting to prevent abuse
* CORS configuration for cross-origin requests

### Data Protection

* Environment variables for sensitive data
* Secure headers with Helmet.js
* Input validation and sanitization
* MongoDB connection string encryption

### API Security

* Rate limiting per user and IP
* Request body size limits
* HTTPS enforcement in production
* Content Security Policy headers

## Deployment

### Docker Support

* Multi-stage builds for optimized images
* Docker Compose for local development
* Nginx reverse proxy configuration
* Health checks for container monitoring

### Production Considerations

* Environment-specific configurations
* Logging and monitoring setup
* Graceful shutdown handling
* Clustering for improved performance

## File Organization

### Client Structure

```text
client/
├── src/
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── contexts/       # React context providers
│   ├── providers/      # Third-party integrations
│   ├── utils/          # Utility functions
│   ├── lib/            # External library configurations
│   └── __tests__/      # Test files
├── public/             # Static assets
└── dist/               # Build output
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
│   ├── utils/          # Utility functions
│   ├── types/          # TypeScript types
│   └── __tests__/      # Test files
└── dist/               # Compiled output
```

## Best Practices

### Code Quality

* Use TypeScript for type safety
* Follow ESLint and Prettier rules
* Write comprehensive tests
* Use descriptive variable and function names
* Add JSDoc comments for complex functions

### Performance

* Implement caching strategies
* Use lazy loading for components
* Optimize database queries
* Monitor bundle sizes
* Use CDN for static assets

### Maintenance

* Keep dependencies updated
* Monitor error rates and performance
* Implement proper logging
* Use semantic versioning
* Document API changes

## Contributing

### Development Guidelines

1. Create feature branches from `develop`
2. Follow the existing code style
3. Write tests for new functionality
4. Update documentation as needed
5. Submit pull requests for review

### Code Review Process

* All changes require peer review
* Automated tests must pass
* Type checking must pass
* Documentation must be updated

## Support

For questions, issues, or contributions:

* Create GitHub issues for bugs
* Use discussions for feature requests
* Follow the contributing guidelines
* Respect the code of conduct

---

*This documentation is maintained by the PagePersonAI development team and updated regularly to reflect the current state of the project.*
