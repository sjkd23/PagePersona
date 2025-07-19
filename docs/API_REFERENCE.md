# API Reference Documentation

Complete API reference for the PagePersonAI content transformation service.

## Base URL

```text
https://api.pagepersonai.com/api
```

Development: `http://localhost:5000/api`

## Authentication

All API endpoints require authentication via Auth0 JWT tokens. Include the token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow a consistent format:

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
  "code": "ERROR_CODE",
  "details": {
    // Optional error details
  }
}
```

## Content Transformation

### Get Available Personas

Retrieve all available personas for content transformation.

```http
GET /api/transform/personas
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "eli5",
      "name": "ELI5 (Explain Like I'm 5)",
      "description": "Simplifies complex topics for easy understanding",
      "label": "Simple & Clear",
      "exampleTexts": [
        "Imagine if...",
        "Think of it like..."
      ],
      "avatarUrl": "/images/persona_avatars/eli5.png",
      "theme": {
        "primary": "bg-green-500",
        "secondary": "bg-green-100",
        "accent": "text-green-600"
      }
    }
  ]
}
```

### Transform URL Content

Transform content from a webpage URL using a specific persona.

```http
POST /api/transform
```

**Request Body:**

```json
{
  "url": "https://example.com/article",
  "persona": "eli5",
  "options": {
    "truncateLength": 5000
  }
}
```

**Parameters:**

- `url` (string, required): The webpage URL to transform
- `persona` (string, required): The persona ID to use for transformation
- `options` (object, optional): Transformation options
  - `truncateLength` (number, optional): Maximum content length to process

**Response:**

```json
{
  "success": true,
  "data": {
    "originalContent": {
      "title": "Original Article Title",
      "content": "Original article content...",
      "url": "https://example.com/article",
      "wordCount": 1234
    },
    "transformedContent": "Transformed content in the requested persona style...",
    "persona": {
      "id": "eli5",
      "name": "ELI5 (Explain Like I'm 5)",
      "description": "Simplifies complex topics for easy understanding"
    },
    "usage": {
      "prompt_tokens": 1000,
      "completion_tokens": 500,
      "total_tokens": 1500
    }
  }
}
```

### Transform Text Content

Transform text content directly using a specific persona.

```http
POST /api/transform/text
```

**Request Body:**

```json
{
  "text": "Your text content here",
  "persona": "professional"
}
```

**Parameters:**

- `text` (string, required): The text content to transform
- `persona` (string, required): The persona ID to use for transformation

**Response:**

```json
{
  "success": true,
  "data": {
    "originalContent": {
      "title": "Direct Text Input",
      "content": "Your text content here",
      "wordCount": 10
    },
    "transformedContent": "Professionally transformed content...",
    "persona": {
      "id": "professional",
      "name": "Professional",
      "description": "Clear, concise, and professional tone"
    },
    "usage": {
      "prompt_tokens": 50,
      "completion_tokens": 100,
      "total_tokens": 150
    }
  }
}
```

## User Management

### Get User Profile

Retrieve the current user's profile information.

```http
GET /api/user/profile
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "user123",
    "email": "user@example.com",
    "username": "john_doe",
    "firstName": "John",
    "lastName": "Doe",
    "avatar": "https://example.com/avatar.jpg",
    "membership": "premium",
    "preferences": {
      "theme": "dark",
      "language": "en",
      "notifications": true
    },
    "usage": {
      "totalTransformations": 150,
      "monthlyUsage": 45,
      "monthlyLimit": 100,
      "lastTransformation": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Update User Profile

Update the current user's profile information.

```http
PUT /api/user/profile
```

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "preferences": {
    "theme": "light",
    "notifications": false
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "user123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "preferences": {
      "theme": "light",
      "language": "en",
      "notifications": false
    }
  },
  "message": "Profile updated successfully"
}
```

## Admin Operations

### List All Users

Retrieve a list of all users (admin only).

```http
GET /api/admin/users
```

**Query Parameters:**

- `page` (number, optional): Page number for pagination (default: 1)
- `limit` (number, optional): Number of users per page (default: 20)
- `search` (string, optional): Search term for filtering users

**Response:**

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user123",
        "email": "user@example.com",
        "username": "john_doe",
        "membership": "premium",
        "createdAt": "2024-01-01T00:00:00Z",
        "lastLoginAt": "2024-01-15T10:30:00Z",
        "usage": {
          "totalTransformations": 150,
          "monthlyUsage": 45
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

### Update User Membership

Update a user's membership tier (admin only).

```http
PATCH /api/admin/users/:id/membership
```

**Request Body:**

```json
{
  "membership": "premium"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "user123",
    "membership": "premium",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "message": "User membership updated successfully"
}
```

## System Monitoring

### Health Check

Check the API health status.

```http
GET /api/health
```

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 1234.56
}
```

### Advanced Health Check

Get detailed system health information (development only).

```http
GET /api/monitor/health
```

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 1234.56,
  "memory": {
    "rss": 73728000,
    "heapTotal": 52428800,
    "heapUsed": 28311552,
    "external": 1089536
  },
  "version": "v18.17.0"
}
```

### API Information

Get general API information.

```http
GET /api/
```

**Response:**

```json
{
  "message": "PagePersonAI API",
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Rate Limiting

The API implements rate limiting to ensure fair usage:

### Rate Limits by Endpoint

| Endpoint | Free Tier | Premium Tier | Admin |
|----------|-----------|--------------|-------|
| `/transform` | 10/hour | 100/hour | Unlimited |
| `/transform/text` | 5/hour | 50/hour | Unlimited |
| `/user/*` | 60/hour | 200/hour | Unlimited |
| `/admin/*` | N/A | N/A | 1000/hour |

### Rate Limit Headers

All responses include rate limit information:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642234800
```

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "limit": 100,
    "remaining": 0,
    "resetTime": "2024-01-15T11:00:00Z"
  }
}
```

## Error Codes

Common error codes and their meanings:

| Code | Description |
|------|-------------|
| `INVALID_REQUEST` | Malformed request or missing required fields |
| `UNAUTHORIZED` | Authentication required or invalid token |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `RATE_LIMIT_EXCEEDED` | Rate limit exceeded |
| `VALIDATION_ERROR` | Request validation failed |
| `INTERNAL_ERROR` | Internal server error |
| `SERVICE_UNAVAILABLE` | External service unavailable |

## SDKs and Client Libraries

### Example Usage

#### JavaScript/TypeScript (using fetch)

```javascript
// Example API client usage
const API_BASE_URL = 'http://localhost:5000/api';

async function transformContent(url, persona, token) {
  const response = await fetch(`${API_BASE_URL}/transform`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      url: url,
      persona: persona
    })
  });
  
  return response.json();
}
```

#### Python (using requests)

```python
import requests

API_BASE_URL = 'http://localhost:5000/api'

def transform_content(url, persona, token):
    response = requests.post(
        f'{API_BASE_URL}/transform',
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        },
        json={
            'url': url,
            'persona': persona
        }
    )
    return response.json()
```

## Support

For API support and questions:

- **Documentation**: [https://docs.pagepersonai.com](https://docs.pagepersonai.com)
- **GitHub Issues**: [https://github.com/sjkd23/PagePersonai/issues](https://github.com/sjkd23/PagePersonai/issues)
- **Email**: <support@pagepersonai.com>

## Changelog

### v1.0.0

- Initial API release
- Content transformation endpoints
- User management
- Admin operations
- Rate limiting
- Comprehensive error handling
