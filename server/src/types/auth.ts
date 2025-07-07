import { Request } from 'express';
import type { ApiResponse } from './api-response';

// Extended Express Request with Auth0 user info
export interface AuthenticatedRequest extends Request {
  auth?: {
    sub: string;           // Auth0 user ID
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
    aud?: string[];        // Audience
    iss?: string;          // Issuer
    iat?: number;          // Issued at
    exp?: number;          // Expires at
    azp?: string;          // Authorized party
    scope?: string;
  };
}

// User profile from our database
export interface UserProfile {
  id: string;
  auth0Id: string;
  email: string;
  name?: string;
  picture?: string;
  createdAt: Date;
  updatedAt: Date;
  preferences?: {
    theme?: 'light' | 'dark';
    language?: string;
    notifications?: boolean;
  };
}

// Usage tracking types
export interface UsageRecord {
  id: string;
  userId: string;           // References User.auth0Id
  endpoint: string;         // e.g., '/api/gpt/chat'
  method: string;          // GET, POST, etc.
  tokensUsed?: number;     // For GPT API calls
  cost?: number;           // Calculated cost
  requestSize?: number;    // Request payload size
  responseSize?: number;   // Response payload size
  duration: number;        // Request duration in ms
  success: boolean;        // Whether request succeeded
  timestamp: Date;
  metadata?: {
    model?: string;        // GPT model used
    temperature?: number;  // GPT parameters
    maxTokens?: number;
    userAgent?: string;
    ip?: string;
  };
}

export interface UsageSummary {
  userId: string;
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  successRate: number;
  avgResponseTime: number;
  lastActive: Date;
  period: {
    start: Date;
    end: Date;
  };
}
