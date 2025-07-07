import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Request, Response, NextFunction } from 'express'
import { trackUsage } from './usage-middleware'

// Mock the Usage model
vi.mock('../models/Usage', () => ({
  default: {
    calculateCost: vi.fn().mockReturnValue(0.001),
    recordUsage: vi.fn().mockResolvedValue(true)
  }
}))

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
    
    mockSend = vi.fn()
    mockNext = vi.fn()
    
    mockReq = {
      originalUrl: '/api/test',
      method: 'POST',
      body: { model: 'gpt-4o-mini' },
      get: vi.fn().mockReturnValue('100')
    }
    
    mockRes = {
      send: mockSend
    }
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
      const { default: Usage } = await import('../models/Usage')
      
      // Mock unauthenticated request
      mockReq.user = undefined
      
      await trackUsage(mockReq as Request, mockRes as Response, mockNext)
      
      // Simulate response
      const responseData = JSON.stringify({ success: true })
      mockRes.send!(responseData)
      
      // Wait for potential async operation
      await new Promise(resolve => setImmediate(resolve))
      
      expect(Usage.recordUsage).not.toHaveBeenCalled()
    })

    it('should handle usage recording errors gracefully', async () => {
      const { default: Usage } = await import('../models/Usage')
      
      // Mock recording error
      vi.mocked(Usage.recordUsage).mockRejectedValue(new Error('Database error'))
      
      // Mock authenticated request
      mockReq.user = { userId: 'user123' }
      
      await trackUsage(mockReq as Request, mockRes as Response, mockNext)
      
      // Simulate response
      const responseData = JSON.stringify({ success: true })
      mockRes.send!(responseData)
      
      // Wait for async operation
      await new Promise(resolve => setImmediate(resolve))
      
      // Should not throw error
      expect(mockNext).toHaveBeenCalled()
    })
  })
})

// Export default for CommonJS compatibility
export default trackUsage
