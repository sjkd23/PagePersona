# Development Guide

This document provides comprehensive development guidelines, best practices, and technical documentation for contributors to the PagePersonAI project.

## 📋 Table of Contents

- [Development Environment Setup](#development-environment-setup)
- [Code Architecture](#code-architecture)
- [Development Workflow](#development-workflow)
- [Testing Strategy](#testing-strategy)
- [Code Style and Quality](#code-style-and-quality)
- [Debugging and Troubleshooting](#debugging-and-troubleshooting)
- [Performance Optimization](#performance-optimization)
- [Security Considerations](#security-considerations)
- [Deployment Guidelines](#deployment-guidelines)

## 🛠️ Development Environment Setup

### Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher  
- **MongoDB**: Version 5.0+ (local or cloud)
- **Redis**: Version 6.0+ (optional, for caching)
- **Git**: For version control
- **VS Code**: Recommended IDE with extensions

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json",
    "ms-vscode.mongodb-vscode"
  ]
}
```

### Environment Configuration

1. **Clone and install dependencies**:

   ```bash
   git clone https://github.com/sjkd23/PagePersonai.git
   cd PagePersonai
   npm install
   ```

2. **Set up environment variables**:

   ```bash
   cp .env.development .env
   ```

   Required variables:

   ```env
   # Core Services
   OPENAI_API_KEY=your_openai_api_key
   MONGODB_URI=mongodb://localhost:27017/pagepersona
   
   # Authentication
   AUTH0_DOMAIN=your-domain.auth0.com
   AUTH0_CLIENT_ID=your_client_id
   AUTH0_CLIENT_SECRET=your_client_secret
   AUTH0_AUDIENCE=your_api_identifier
   
   # Client Configuration
   VITE_API_URL=http://localhost:5000/api
   VITE_AUTH0_DOMAIN=your-domain.auth0.com
   VITE_AUTH0_CLIENT_ID=your_client_id
   VITE_AUTH0_AUDIENCE=your_api_identifier
   
   # Optional
   REDIS_URL=redis://localhost:6379
   NODE_ENV=development
   ```

3. **Database setup**:

   ```bash
   # Start MongoDB (if running locally)
   mongod --dbpath /path/to/your/data/directory
   
   # Start Redis (if running locally)
   redis-server
   ```

## 🏗️ Code Architecture

### Project Structure

```text
PagePersonAI/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # React components organized by feature
│   │   ├── hooks/          # Custom React hooks
│   │   ├── contexts/       # React context providers
│   │   ├── utils/          # Utility functions and helpers
│   │   └── lib/            # Third-party integrations
│   └── public/             # Static assets and public files
├── server/                 # Node.js Express backend
│   ├── src/
│   │   ├── controllers/    # Request handlers and business logic
│   │   ├── middleware/     # Express middleware functions
│   │   ├── models/         # Database models and schemas
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # Business logic services
│   │   ├── utils/          # Utility functions and helpers
│   │   └── types/          # TypeScript type definitions
│   └── tests/              # Test files and test utilities
├── shared/                 # Shared types and constants
│   ├── constants/          # Application constants
│   └── types/              # Shared TypeScript types
└── nginx/                  # Nginx configuration for production
```

### Core Components

#### Frontend Architecture

- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Strict type checking throughout the application
- **Vite**: Fast build tool with hot module replacement
- **Tailwind CSS**: Utility-first CSS framework
- **Auth0**: Authentication and authorization
- **React Router**: Client-side routing

#### Backend Architecture

- **Express.js**: Web framework for Node.js
- **MongoDB**: Document database with Mongoose ODM
- **Redis**: In-memory caching and session storage
- **OpenAI API**: AI content transformation
- **Auth0**: JWT authentication and user management
- **Zod**: Runtime type validation

## 🔄 Development Workflow

### Branch Strategy

We follow the GitFlow branching model:

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: New feature development
- `hotfix/*`: Critical bug fixes
- `release/*`: Release preparation

### Feature Development Process

1. **Create feature branch**:

   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **Development cycle**:

   ```bash
   # Start development servers
   npm run start:dev
   
   # Run tests in watch mode
   npm run test:watch
   
   # Type checking
   npm run typecheck
   
   # Linting
   npm run lint
   ```

3. **Code quality checks**:

   ```bash
   # Run full test suite
   npm run test
   
   # Test coverage
   npm run test:coverage
   
   # Build verification
   npm run build
   ```

4. **Commit and push**:

   ```bash
   git add .
   git commit -m "feat: add your feature description"
   git push origin feature/your-feature-name
   ```

### Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Maintenance tasks

## 🧪 Testing Strategy

### Testing Framework

- **Vitest**: Fast unit testing framework
- **React Testing Library**: Component testing
- **SuperTest**: API endpoint testing
- **MongoDB Memory Server**: Database testing

### Test Categories

#### Unit Tests

```bash
# Run unit tests
npm run test:unit

# Run with coverage
npm run test:unit:coverage
```

#### Integration Tests

```bash
# Run integration tests
npm run test:integration

# Run API tests
npm run test:api
```

#### E2E Tests

```bash
# Run end-to-end tests
npm run test:e2e
```

### Testing Best Practices

1. **Test Naming**: Use descriptive test names
2. **Test Structure**: Follow Arrange-Act-Assert pattern
3. **Mock External Dependencies**: Use mocks for external services
4. **Test Coverage**: Aim for >80% coverage
5. **Test Data**: Use factories for test data generation

## 📝 Code Style and Quality

### Code Formatting

- **ESLint**: Linting with TypeScript support
- **Prettier**: Code formatting
- **Husky**: Git hooks for pre-commit checks

### Configuration Files

- `.eslintrc.js`: ESLint configuration
- `.prettierrc`: Prettier configuration
- `tsconfig.json`: TypeScript configuration

### Style Guidelines

#### TypeScript

```typescript
// Use explicit types for function parameters and return values
function processUser(user: User): Promise<ProcessedUser> {
  return Promise.resolve(user);
}

// Use interfaces for object types
interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: boolean;
}

// Use enums for constants
enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  PREMIUM = 'premium'
}
```

#### React Components

```tsx
// Use functional components with TypeScript
interface Props {
  title: string;
  onClose: () => void;
}

export function Modal({ title, onClose }: Props) {
  return (
    <div className="modal">
      <h2>{title}</h2>
      <button onClick={onClose}>Close</button>
    </div>
  );
}
```

## 🐛 Debugging and Troubleshooting

### Development Tools

1. **React DevTools**: Browser extension for React debugging
2. **Redux DevTools**: State management debugging
3. **MongoDB Compass**: Database GUI
4. **Redis CLI**: Redis debugging

### Common Issues

#### Database Connection Issues

```bash
# Check MongoDB connection
mongo --eval "db.runCommand({connectionStatus: 1})"

# Check Redis connection
redis-cli ping
```

#### Authentication Issues

```bash
# Verify Auth0 configuration
curl -X POST https://your-domain.auth0.com/oauth/token \
  -H "Content-Type: application/json" \
  -d '{"client_id":"your-client-id","client_secret":"your-client-secret","audience":"your-audience","grant_type":"client_credentials"}'
```

### Logging and Monitoring

- **Server Logs**: Use the built-in logger for structured logging
- **Client Logs**: Use browser developer tools
- **Performance**: Use built-in performance monitoring

## ⚡ Performance Optimization

### Frontend Performance

1. **Code Splitting**: Use React.lazy for component splitting
2. **Memoization**: Use React.memo and useMemo appropriately
3. **Bundle Analysis**: Use webpack-bundle-analyzer
4. **Image Optimization**: Use next/image for optimized images

### Backend Performance

1. **Database Indexes**: Proper MongoDB indexing
2. **Caching**: Redis caching for frequently accessed data
3. **Rate Limiting**: Implement proper rate limiting
4. **Connection Pooling**: Optimize database connections

## 🔒 Security Considerations

### Authentication and Authorization

1. **JWT Tokens**: Secure token handling
2. **Route Protection**: Middleware for protected routes
3. **Input Validation**: Zod validation for all inputs
4. **CORS**: Proper CORS configuration

### Data Security

1. **Environment Variables**: Never commit secrets
2. **Input Sanitization**: Sanitize all user inputs
3. **SQL Injection**: Use parameterized queries
4. **XSS Protection**: Implement CSP headers

## 🚀 Deployment Guidelines

### Production Build

```bash
# Build all packages
npm run build

# Test production build
npm run start:prod
```

### Docker Deployment

```bash
# Build Docker images
docker-compose build

# Deploy to production
docker-compose up -d
```

### Environment-Specific Configurations

- **Development**: `.env.development`
- **Staging**: `.env.staging`
- **Production**: `.env.production`

## 📚 Additional Resources

- [React Documentation](https://reactjs.org/docs)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Auth0 Documentation](https://auth0.com/docs)

---

For questions or clarifications, please refer to the project's GitHub repository or contact the development team.
