# Shared Package - Type Definitions and Constants

The shared package contains TypeScript type definitions and constants that are used across both the client and server applications in the PagePersonAI project.

## Overview

This package ensures type safety and consistency between the frontend and backend by providing:

- **Type definitions** for API requests and responses
- **Shared constants** for personas, prompts, and error handling
- **Validation schemas** for data consistency
- **Error handling utilities** with user-friendly messages

## Package Structure

```text
shared/
├── constants/
│   ├── index.ts          # Export all constants
│   ├── personas.ts       # Persona definitions and utilities
│   └── prompts.ts        # System prompts for AI interactions
├── types/
│   ├── index.ts          # Export all types
│   ├── api.ts            # API request/response types
│   ├── errors.ts         # Error handling types
│   ├── personas.ts       # Persona-related types
│   └── user.ts           # User-related types
├── index.ts              # Main export file
├── package.json          # Package configuration
└── tsconfig.json         # TypeScript configuration
```

## Key Components

### Types

#### API Types (`types/api.ts`)
- `ApiResponse<T>` - Standard API response wrapper
- `ApiError` - Error response structure
- `LoadingState` - UI loading state management

#### Persona Types (`types/personas.ts`)
- `BasePersona` - Core persona properties
- `ServerPersona` - Server-side persona with full details
- `ClientPersona` - Client-side persona with limited info
- `FullPersona` - Complete persona with all metadata
- `TransformRequest` - Content transformation request
- `TransformResponse` - Content transformation response

#### User Types (`types/user.ts`)
- `User` - User profile information
- `UserProfile` - Extended user profile data
- `ChatMessage` - Chat message structure
- `ConversationHistory` - Chat conversation data

#### Error Types (`types/errors.ts`)
- `ErrorCode` - Standardized error codes
- `ERROR_MESSAGES` - User-friendly error messages
- `UserFriendlyError` - Client-facing error structure
- `ErrorMapper` - Error transformation utilities

### Constants

#### Personas (`constants/personas.ts`)
- `PERSONAS` - Server-side persona definitions
- `CLIENT_PERSONAS` - Client-side persona definitions  
- `FULL_PERSONAS` - Complete persona definitions
- Utility functions for persona management

#### Prompts (`constants/prompts.ts`)
- `BASE_SYSTEM_PROMPT` - Base AI system prompt
- Additional prompt templates and configurations

## Usage Examples

### In Client Application

```typescript
import { 
  TransformRequest, 
  TransformResponse, 
  ClientPersona,
  ApiResponse 
} from '@pagepersonai/shared';

// Use types for API calls
const transformContent = async (
  request: TransformRequest
): Promise<ApiResponse<TransformResponse>> => {
  // Implementation
};

// Use persona constants
import { CLIENT_PERSONAS } from '@pagepersonai/shared';
const availablePersonas: ClientPersona[] = CLIENT_PERSONAS;
```

### In Server Application

```typescript
import { 
  ServerPersona, 
  UserProfile,
  ErrorCode,
  ERROR_MESSAGES 
} from '@pagepersonai/shared';

// Use server-side types
const processUser = (profile: UserProfile) => {
  // Implementation
};

// Use error handling
import { ErrorMapper } from '@pagepersonai/shared';
const error = ErrorMapper.mapError(ErrorCode.VALIDATION_ERROR);
```

## Development

### Building

```bash
npm run build
```

### Type Checking

```bash
npm run typecheck
```

### Testing

```bash
npm run test
```

## Best Practices

### Type Safety
- Always use the appropriate type variants (Client vs Server vs Full)
- Leverage TypeScript's strict mode for better type checking
- Use type guards for runtime type validation

### Error Handling
- Use standardized error codes from `ErrorCode` enum
- Map errors to user-friendly messages using `ERROR_MESSAGES`
- Implement consistent error response structure

### Constants Management
- Keep persona definitions in sync between client and server
- Use utility functions for persona operations
- Maintain version compatibility between shared and consuming packages

## Version Compatibility

The shared package follows semantic versioning:
- **Major versions** for breaking changes to types or constants
- **Minor versions** for new features and non-breaking additions
- **Patch versions** for bug fixes and documentation updates

## Contributing

When adding new types or constants:

1. Update the appropriate files in `types/` or `constants/`
2. Export new items in the respective `index.ts` files
3. Update the main `index.ts` file if needed
4. Add documentation and examples
5. Run type checking and tests
6. Update version in `package.json`

## Integration Notes

### Client Integration
- Types are used for API client interfaces
- Constants provide UI data for persona selection
- Error types enable consistent error handling

### Server Integration  
- Types validate API request/response structure
- Constants provide business logic data
- Error utilities standardize error responses

---

*This package is maintained by the PagePersonAI development team and is central to maintaining consistency across the application.*
