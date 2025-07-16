// Test file to verify Express module augmentation works
import { Request, Response } from 'express';

const testHandler = (req: Request, res: Response) => {
  // This should NOT show TypeScript error after our fixes
  const userContext = req.userContext;
  const auth = req.auth;
  const user = req.user;

  console.log('userContext:', userContext);
  console.log('auth:', auth);
  console.log('user:', user);

  res.json({ success: true });
};

export { testHandler };
