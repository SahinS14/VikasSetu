import { Request, Response, NextFunction } from 'express';
import { courseService } from '../services/courseService';

export const courseController = {
  getAll: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await courseService.getAllCourses());
    } catch (err) {
      next(err);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await courseService.getCourseById(req.params.id));
    } catch (err) {
      next(err);
    }
  },
};

export const enrollmentController = {
  getMyEnrollments: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await courseService.getEnrollments(req.user!.userId));
    } catch (err) {
      next(err);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await courseService.getEnrollmentById(req.params.id, req.user!.userId));
    } catch (err) {
      next(err);
    }
  },

  enroll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const enrollment = await courseService.enrollInCourse(req.user!.userId, req.body.courseId);
      res.status(201).json(enrollment);
    } catch (err) {
      next(err);
    }
  },

  updateProgress: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { lessonId } = req.body;
      const updated = await courseService.markLessonComplete(
        req.user!.userId,
        req.params.id,
        lessonId
      );
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  markLesson: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await courseService.markLessonComplete(
        req.user!.userId,
        req.params.id,
        req.body.lessonId
      );
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },
};
