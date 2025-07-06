// Hybrid approach: Auth0 + MongoDB metrics tracking
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// This would be your Auth0 user from JWT
interface Auth0User {
  sub: string; // Auth0 user ID
  email: string;
  name?: string;
  picture?: string;
  [key: string]: any;
}

// MongoDB model for tracking user metrics
interface UserMetrics {
  auth0UserId: string; // Links to Auth0 user
  totalTransformations: number;
  lastTransformation?: Date;
  monthlyUsage: number;
  usageResetDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Middleware to verify Auth0 JWT and load/create user metrics
export const auth0WithMetrics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Verify Auth0 JWT token (standard Auth0 verification)
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    // Verify with Auth0 (you'd use Auth0's verification method)
    const auth0User = await verifyAuth0Token(token);
    
    // Get or create user metrics in MongoDB
    let userMetrics = await UserMetricsModel.findOne({ 
      auth0UserId: auth0User.sub 
    });

    if (!userMetrics) {
      // Create new metrics record for this Auth0 user
      userMetrics = await UserMetricsModel.create({
        auth0UserId: auth0User.sub,
        totalTransformations: 0,
        monthlyUsage: 0,
        usageResetDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Attach both Auth0 user and metrics to request
    req.user = {
      auth0: auth0User,
      metrics: userMetrics,
      userId: auth0User.sub // For compatibility
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

async function verifyAuth0Token(token: string): Promise<Auth0User> {
  // This would use Auth0's actual verification
  // Example with jsonwebtoken for Auth0:
  
  const decoded = jwt.verify(token, process.env.AUTH0_PUBLIC_KEY!, {
    audience: process.env.AUTH0_AUDIENCE,
    issuer: `https://${process.env.AUTH0_DOMAIN}/`,
    algorithms: ['RS256']
  }) as Auth0User;
  
  return decoded;
}

// Usage tracking helper
export const trackUsage = async (auth0UserId: string): Promise<void> => {
  await UserMetricsModel.findOneAndUpdate(
    { auth0UserId },
    { 
      $inc: { totalTransformations: 1, monthlyUsage: 1 },
      $set: { lastTransformation: new Date(), updatedAt: new Date() }
    }
  );
};
