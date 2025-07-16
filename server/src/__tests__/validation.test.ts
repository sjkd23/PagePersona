import { describe, it, expect, vi } from 'vitest';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

describe('validateRequest middleware', () => {
  const mockRequest = (data: any, target: 'body' | 'query' | 'params' = 'body') => {
    const req: Partial<Request> = {};
    req[target] = data;
    return req as Request;
  };

  const mockResponse = () => {
    const res: Partial<Response> = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res as Response;
  };

  const mockNext = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const testSchema = z.object({
    name: z.string().min(1),
    age: z.number().min(0),
  });

  it('should call next() for valid data', () => {
    const req = mockRequest({ name: 'John', age: 25 });
    const res = mockResponse();
    const middleware = validateRequest(testSchema);

    middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('should return 400 with issues for invalid data', () => {
    const req = mockRequest({ name: '', age: -1 });
    const res = mockResponse();
    const middleware = validateRequest(testSchema);

    middleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Validation failed',
      issues: expect.arrayContaining([
        expect.objectContaining({
          path: ['name'],
          message: expect.stringContaining('String must contain at least 1 character'),
        }),
        expect.objectContaining({
          path: ['age'],
          message: expect.stringContaining('Number must be greater than or equal to 0'),
        }),
      ]),
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should validate query parameters when target is query', () => {
    const req = mockRequest({ name: 'John', age: 25 }, 'query');
    const res = mockResponse();
    const middleware = validateRequest(testSchema, 'query');

    middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should validate params when target is params', () => {
    const req = mockRequest({ name: 'John', age: 25 }, 'params');
    const res = mockResponse();
    const middleware = validateRequest(testSchema, 'params');

    middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should call next with error for non-Zod errors', () => {
    const req = mockRequest({ name: 'John', age: 25 });
    const res = mockResponse();
    const errorSchema = z.object({}).transform(() => {
      throw new Error('Custom error');
    });
    const middleware = validateRequest(errorSchema);

    middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    expect(res.status).not.toHaveBeenCalled();
  });
});
