# PagePersonAI API Documentation

## Overview

The PagePersonAI API provides intelligent content transformation services using AI-powered personas. This RESTful API enables developers to integrate content transformation capabilities into their applications, supporting both webpage URL processing and direct text transformation.

### Key Capabilities

- **Content Transformation**: Convert any text or webpage into different writing styles
- **Multiple Personas**: Support for diverse writing styles (ELI5, Professional, Medieval, etc.)
- **Authentication**: Secure JWT-based authentication with Auth0 integration
- **Rate Limiting**: Intelligent usage controls with tier-based access
- **Caching**: High-performance caching for improved response times
- **Analytics**: Comprehensive usage tracking and analytics

### API Characteristics

- **Protocol**: REST over HTTPS
- **Data Format**: JSON request/response
- **Authentication**: JWT Bearer tokens
- **Rate Limiting**: Per-user and per-endpoint limits
- **Caching**: Redis-backed response caching
- **Error Handling**: Standardized error responses with detailed messages

## API Documentation

### Swagger UI

- **Local Development**: [http://localhost:5000/docs](http://localhost:5000/docs)
- **OpenAPI Specification**: [http://localhost:5000/docs.json](http://localhost:5000/docs.json)

### Base URL

- **Local Development**: `http://localhost:5000`
- **Production**: TBD

## Authentication

Most endpoints require authentication via Auth0 JWT tokens. Include the token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

## Endpoints Overview

### Transform Service

- `GET /api/transform/personas` - Get available personas
- `POST /api/transform` - Transform webpage content
- `POST /api/transform/text` - Transform text directly

### User Management

- `GET /api/user/profile` - Get user profile (authenticated)
- `PUT /api/user/profile` - Update user profile (authenticated)

### Admin Operations

- `GET /api/admin/users` - List all users (admin only)
- `PATCH /api/admin/users/:id/membership` - Update user membership (admin only)

### System Monitoring

- `GET /api/health` - Health check
- `GET /` - API information

## Quick Start

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Start development server**:

   ```bash
   npm run dev
   ```

3. **Access API documentation**:
   Open [http://localhost:5000/docs](http://localhost:5000/docs) in your browser

## Example Usage

### Transform Webpage Content

```bash
curl -X POST http://localhost:5000/api/transform \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "url": "https://example.com/article",
    "persona": "professional",
    "options": {
      "truncateLength": 5000
    }
  }'
```

### Transform Text Directly

```bash
curl -X POST http://localhost:5000/api/transform/text \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "text": "Your text content here",
    "persona": "casual"
  }'
```

## Response Format

All API responses follow this standard format:

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Optional success message"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- Transform endpoints: Limited per user
- Admin endpoints: Stricter limits
- Public endpoints: Basic rate limiting

## Development

### Building the Project

```bash
npm run build
```

### Running Tests

```bash
npm test
npm run test:coverage
```

### Linting

```bash
npm run lint
```

## Contributing

1. Follow the existing code style
2. Add appropriate OpenAPI documentation for new endpoints
3. Update this README when adding new features
4. Ensure all tests pass before submitting

## License

MIT License - see LICENSE file for details
