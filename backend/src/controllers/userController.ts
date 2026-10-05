import { Request, Response, NextFunction } from 'express';
import { userRepository } from '../repositories/userRepository';
import { createError } from '../middleware/errorHandler';

// Fields the trainee is allowed to self-update
const ALLOWED_FIELDS = ['name', 'phone', 'languagePreference', 'avatarUrl', 'cooperativeAffiliation'];

export const userController = {
  updateMe: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updates: Record<string, any> = {};
      for (const key of ALLOWED_FIELDS) {
        if (key in req.body) updates[key] = req.body[key];
      }
      if (Object.keys(updates).length === 0) {
        throw createError(400, 'No valid fields to update');
      }
      const updated = await userRepository.updateById(req.user!.userId, updates);
      const { passwordHash, ...safe } = updated as any;
      res.json(safe);
    } catch (err) { next(err); }
  },

  // eKYC — simulated per project convention (label preserved in UI)
  verifyKyc: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const aadhaar = req.body.aadhaarNumber as string;
      const formatted = `XXXX-XXXX-${aadhaar.slice(-4) || '0000'}`;
      const updated = await userRepository.updateById(req.user!.userId, {
        aadhaarMock: formatted,
        isKycVerified: true,
      });
      const { passwordHash, ...safe } = updated as any;
      res.json({ message: 'eKYC verified (simulated)', user: safe });
    } catch (err) { next(err); }
  },
};
