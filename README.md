# PagePersonAI

> Transform web content through AI-powered personas - turning ordinary articles into engaging narratives that match your preferred writing style.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?logo=mongodb&logoColor=white)](https://mongodb.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?logo=openai&logoColor=white)](https://openai.com/)
[![Auth0](https://img.shields.io/badge/Auth0-EB5424?logo=auth0&logoColor=white)](https://auth0.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

PagePersonAI revolutionizes content consumption by transforming any webpage through distinct AI personas. Whether you want to read technical documentation as if explained by a medieval knight, or convert complex articles into simple explanations, our intelligent transformation engine makes it possible.

### 🎯 Core Value Proposition

- **Personalized Content Experience**: Transform any web content to match your preferred learning style
- **Educational Enhancement**: Convert complex topics into accessible formats (ELI5, Academic, etc.)
- **Entertainment Value**: Experience familiar content through creative personas (Medieval Knight, Anime Hacker)
- **Accessibility**: Make technical content more approachable for different audiences
- **Time Efficiency**: Quickly digest information in your preferred communication style

### 🚀 Key Features

#### AI-Powered Content Transformation

- **Advanced Persona Engine**: Utilize OpenAI's GPT models with sophisticated persona prompts
- **Multi-Style Support**: ELI5, Professional, Medieval Knight, Anime Hacker, Plague Doctor, and Robot personas
- **Dual Input Methods**: Transform content from URLs or direct text paste
- **Intelligent Content Parsing**: Advanced web scraping with content extraction and cleaning

#### Enterprise-Grade Security & Performance

- **Robust Authentication**: Auth0 integration with social login support (Google, GitHub, etc.)
- **Usage Analytics**: Comprehensive tracking with tier-based access control
- **Smart Caching**: Redis-backed caching system with MongoDB persistence for optimal performance
- **Rate Limiting**: Intelligent request throttling to prevent abuse and ensure fair usage

#### Modern Development Experience

- **Responsive Design**: Mobile-first UI built with React 18 and Tailwind CSS
- **Production Ready**: Optimized builds with modern deployment practices
- **Type Safety**: End-to-end TypeScript with strict mode enabled
- **Comprehensive Testing**: Unit and integration tests with Vitest framework

## 🛠️ Technical Architecture

### System Overview

PagePersonAI implements a modern, scalable architecture designed for high performance and maintainability:

```text
┌─────────────────────────────────────────────────────────────────┐
│                          Client Layer                           │
├─────────────────────────────────────────────────────────────────┤
│  React 18 + TypeScript + Vite + Tailwind CSS + Auth0 SDK       │
│  • Responsive UI with dark mode support                        │
│  • Real-time transformation feedback                           │
│  • Progressive Web App capabilities                            │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway                              │
├─────────────────────────────────────────────────────────────────┤
│  Modern Load Balancer + Reverse Proxy                          │
│  • SSL termination and security headers                        │
│  • Request routing and static file serving                     │
│  • Rate limiting and DDoS protection                           │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Backend Services                          │
├─────────────────────────────────────────────────────────────────┤
│  Node.js + Express + TypeScript                                │
│  • RESTful API with OpenAPI documentation                      │
│  • JWT authentication with Auth0 integration                   │
│  • Middleware pipeline for validation and security             │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Data Layer                               │
├─────────────────────────────────────────────────────────────────┤
│  MongoDB + Redis + OpenAI API                                  │
│  • Document-based user and content storage                     │
│  • High-performance caching for transformed content            │
│  • AI model integration with usage optimization                │
└─────────────────────────────────────────────────────────────────┘
```

### Core Components

- **Frontend**: React SPA with TypeScript, Vite build system, and Tailwind CSS
- **Backend**: Node.js Express API with comprehensive middleware stack
- **Database**: MongoDB for persistence, Redis for caching and session management
- **AI Integration**: OpenAI GPT models with custom persona prompting
- **Authentication**: Auth0 with social login and JWT token management
- **DevOps**: Modern CI/CD pipeline with comprehensive testing

## 🚀 Quick Start

### Prerequisites

Ensure you have the following installed on your development machine:

- **Node.js**: Version 18.0.0 or higher ([Download](https://nodejs.org/))
- **npm**: Version 9.0.0 or higher (comes with Node.js)
- **MongoDB**: Local instance or cloud connection ([MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **Redis**: Optional but recommended for caching ([Redis Cloud](https://redis.com/))
- **Git**: For version control ([Download](https://git-scm.com/))

### Development Setup

1. **Clone and Setup Repository**

   ```bash
   # Clone the repository
   git clone https://github.com/sjkd23/PagePersonai.git
   cd PagePersonai

   # Install dependencies for all workspaces
   npm install

   # Verify installation
   npm run typecheck
   ```

2. **Environment Configuration**

   ```bash
   # Copy environment template
   cp .env.development .env

   # Edit with your specific values
   # Required: OPENAI_API_KEY, MONGODB_URI, AUTH0_* variables
   ```

3. **Service Dependencies**

   You'll need MongoDB and Redis running locally. You can install and run them directly:

   ```bash
   # Install MongoDB and Redis locally
   # MongoDB: Follow instructions at https://docs.mongodb.com/manual/installation/
   # Redis: Follow instructions at https://redis.io/download

   # Or use cloud services:
   # MongoDB Atlas: https://www.mongodb.com/atlas
   # Redis Cloud: https://redis.com/redis-enterprise-cloud/
   ```

4. **Launch Development Environment**

   ```bash
   # Build and start all services
   npm run build
   npm run start:dev

   # Or start services individually
   npm run start:dev --workspace=server    # Backend API
   npm run dev --workspace=client          # Frontend dev server
   ```

5. **Verify Installation**

   - **Frontend**: <http://localhost:5173> - React development server
   - **Backend API**: <http://localhost:5000> - Express server
   - **API Documentation**: <http://localhost:5000/docs> - Interactive Swagger UI
   - **Health Check**: <http://localhost:5000/api/health> - Service status

### Production Deployment

For production deployment, build the project and deploy to your preferred hosting platform:

```bash
# Build production version
npm run build

# Deploy to platforms like:
# - Netlify: Connect your GitHub repo
# - Vercel: Connect your GitHub repo  
# - Render: Connect your GitHub repo
# - Railway: Connect your GitHub repo
```

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
├── config/                  # Configuration files (Prettier)
├── shared/                  # Shared types and constants
├── server/                  # Express.js API backend
├── client/                  # React frontend
├── config/                  # Configuration files
├── eslint.config.mjs        # ESLint configuration
├── tsconfig.json           # TypeScript configuration
└── vitest.config.ts        # Vitest configuration
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

### Contributing Guidelines

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
