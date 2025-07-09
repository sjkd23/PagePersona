import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Request, Response, NextFunction } from 'express'
import { trackUsage } from '../usage-middleware'
import * as usageTracking from '../../utils/usage-tracking'

// Mock incrementUserUsage from usage-tracking
vi.mock('../../utils/usage-tracking', () => ({
  incrementUserUsage: vi.fn().mockResolvedValue(true)
}))

// Set NODE_ENV to 'test' for tests
const originalEnv = process.env.NODE_ENV;

beforeEach(() => {
  process.env.NODE_ENV = 'test';
});

afterEach(() => {
  process.env.NODE_ENV = originalEnv;
});

// Extend Request interface for testing
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string
  }
}

describe('usageMiddleware', () => {
  let mockReq: Partial<AuthenticatedRequest>
  let mockRes: Partial<Response>
  let mockNext: NextFunction
  let mockSend: ReturnType<typeof vi.fn>
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock the implementation of setImmediate to execute synchronously
    vi.spyOn(global, 'setImmediate').mockImplementation((fn: any) => {
      if (typeof fn === 'function') {
        return fn();
      }
      return undefined as any;
    });
    
    mockSend = vi.fn()
    mockNext = vi.fn()
    
    mockReq = {
      originalUrl: '/api/test',
      method: 'POST',
      body: { model: 'gpt-4o-mini' },
      get: vi.fn().mockReturnValue('100'),
      // @ts-expect-error: allow userContext for test
      userContext: undefined
    }
    
    mockRes = {
      send: mockSend
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('trackUsage middleware', () => {
    it('should call next function', async () => {
      await trackUsage(mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockNext).toHaveBeenCalled()
    })

    it('should override res.send method', async () => {
      const originalSend = mockRes.send
      
      await trackUsage(mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockRes.send).not.toBe(originalSend)
      expect(typeof mockRes.send).toBe('function')
    })

    it('should not track usage for unauthenticated users', async () => {
      // Mock unauthenticated request
      // @ts-expect-error: allow userContext for test
      mockReq.userContext = undefined
      
      await trackUsage(mockReq as Request, mockRes as Response, mockNext)
      
      // Simulate response
      const responseData = JSON.stringify({ success: true })
      mockRes.send!(responseData)
      
      // No need to wait since we mocked setImmediate to run synchronously
      expect(usageTracking.incrementUserUsage).not.toHaveBeenCalled()
    })

    it('should handle usage recording errors gracefully', async () => {
      // Mock recording error
      vi.mocked(usageTracking.incrementUserUsage).mockRejectedValueOnce(new Error('Database error'))
      
      // Mock authenticated request
      // @ts-expect-error: allow userContext for test
      mockReq.userContext = { mongoUser: { _id: 'user123' } } as any
      
      await trackUsage(mockReq as Request, mockRes as Response, mockNext)
      
      // Simulate response
      const responseData = JSON.stringify({ success: true })
      mockRes.send!(responseData)
      
      // No need to wait since we mocked setImmediate to run synchronously
      expect(mockNext).toHaveBeenCalled()
    })
  })
})

// Export default for CommonJS compatibility
export default trackUsage
