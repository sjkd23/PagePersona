import { Request, Response, NextFunction } from 'express';
import { incrementUserUsage } from '../utils/usage-tracking';
import type { AuthenticatedRequest } from '../types/common';
import { logger } from '../utils/logger';

// Middleware to track API usage
export const trackUsage = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const originalSend = res.send;

  // Override res.send to capture response data
  res.send = function(data: unknown) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Extract user ID from authenticated request
    const userId = req.userContext?.mongoUser?._id?.toString();
    
    if (userId) {
      // Capture response data for analysis
      let responseSize = 0;
      let tokensUsed = 0;
      let model = '';

      try {
        if (typeof data === 'string') {
          responseSize = Buffer.byteLength(data, 'utf8');
          
          // Parse response to extract usage data (for GPT calls)
          const parsed = JSON.parse(data);
          if (parsed.usage) {
            tokensUsed = parsed.usage.total_tokens || 0;
            model = req.body?.model || 'gpt-4o-mini';
          }
        }
      } catch (error) {
        // Not JSON or parsing failed, continue
      }

      // Record usage asynchronously using MongoDB system (don't block response)
     // Use direct execution in tests or setImmediate in production
     const recordUsage = async () => {
        try {
          // Use the MongoDB-based usage tracking
          await incrementUserUsage(userId, { 
            logSuccess: true, 
            logErrors: true 
          });

          // Log detailed API usage for monitoring
          logger.usage.info('API usage tracked', {
            userId,
            endpoint: req.originalUrl,
            method: req.method,
            tokensUsed: tokensUsed || 0,
            responseSize,
            duration,
            success: res.statusCode >= 200 && res.statusCode < 400,
            model: model || undefined
          });
        } catch (error) {
          logger.usage.error('Error recording usage:', error);
        }
     };

     // In test environment, run synchronously; otherwise use setImmediate
     if (process.env.NODE_ENV === 'test') {
       // Execute immediately for tests
       recordUsage();
     } else {
       setImmediate(recordUsage);
     }
    }

    // Call the original send function
    return originalSend.call(this, data);
  };

  next();
};

export default trackUsage;
