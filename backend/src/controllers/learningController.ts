import { Request, Response, NextFunction } from 'express';
import { learningService } from '../services/learningService';

export const learningController = {
  enroll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await learningService.enroll(req.user!.userId, req.params.courseId);
      res.status(result.alreadyEnrolled ? 200 : 201).json(result);
    } catch (err) {
      next(err);
    }
  },

  getCourseLearning: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await learningService.getCourseLearning(req.user!.userId, req.params.courseId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  completeLesson: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await learningService.completeLesson(req.user!.userId, req.params.lessonId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  saveProgress: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { progressSeconds, progressPercent, completed } = req.body;
      const result = await learningService.saveLessonProgress(
        req.user!.userId,
        req.params.lessonId,
        { progressSeconds, progressPercent, completed }
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  getProgress: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await learningService.getLessonProgress(
        req.user!.userId,
        req.params.lessonId
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  getModuleQuiz: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await learningService.getModuleQuiz(req.user!.userId, req.params.moduleId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  getQuiz: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await learningService.getModuleQuiz(req.user!.userId, req.params.quizId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  submitQuiz: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { answers } = req.body;
      const result = await learningService.submitQuiz(
        req.user!.userId,
        req.params.quizId,
        answers
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  verifyCertificate: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await learningService.verifyCertificate(req.params.token);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};
