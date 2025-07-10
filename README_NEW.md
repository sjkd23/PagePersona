# PagePersonAI

> **Transform any webpage into your favorite writing style using AI-powered personas.**  
> Convert dry articles into engaging narratives, clear summaries, or whimsical stories—instantly and intelligently.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?logo=mongodb&logoColor=white)](https://mongodb.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?logo=openai&logoColor=white)](https://openai.com/)
[![Auth0](https://img.shields.io/badge/Auth0-EB5424?logo=auth0&logoColor=white)](https://auth0.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://docker.com/)

---

## 🌟 Overview

PagePersonAI is a sophisticated AI-powered content transformation platform that allows users to reimagine any webpage or text through the lens of different writing personas. Whether you want to read a technical article as if it were written by Hemingway, or understand complex concepts through a medieval knight's perspective, PagePersonAI makes content more accessible, engaging, and fun.

### ✨ Key Features

- **🤖 AI-Powered Transformations**: Leverages OpenAI's GPT models with carefully crafted persona-specific prompts
- **🎭 Multiple Personas**: Choose from Hemingway, Medieval Knight, Anime Hero, ELI5, and more
- **🔗 URL & Text Input**: Transform content directly from URLs or paste text manually  
- **🔐 Secure Authentication**: Auth0 integration with social logins and JWT-based API security
- **📊 Usage Tracking**: Smart rate limiting and usage analytics with tier-based access
- **💾 Intelligent Caching**: Redis-backed caching with MongoDB persistence for optimal performance
- **🎨 Modern UI/UX**: Responsive React interface with Tailwind CSS and accessibility features
- **🐳 Production Ready**: Complete Docker containerization and CI/CD pipeline
- **🧪 Thoroughly Tested**: 670+ tests with comprehensive coverage across frontend and backend

---

## 🏗️ Architecture

```mermaid
graph TB
    subgraph "Frontend (React + Vite)"
        A[User Interface]
        B[Auth0 Provider]
        C[Theme Context]
        D[API Client]
    end
    
    subgraph "Backend (Express + TypeScript)"
        E[Auth Middleware]
        F[Rate Limiting]
        G[Input Validation]
        H[Transform Service]
    end
    
    subgraph "AI Pipeline"
        I[Web Scraper]
        J[Content Parser]
        K[Prompt Builder]
        L[OpenAI Client]
    end
    
    subgraph "Data Layer"
        M[(MongoDB)]
        N[(Redis Cache)]
        O[Auth0]
    end
    
    A --> B
    B --> O
    A --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    I --> J
    J --> K
    K --> L
    H --> M
    H --> N
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 20.0.0
- **npm** ≥ 9.0.0
- **MongoDB** (local or cloud)
- **Auth0** account
- **OpenAI** API key
- **Redis** (optional, graceful fallback)

### 🐳 Docker Deployment (Recommended)

1. **Clone and configure**:
   ```bash
   git clone https://github.com/yourusername/PagePersonAI.git
   cd PagePersonAI
   cp .env.docker .env
   ```

2. **Update environment variables** in `.env`:
   ```bash
   OPENAI_API_KEY=your_openai_api_key
   AUTH0_DOMAIN=your-domain.auth0.com
   AUTH0_CLIENT_ID=your_client_id
   AUTH0_AUDIENCE=your_api_identifier
   MONGODB_URI=mongodb://admin:password@mongodb:27017/pagepersona
   ```

3. **Deploy with Docker Compose**:
   ```bash
   docker-compose up -d
   ```

4. **Access your application**:
   - **Frontend**: http://localhost
   - **Backend API**: http://localhost:5000
   - **Health Check**: http://localhost:5000/api/health

### 💻 Local Development

1. **Install dependencies**:
   ```bash
   npm install
   cd client && npm install
   cd ../server && npm install
   ```

2. **Configure environment**:
   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env.local
   # Edit both files with your credentials
   ```

3. **Start development servers**:
   ```bash
   # Terminal 1 - Backend
   cd server && npm run dev
   
   # Terminal 2 - Frontend  
   cd client && npm run dev
   ```

---

## 📁 Project Structure

```
PagePersonAI/
├── 🎨 client/                    # React frontend application
│   ├── public/                   # Static assets and icons
│   ├── src/
│   │   ├── components/           # React components
│   │   │   ├── auth/            # Authentication components
│   │   │   ├── Header/          # Navigation header
│   │   │   ├── Landing/         # Landing page
│   │   │   ├── PersonaSelector/ # Persona selection UI
│   │   │   └── Transformer/     # Main transformation interface
│   │   ├── contexts/            # React contexts (Auth, Theme)
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # API client and utilities
│   │   ├── utils/               # Utility functions
│   │   └── __tests__/           # Component and integration tests
│   ├── Dockerfile               # Production container definition
│   ├── nginx.conf              # Production nginx configuration
│   └── vite.config.ts          # Vite build configuration
│
├── 🖥️ server/                    # Express backend API
│   ├── src/
│   │   ├── config/              # Configuration management
│   │   ├── controllers/         # Route controllers
│   │   ├── middleware/          # Express middleware
│   │   │   ├── auth0-middleware.ts     # JWT authentication
│   │   │   ├── rate-limit-middleware.ts # Rate limiting
│   │   │   ├── usage-middleware.ts     # Usage tracking
│   │   │   └── validation-schemas.ts   # Input validation
│   │   ├── models/              # MongoDB data models
│   │   ├── routes/              # API route definitions
│   │   ├── services/            # Core business logic
│   │   │   ├── content-transformer.ts  # Main transformation pipeline
│   │   │   ├── openaiClient.ts         # OpenAI API integration
│   │   │   ├── parser.ts              # Content parsing
│   │   │   ├── promptBuilder.ts       # AI prompt construction
│   │   │   ├── scraper.ts             # Web content extraction
│   │   │   └── user-service.ts        # User management
│   │   ├── types/               # TypeScript type definitions
│   │   ├── utils/               # Utility functions and helpers
│   │   └── __tests__/           # Service and integration tests
│   ├── Dockerfile               # Production container definition
│   └── tsconfig.json           # TypeScript configuration
│
├── 🔗 shared/                    # Shared types and constants
│   ├── constants/               # Persona definitions and prompts
│   ├── types/                   # Shared TypeScript interfaces
│   └── utils/                   # Shared utility functions
│
├── 🐳 DevOps & Deployment
│   ├── .github/workflows/       # CI/CD pipeline (GitHub Actions)
│   ├── docker-compose.yml       # Multi-service orchestration
│   ├── deploy.sh               # Production deployment script
│   └── DOCKER.md               # Docker usage guide
│
└── 📚 Documentation
    ├── README.md               # This comprehensive guide
    └── LICENSE                 # License information
```

---

## 🔧 Core Services & Architecture

### Frontend Architecture

**Modern React Stack**:
- **React 19** with hooks and functional components
- **Vite** for lightning-fast development and optimized builds
- **TypeScript** for type safety throughout
- **Tailwind CSS** for responsive, utility-first styling
- **Auth0 React SDK** for seamless authentication
- **Vitest** for comprehensive testing

**Key Components**:
- `TransformationPage`: Main UI for content transformation
- `PersonaSelector`: Interactive persona selection with previews
- `AuthProvider`: Centralized authentication state management
- `ThemeProvider`: Dark/light mode with system preference detection

### Backend Architecture

**Enterprise-Grade Express API**:
- **Express.js** with TypeScript for robust server-side logic
- **MongoDB + Mongoose** for flexible data persistence
- **Redis** for high-performance caching and session management
- **Zod** for runtime input validation and type safety
- **JWT + Auth0** for secure authentication and authorization

**Service Layer**:
```typescript
// Content Transformation Pipeline
ScraperService → ParserService → PromptBuilderService → OpenAIClientService
```

1. **ScraperService**: Extracts clean content from URLs using Puppeteer/Cheerio
2. **ParserService**: Cleans, normalizes, and validates text content
3. **PromptBuilderService**: Constructs persona-specific AI prompts
4. **OpenAIClientService**: Manages OpenAI API communication with error handling

### Data Models

**User Management**:
```typescript
interface UserProfile {
  auth0Id: string;
  email: string;
  displayName: string;
  membershipTier: 'free' | 'premium' | 'admin';
  usageStats: UsageStats;
  preferences: UserPreferences;
}
```

**Content Transformation**:
```typescript
interface TransformationRequest {
  input: { type: 'url' | 'text'; content: string };
  persona: PersonaId;
  options: TransformationOptions;
}
```

---

## 🎭 Available Personas

Each persona includes carefully crafted system prompts, tone modifiers, and example outputs:

| Persona | Description | Style |
|---------|-------------|-------|
| **Hemingway** | Concise, powerful prose with short sentences | Literary minimalism |
| **Medieval Knight** | Heroic tales of honor and chivalry | Epic fantasy |
| **Anime Hero** | Energetic, dramatic storytelling | Japanese anime style |
| **ELI5** | Complex concepts explained simply | Educational clarity |
| **Detective** | Mysterious, analytical investigation | Noir mystery |
| **Poet** | Beautiful, metaphorical expression | Lyrical artistry |
| **Scientist** | Precise, evidence-based explanation | Academic rigor |
| **Philosopher** | Deep, thoughtful contemplation | Intellectual discourse |

---

## 🔐 Security & Authentication

### Auth0 Integration
- **Multi-provider login**: Google, Apple, Magic Link, username/password
- **JWT-based API security** with automatic token refresh
- **Custom claims** for user roles and permissions
- **Secure logout** with token revocation

### Security Measures
- **Input validation** with Zod schemas on all endpoints
- **Rate limiting** with Redis-backed counters
- **CORS protection** with configurable origins
- **SQL injection prevention** through Mongoose ODM
- **XSS protection** with Content Security Policy headers
- **Secure headers** including HSTS, X-Frame-Options, X-Content-Type-Options

### Usage & Rate Limiting
```typescript
// Tier-based rate limits
const rateLimits = {
  free: { requests: 10, window: '1h' },
  premium: { requests: 100, window: '1h' },
  admin: { requests: 1000, window: '1h' }
};
```

---

## 🧪 Testing & Quality Assurance

### Comprehensive Test Suite
- **670+ tests** across frontend and backend
- **Unit tests** for all services and utilities
- **Integration tests** for API endpoints
- **Component tests** for React components
- **E2E scenarios** for critical user flows

### Code Quality
- **ESLint** with TypeScript rules and auto-fixing
- **Prettier** for consistent code formatting
- **Husky** pre-commit hooks for quality gates
- **TypeScript strict mode** for maximum type safety

### Test Coverage
```bash
# Run all tests
npm run test:all

# Generate coverage reports  
npm run test:coverage

# Watch mode for development
npm run test:watch
```

---

## 🚀 Deployment & DevOps

### Docker Containerization
- **Multi-stage builds** for optimized production images
- **Security scanning** with non-root containers
- **Health checks** for all services
- **Volume persistence** for databases

### CI/CD Pipeline (GitHub Actions)
- **Automated testing** on every push and PR
- **Security scanning** for vulnerabilities
- **Docker image building** and registry push
- **Deployment automation** to production environments

### Monitoring & Observability
- **Health check endpoints** for uptime monitoring
- **Structured logging** with Winston
- **Error tracking** integration ready
- **Performance metrics** collection

### Scaling Considerations
- **Horizontal scaling** support with Redis session store
- **Load balancer ready** with stateless design
- **Database connection pooling** for optimal performance
- **CDN integration** for static asset delivery

---

## 📊 API Reference

### Authentication
All protected endpoints require JWT bearer token:
```
Authorization: Bearer <jwt_token>
```

### Core Endpoints

#### Transform Content
```http
POST /api/transform
Content-Type: application/json

{
  "url": "https://example.com/article",
  "persona": "hemingway"
}
```

#### Transform Text Directly
```http
POST /api/transform/text
Content-Type: application/json

{
  "text": "Your content here...",
  "persona": "medieval-knight"
}
```

#### Get Available Personas
```http
GET /api/transform/personas
```

#### User Profile Management
```http
GET /api/user/profile
PUT /api/user/profile
```

### Response Format
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
```

---

## 🛠️ Development Guide

### Environment Configuration

**Server (.env)**:
```bash
# Core Configuration
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pagepersonai

# Authentication  
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_AUDIENCE=https://api.pagepersonai.com
JWT_SECRET=your-32-character-secret-key

# AI Integration
OPENAI_API_KEY=sk-your-openai-key
OPENAI_MODEL=gpt-4

# Optional Services
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
```

**Client (.env.local)**:
```bash
VITE_API_URL=http://localhost:5000/api
VITE_AUTH0_DOMAIN=your-domain.auth0.com  
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=https://api.pagepersonai.com
```

### Adding New Personas

1. **Define persona in shared constants**:
```typescript
// shared/constants/personas.ts
export const newPersona: FullPersona = {
  id: 'new-persona',
  name: 'New Persona',
  description: 'Description of the persona',
  systemPrompt: 'AI instruction prompt...',
  // ... other properties
};
```

2. **Add avatar image**:
```bash
# Add to client/public/images/persona_avatars/
new-persona.png
```

3. **Update persona mapping**:
```typescript
// shared/utils/persona-mapping.ts
export const personaMapping = {
  // ... existing personas
  'new-persona': newPersona
};
```

### Performance Optimization

**Frontend**:
- Code splitting with dynamic imports
- Image optimization with proper formats
- Lazy loading for non-critical components
- Service worker for offline functionality

**Backend**:
- MongoDB indexing for frequent queries
- Redis caching for expensive operations
- Connection pooling for database efficiency
- Response compression middleware

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Code Standards
- Follow existing TypeScript patterns
- Add tests for new functionality
- Update documentation for API changes
- Ensure all tests pass before submitting

### Areas for Contribution
- 🎭 New persona development
- 🌐 Internationalization support
- 📱 Mobile app development
- 🔌 Third-party integrations
- 📈 Analytics and insights
- 🎨 UI/UX improvements

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **OpenAI** for providing the GPT models that power our transformations
- **Auth0** for robust authentication infrastructure  
- **MongoDB** for flexible data storage
- **Vercel** for inspiration on modern full-stack architecture
- **Tailwind Labs** for the excellent CSS framework
- The **open-source community** for the incredible tools that make this possible

---

## 📞 Support

- **Documentation**: [GitHub Wiki](https://github.com/yourusername/PagePersonAI/wiki)
- **Issues**: [GitHub Issues](https://github.com/yourusername/PagePersonAI/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/PagePersonAI/discussions)
- **Email**: support@pagepersonai.com

---

<div align="center">

**Made with ❤️ by the PagePersonAI Team**

⭐ Star us on GitHub if you find this project useful!

</div>
