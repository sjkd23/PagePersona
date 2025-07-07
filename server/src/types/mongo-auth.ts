import { Request } from 'express';
import { IMongoUser } from '../models/mongo-user';

// JWT payload interface
export interface JwtPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

// Extended Express Request with JWT user info
export interface JWTAuthenticatedRequest extends Request {
  jwtUser?: {
    userId: string;
    user: IMongoUser;
  };
}

// Auth response type for consistent API responses
export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: Partial<IMongoUser>;
  token?: string;
  error?: string;
}

// Login request types
export interface LoginRequest {
  login: string; // Can be email or username
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

// Profile update request
export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  preferences?: {
    theme?: 'light' | 'dark';
    language?: string;
    notifications?: boolean;
  };
}

// Change password request
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
