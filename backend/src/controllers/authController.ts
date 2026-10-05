import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';

export const authController = {
  register: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (err) { next(err); }
  },

  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { identifier, email, password, rememberMe } = req.body;
      const loginIdentifier = (identifier || email || '').trim();
      const result = await authService.login(loginIdentifier, password, Boolean(rememberMe));
      res.json(result);
    } catch (err) { next(err); }
  },

  me: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await authService.getMe(req.user!.userId);
      res.json(user);
    } catch (err) { next(err); }
  },

  // JWT is stateless — client clears token. Endpoint exists for symmetry / future token blacklisting.
  logout: (_req: Request, res: Response) => {
    res.json({ message: 'Logged out' });
  },
};
