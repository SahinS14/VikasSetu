import { Request, Response, NextFunction } from 'express';
import { learningService } from '../services/learningService';

export const quizController = {
  submit: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await learningService.submitQuiz(
        req.user!.userId,
        req.params.quizId,
        req.body.answers
      );
      res.json(result);
    } catch (err) { next(err); }
  },
};
