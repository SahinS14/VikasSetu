import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthPayload {
  userId: string;
  role: string;
}

// Extend Express Request to carry the decoded JWT payload
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

/**
 * requireAuth — verifies Bearer JWT in Authorization header.
 * Attaches decoded payload to req.user for downstream handlers.
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

/**
 * requireTrainee — additional guard for trainee-only endpoints.
 * Must be used AFTER requireAuth.
 */
export const requireTrainee = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'trainee') {
    return res.status(403).json({ message: 'Trainee access required' });
  }
  next();
};

/**
 * optionalAuth — attaches decoded JWT to req.user if present, but does not reject if absent.
 */
export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next();
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
    req.user = payload;
  } catch {}
  next();
};

