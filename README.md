# PagePersonAI

> Transform web content through AI-powered personas - turning ordinary articles into engaging narratives that match your preferred writing style.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://typescriptlang.org/)  
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)  
[![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)  
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?logo=mongodb&logoColor=white)](https://mongodb.com/)  
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?logo=openai&logoColor=white)](https://openai.com/)  
[![Auth0](https://img.shields.io/badge/Auth0-EB5424?logo=auth0&logoColor=white)](https://auth0.com/)  
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Table of Contents

- [Overview](#overview)  
- [Core Value Proposition](#core-value-proposition)  
- [Key Features](#key-features)  
- [Technical Architecture](#technical-architecture)  
- [Quick Start](#quick-start)  
- [Environment Variables](#environment-variables)  
- [API Documentation](#api-documentation)  
- [Project Structure](#project-structure)  
- [Contributing](#contributing)  
- [License](#license)  

---

## Overview

PagePersonAI transforms web content through distinct AI personas, allowing users to experience information in different communication styles. Convert technical documentation into explanations by a medieval knight, or simplify complex articles for different audiences using our content transformation system.

## Core Value Proposition

- **Personalized Content Experience**: Transform any web content to match your preferred learning style  
- **Educational Enhancement**: Convert complex topics into accessible formats (ELI5, Academic, etc.)  
- **Entertainment Value**: Experience familiar content through creative personas (Medieval Knight, Anime Hacker)  
- **Accessibility**: Make technical content more approachable for different audiences  
- **Time Efficiency**: Quickly digest information in your preferred communication style  

---

## Key Features

### AI-Powered Content Transformation

- **Advanced Persona Engine**: Utilize OpenAI's GPT models with sophisticated persona prompts  
- **Multi-Style Support**: ELI5, Professional, Medieval Knight, Anime Hacker, Plague Doctor, and Robot personas  
- **Dual Input Methods**: Transform content from URLs or direct text paste  
- **Intelligent Content Parsing**: Advanced web scraping with content extraction and cleaning  

### Enterprise-Grade Security & Performance

- **Robust Authentication**: Auth0 integration with social login support (Google, GitHub, etc.)  
- **Usage Analytics**: Comprehensive tracking with tier-based access control  
- **Smart Caching**: Redis-backed caching system with MongoDB persistence for optimal performance  
- **Rate Limiting**: Intelligent request throttling to prevent abuse and ensure fair usage  

### Modern Development Experience

- **Responsive Design**: Mobile-first UI built with React 18 and Tailwind CSS  
- **Production Ready**: Optimized builds with modern deployment practices  
- **Type Safety**: End-to-end TypeScript with strict mode enabled  
- **Comprehensive Testing**: Unit and integration tests with Vitest framework  

---

## Technical Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                          Client Layer                         │
├─────────────────────────────────────────────────────────────────┤
│  React 18 + TypeScript + Vite + Tailwind CSS + Auth0 SDK      │
│  • Responsive UI with dark mode support                        │
│  • Real-time transformation feedback                           │
│  • Progressive Web App capabilities                            │
└─────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway                            │
├─────────────────────────────────────────────────────────────────┤
│  Modern Load Balancer + Reverse Proxy                         │
│  • SSL termination and security headers                       │
│  • Request routing and static file serving                    │
│  • Rate limiting and DDoS protection                          │
└─────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Backend Services                         │
├─────────────────────────────────────────────────────────────────┤
│  Node.js + Express + TypeScript                                │
│  • RESTful API with OpenAPI documentation                      │
│  • JWT authentication with Auth0 integration                   │
│  • Middleware pipeline for validation and security             │
└─────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Data Layer                              │
├─────────────────────────────────────────────────────────────────┤
│  MongoDB + Redis + OpenAI API                                  │
│  • Document-based user and content storage                     │
│  • High-performance caching for transformed content            │
│  • AI model integration with usage optimization                │
└─────────────────────────────────────────────────────────────────┘
````

---

## Quick Start

### Prerequisites

* **Node.js** ≥ 18.0.0 ([Download](https://nodejs.org/))
* **npm** ≥ 9.0.0
* **MongoDB**: Local or Atlas
* **Redis**: Optional but recommended
* **Git**: For version control

### Development Setup

1. **Clone & Install**

   ```bash
   git clone https://github.com/sjkd23/PagePersonai.git
   cd PagePersonai
   npm install
   npm run typecheck
   ```

2. **Environment**

   ```bash
   cp .env.<production OR development>.example .env.<production OR development>
   # Edit .env with your OPENAI_API_KEY, MONGODB_URI, AUTH0_*, etc.
   ```

3. **Start Services**

   ```bash
   npm run build
   npm run start:dev
   # Or individually:
   npm run start:dev --workspace=server
   npm run dev --workspace=client
   ```

4. **Verify**

   * Frontend: [http://localhost:5173](http://localhost:5173)
   * API: [http://localhost:5000/api/health](http://localhost:5000/api/health)
   * Docs: [http://localhost:5000/docs](http://localhost:5000/docs)

---

## Environment Variables

Copy `.env.production.example` OR `.env.development.example`  to `.env.<production/development>` and fill in:

```bash
# OpenAI
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4

# Database
MONGODB_URI=

# Authentication
AUTH0_DOMAIN=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=
AUTH0_AUDIENCE=
AUTH0_ISSUER=

# Client
VITE_API_URL=http://localhost:5000/api
VITE_AUTH0_DOMAIN=
VITE_AUTH0_CLIENT_ID=
VITE_AUTH0_AUDIENCE=

# Optional
# Use rediss:// for managed Redis providers that require TLS (Render/Upstash/etc.)
REDIS_URL=rediss://<user>:<password>@<host>:<port>
PORT=5000
NODE_ENV=development
```

*(See `.env.<production/development>.example` for full details.)*

If `REDIS_URL` is missing or Redis is unavailable, the API boots in degraded mode and skips Redis-backed features where possible.

---

## API Documentation

### Main Endpoints

* **POST** `/api/transform` – Transform content with selected persona
* **GET** `/api/health` – Health check
* **GET** `/api/user/profile` – User profile

#### Example: Transform Call

```bash
curl -X POST http://localhost:5000/api/transform \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/article",
    "persona": "medieval_knight"
}'
```

## Project Structure

```text
PagePersonAI/
├── .github/                 # GitHub workflows and templates
├── .husky/                  # Git hooks
├── .vscode/                 # VS Code settings
├── client/                  # React frontend application
├── config/                  # Root configuration files
├── docs/                    # Project documentation
├── server/                  # Express.js API backend
├── shared/                  # Shared types & constants
├── .env.development.example # Development environment template
├── .env.production.example  # Production environment template
├── .gitignore              # Git ignore patterns
├── .prettierignore         # Prettier ignore patterns
├── eslint.config.mjs       # ESLint configuration
├── LICENSE                 # MIT license
├── package.json            # Root package configuration
├── README.md               # Project documentation
└── tsconfig.json           # Root TypeScript configuration
```

---

## Contributing

1. Fork & branch
2. Code & test (`npm test`)
3. Lint (`npm run lint`)
4. Commit & PR

Please follow our coding standards and run pre-commit hooks.

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
