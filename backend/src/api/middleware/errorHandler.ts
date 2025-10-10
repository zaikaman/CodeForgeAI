
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);

  // Check for specific error types if needed
  // if (err instanceof CustomError) {
  //   return res.status(err.statusCode).json({ error: err.message });
  // }

  res.status(500).json({ error: 'Something went wrong!' });
};
