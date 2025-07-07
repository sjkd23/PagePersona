/**
 * Test file for response helpers to ensure consistent API responses
 * Run this with: npm test -- responseHelpers.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Response } from 'express';
import { 
  sendSuccess, 
  sendError, 
  sendValidationError, 
  sendNotFound, 
  sendUnauthorized,
  sendForbidden,
  sendInternalError 
} from '../src/utils/response-helpers';

// Mock Response object
const createMockResponse = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn()
  } as unknown as Response;
  return res;
};

describe('Response Helpers', () => {
  let mockRes: Response;

  beforeEach(() => {
    mockRes = createMockResponse();
    vi.clearAllMocks();
  });

  describe('sendSuccess', () => {
    it('should send success response with data and message', () => {
      const testData = { test: 'data' };
      const testMessage = 'Operation successful';

      sendSuccess(mockRes, testData, testMessage);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: testMessage,
        data: testData
      });
    });

    it('should send success response without message when not provided', () => {
      const testData = { test: 'data' };

      sendSuccess(mockRes, testData);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: testData
      });
    });

    it('should send success response with custom status code', () => {
      sendSuccess(mockRes, null, 'Created', 201);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Created'
      });
    });
  });

  describe('sendError', () => {
    it('should send error response with default 500 status', () => {
      const errorMessage = 'Something went wrong';

      sendError(mockRes, errorMessage);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: errorMessage
      });
    });

    it('should send error response with custom status code', () => {
      const errorMessage = 'Bad request';

      sendError(mockRes, errorMessage, 400);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: errorMessage
      });
    });
  });

  describe('Specific error helpers', () => {
    it('sendValidationError should send 400 status', () => {
      sendValidationError(mockRes, 'Invalid input');

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid input'
      });
    });

    it('sendNotFound should send 404 status', () => {
      sendNotFound(mockRes, 'Resource not found');

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Resource not found'
      });
    });

    it('sendUnauthorized should send 401 status', () => {
      sendUnauthorized(mockRes, 'Access denied');

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied'
      });
    });

    it('sendForbidden should send 403 status', () => {
      sendForbidden(mockRes, 'Forbidden');

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden'
      });
    });

    it('sendInternalError should send 500 status', () => {
      sendInternalError(mockRes, 'Server error');

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server error'
      });
    });
  });
});
