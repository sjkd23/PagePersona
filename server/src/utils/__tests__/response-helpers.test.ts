import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Response } from 'express';
import {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendInternalError,
  errorHandler,
  asyncHandler,
  sendResponse,
} from '../response-helpers';
import { HttpStatus } from '../../constants/http-status';
import type { AuthenticatedRequest } from '../../types/common';

describe('response-helpers', () => {
  let mockResponse: Partial<Response>;
  let statusSpy: any;
  let jsonSpy: any;

  beforeEach(() => {
    statusSpy = vi.fn().mockReturnThis();
    jsonSpy = vi.fn().mockReturnThis();

    mockResponse = {
      status: statusSpy,
      json: jsonSpy,
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sendSuccess', () => {
    it('should send a success response with data and message', () => {
      const data = { id: 1, name: 'test' };
      const message = 'Operation successful';

      sendSuccess(mockResponse as Response, data, message, HttpStatus.CREATED);

      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        message,
        data,
      });
    });

    it('should send a success response with only data', () => {
      const data = { id: 1 };

      sendSuccess(mockResponse as Response, data);

      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.OK);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data,
      });
    });

    it('should send a success response with only message', () => {
      const message = 'Success';

      sendSuccess(mockResponse as Response, undefined, message);

      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.OK);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        message,
      });
    });

    it('should send a minimal success response', () => {
      sendSuccess(mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.OK);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
      });
    });

    it('should not include data when it is null', () => {
      sendSuccess(mockResponse as Response, null, 'Success');

      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.OK);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
      });
    });
  });

  describe('sendError', () => {
    it('should send an error response with data', () => {
      const error = 'Something went wrong';
      const data = { field: 'value' };

      sendError(mockResponse as Response, error, HttpStatus.BAD_REQUEST, data);

      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error,
        data,
      });
    });

    it('should send an error response without data', () => {
      const error = 'Internal error';

      sendError(mockResponse as Response, error);

      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error,
      });
    });
  });

  describe('sendValidationError', () => {
    it('should send a validation error (400)', () => {
      const error = 'Invalid input';
      const data = { field: 'email', value: 'invalid' };

      sendValidationError(mockResponse as Response, error, data);

      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error,
        data,
      });
    });
  });

  describe('sendNotFound', () => {
    it('should send a not found error with custom message', () => {
      const error = 'User not found';

      sendNotFound(mockResponse as Response, error);

      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error,
      });
    });

    it('should send a not found error with default message', () => {
      sendNotFound(mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: 'Resource not found',
      });
    });
  });

  describe('sendUnauthorized', () => {
    it('should send an unauthorized error with custom message', () => {
      const error = 'Token expired';

      sendUnauthorized(mockResponse as Response, error);

      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error,
      });
    });

    it('should send an unauthorized error with default message', () => {
      sendUnauthorized(mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized access',
      });
    });
  });

  describe('sendForbidden', () => {
    it('should send a forbidden error with default message', () => {
      sendForbidden(mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: 'Access forbidden',
      });
    });
  });

  describe('sendInternalError', () => {
    it('should send an internal server error with default message', () => {
      sendInternalError(mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
      });
    });
  });

  describe('errorHandler', () => {
    let mockRequest: Partial<AuthenticatedRequest>;
    let mockNext: any;

    beforeEach(() => {
      mockRequest = {
        method: 'GET',
        originalUrl: '/api/test',
      };
      mockNext = vi.fn();
      vi.stubEnv('NODE_ENV', 'test');
    });

    it('should handle ValidationError', () => {
      const error = { name: 'ValidationError', message: 'Invalid data' };

      errorHandler(error, mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid data',
      });
    });

    it('should handle UnauthorizedError', () => {
      const error = { name: 'UnauthorizedError', message: 'Token invalid' };

      errorHandler(error, mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or missing authentication token',
      });
    });

    it('should handle 404 status errors', () => {
      const error = { status: 404, message: 'Route not found' };

      errorHandler(error, mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: 'Route not found',
      });
    });

    it('should handle generic errors in development', () => {
      vi.stubEnv('NODE_ENV', 'development');
      const error = new Error('Test error');

      errorHandler(error, mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: 'Test error',
      });
    });

    it('should handle generic errors in production', () => {
      vi.stubEnv('NODE_ENV', 'production');
      const error = new Error('Sensitive error details');

      errorHandler(error, mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: 'Something went wrong',
      });
    });

    it('should handle unknown error types', () => {
      const error = null;

      errorHandler(error, mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: 'Unknown error occurred',
      });
    });
  });

  describe('asyncHandler', () => {
    it('should call the function and pass through result', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');
      const mockReq = {} as AuthenticatedRequest;
      const mockRes = {} as Response;
      const mockNext = vi.fn();

      const wrappedFn = asyncHandler(mockFn);
      await wrappedFn(mockReq, mockRes, mockNext);

      expect(mockFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should catch and pass errors to next', async () => {
      const error = new Error('Async error');
      const mockFn = vi.fn().mockRejectedValue(error);
      const mockReq = {} as AuthenticatedRequest;
      const mockRes = {} as Response;
      const mockNext = vi.fn();

      const wrappedFn = asyncHandler(mockFn);
      await wrappedFn(mockReq, mockRes, mockNext);

      expect(mockFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('sendResponse', () => {
    it('should send success response for 2xx status codes', () => {
      const data = { test: 'data' };
      const message = 'Success';

      sendResponse(mockResponse as Response, HttpStatus.CREATED, data, undefined, message);

      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data,
        message,
      });
    });

    it('should send error response for 4xx status codes', () => {
      const error = 'Bad request';
      const data = { field: 'invalid' };

      sendResponse(mockResponse as Response, HttpStatus.BAD_REQUEST, data, error);

      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error,
        data,
      });
    });

    it('should send error response for 5xx status codes', () => {
      const error = 'Server error';

      sendResponse(mockResponse as Response, HttpStatus.INTERNAL_SERVER_ERROR, undefined, error);

      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error,
      });
    });

    it('should use default error message when none provided', () => {
      sendResponse(mockResponse as Response, HttpStatus.BAD_REQUEST);

      expect(statusSpy).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: 'An error occurred',
      });
    });
  });
});
