import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';

export function validateRequest(
  schema: ZodSchema<any>,
  target: 'body' | 'query' | 'params' = 'body',
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req[target]);
      next();
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({
          error: 'Validation failed',
          issues: err.issues,
        });
        return;
      }
      next(err);
    }
  };
}
