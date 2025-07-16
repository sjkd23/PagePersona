// Test ts-node with Express types
import './types/loader';
import { Request, Response } from 'express';

const testHandler = (req: Request, res: Response) => {
  // This should work with Express module augmentation
  console.log('userContext exists:', req.userContext !== undefined);
  console.log('auth exists:', req.auth !== undefined);

  res.json({ message: 'Types working!' });
};

console.log('Express types loaded successfully');
export default testHandler;
