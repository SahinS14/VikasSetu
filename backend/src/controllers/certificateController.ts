import { Request, Response, NextFunction } from 'express';
import { certificateRepository } from '../repositories/certificateRepository';
import { createError } from '../middleware/errorHandler';

export const certificateController = {
  getMyCertificates: async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await certificateRepository.findByUser(req.user!.userId)); }
    catch (err) { next(err); }
  },

  // Public endpoint — no auth required — fixes cross-device verification
  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cert = await certificateRepository.findById(req.params.id);
      if (!cert) throw createError(404, 'Certificate not found');
      res.json(cert);
    } catch (err) { next(err); }
  },

  verify: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { learningService } = await import('../services/learningService');
      const result = await learningService.verifyCertificate(req.params.token);
      res.json(result);
    } catch (err) { next(err); }
  },
};
