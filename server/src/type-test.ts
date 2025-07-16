import { Request, Response } from 'express';

// Test if the Express module augmentation is working
const testFunction = (req: Request, res: Response) => {
  // Check if userContext exists on Request type
  const context = req.userContext;
  console.log('userContext type check passed:', typeof context);

  const auth = req.auth;
  console.log('auth type check passed:', typeof auth);

  res.json({ message: 'Types are working!' });
};

export default testFunction;
