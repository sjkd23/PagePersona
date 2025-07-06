import { Request, Response, NextFunction } from 'express';
import Usage from '../models/Usage';

// Middleware to track API usage
export const trackUsage = async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const originalSend = res.send;

  // Override res.send to capture response data
  res.send = function(data: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Extract user ID from authenticated request
    const userId = (req as any).user?.userId;
    
    if (userId) {
      // Capture response data for analysis
      let responseSize = 0;
      let tokensUsed = 0;
      let cost = 0;
      let model = '';

      try {
        if (typeof data === 'string') {
          responseSize = Buffer.byteLength(data, 'utf8');
          
          // Parse response to extract usage data (for GPT calls)
          const parsed = JSON.parse(data);
          if (parsed.usage) {
            tokensUsed = parsed.usage.total_tokens || 0;
            model = req.body?.model || 'gpt-4o-mini';
            cost = Usage.calculateCost(tokensUsed, model);
          }
        }
      } catch (error) {
        // Not JSON or parsing failed, continue
      }

      // Record usage asynchronously (don't block response)
      setImmediate(async () => {
        try {
          await Usage.recordUsage({
            userId,
            endpoint: req.originalUrl,
            method: req.method,
            tokensUsed: tokensUsed || undefined,
            cost: cost || undefined,
            requestSize: req.get('content-length') ? parseInt(req.get('content-length')!) : undefined,
            responseSize,
            duration,
            success: res.statusCode >= 200 && res.statusCode < 400,
            metadata: {
              model: model || undefined,
              temperature: req.body?.temperature,
              maxTokens: req.body?.maxTokens,
              userAgent: req.get('user-agent'),
              ip: req.ip || req.connection.remoteAddress,
            },
          });
        } catch (error) {
          console.error('Error recording usage:', error);
        }
      });
    }

    // Call the original send function
    return originalSend.call(this, data);
  };

  next();
};

export default trackUsage;
