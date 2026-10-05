import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[Error ${status}]`, err.stack || message);
  }

  res.status(status).json({ message, error: message, success: false });
};

/** Helper: create an error with an HTTP status code */
export const createError = (status: number, message: string) => {
  const err: any = new Error(message);
  err.status = status;
  return err;
};
