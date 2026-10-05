import { Request, Response, NextFunction } from 'express';
import { skillCardService } from '../services/skillCardService';

export const skillCardController = {
  getMySkillCard: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const card = await skillCardService.getMySkillCard(req.user!.userId);
      res.json(card);
    } catch (err) {
      next(err);
    }
  },

  regenerateSkillCard: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await skillCardService.regenerateSkillCard(req.user!.userId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  getPublicSkillCard: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.params;
      const card = await skillCardService.getPublicSkillCard(token);
      res.json(card);
    } catch (err) {
      next(err);
    }
  },

  submitRecruiterInquiry: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.params;
      const result = await skillCardService.submitRecruiterInquiry(token, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};
