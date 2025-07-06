# PagePersonAI

A modern web application that transforms webpage content using AI-powered personas, bringing your favorite writing styles to any web content.

![PagePersonAI](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![MongoDB](https://img.shields.io/badge/MongoDB-7-green)

## Features

- **AI-Powered Content Transformation** - Transform any webpage content with different AI personas
- **Auth0 Authentication** - Secure user authentication and management  
- **Usage Tracking** - Monitor user transformations and usage limits
- **Caching System** - Fast content delivery with intelligent caching
- **Modern UI** - Clean, responsive interface built with React and Tailwind CSS
- **Web Scraping** - Extract and transform content from any URL
- **Multiple Personas** - Choose from various writing styles (Hemingway, Shakespeare, etc.)

## Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS
- Auth0 React SDK

**Backend:**
- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- Auth0 JWT verification
- OpenAI API integration

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally or cloud instance
- Auth0 account and application configured
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/PagePersonAI.git
   cd PagePersonAI
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server && npm install
   
   # Install client dependencies  
   cd ../client && npm install
   ```

3. **Environment Setup**
   
   **Option 1: Single .env.local file (Recommended)**
   ```bash
   cp .env.example .env.local
   ```
   
   **Option 2: Separate environment files**
   ```bash
   # For client
   cd client && cp .env.example .env.local
   
   # For server
   cd ../server && cp .env.example .env
   ```
   
   Configure your environment variables (see `.env.example` for all required variables):
   - OpenAI API key (REQUIRED)
   - MongoDB connection string (REQUIRED)
   - Auth0 credentials (REQUIRED for production)
   - JWT secret (REQUIRED)

4. **Start Development Servers**
   
   **Option 1: Using the batch file (Windows)**
   ```bash
   start-dev.bat
   ```
   
   **Option 2: Manual start**
   ```bash
   # Terminal 1 - Backend
   cd server && npm run dev
   
   # Terminal 2 - Frontend  
   cd client && npm run dev
   ```

5. **Access Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000/api

## Project Structure

```
PagePersonAI/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks (Auth0, etc.)
│   │   ├── utils/          # API utilities
│   │   ├── types/          # TypeScript definitions
│   │   └── data/           # Static data (personas)
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth & validation
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utilities
│   └── package.json
├── .env.example           # Environment variables template
├── start-dev.bat          # Windows development startup script
└── README.md
```

## Development Commands

### Server
```bash
npm run dev      # Start development server with hot reload
npm run build    # Build for production
npm start        # Start production server
```

### Client  
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Architecture

### Authentication Flow
1. User authenticates via Auth0
2. Server validates JWT tokens
3. User context stored in MongoDB
4. Session tracking for usage limits

### Content Transformation
1. User inputs URL or text content
2. Web scraper extracts content
3. Content sent to OpenAI with selected persona
4. Transformed content cached for performance
5. Results displayed with formatted output

## Deployment

### Environment Variables for Production
Ensure all environment variables from `.env.example` are configured in your production environment.

### Auth0 Setup
1. Create Auth0 Application (Single Page Application)
2. Configure allowed callback URLs, logout URLs, and web origins
3. Create Auth0 API with appropriate identifier
4. Set up Post-Login Action for automatic user profile creation

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the Proprietary License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenAI for the GPT API
- Auth0 for authentication services
- The amazing open-source community
