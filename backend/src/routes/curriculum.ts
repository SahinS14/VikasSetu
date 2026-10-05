import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { curriculumService } from '../services/curriculumService';

const router = Router();

// ─── Course Curriculum Query ──────────────────────────────────────────────────
router.get(
  '/courses/:courseId/curriculum',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const curriculum = await curriculumService.getCourseCurriculum(req.params.courseId);
      res.json(curriculum);
    } catch (err) {
      next(err);
    }
  }
);

// ─── Module Operations ────────────────────────────────────────────────────────
router.post(
  '/courses/:courseId/modules',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const newModule = await curriculumService.createModule(
        req.params.courseId,
        req.body,
        req.user!
      );
      res.status(201).json(newModule);
    } catch (err) {
      next(err);
    }
  }
);

const handleUpdateModule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await curriculumService.updateModule(
      req.params.moduleId,
      req.body,
      req.user!
    );
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

router.patch('/courses/:courseId/modules/:moduleId', requireAuth, handleUpdateModule);
router.patch('/modules/:moduleId', requireAuth, handleUpdateModule);

const handleDeleteModule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await curriculumService.deleteModule(req.params.moduleId, req.user!);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

router.delete('/courses/:courseId/modules/:moduleId', requireAuth, handleDeleteModule);
router.delete('/modules/:moduleId', requireAuth, handleDeleteModule);

router.put(
  '/courses/:courseId/modules/reorder',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { moduleIds } = req.body;
      const result = await curriculumService.reorderModules(
        req.params.courseId,
        moduleIds || [],
        req.user!
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// ─── Lesson Operations ────────────────────────────────────────────────────────
const handleGetLesson = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lesson = await curriculumService.getLesson(req.params.lessonId);
    res.json({
      ...lesson,
      success: true,
      lesson,
    });
  } catch (err) {
    next(err);
  }
};

router.get('/modules/:moduleId/lessons/:lessonId', requireAuth, handleGetLesson);
router.get('/lessons/:lessonId', requireAuth, handleGetLesson);

router.post(
  '/modules/:moduleId/lessons',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const newLesson = await curriculumService.createLesson(
        req.params.moduleId,
        req.body,
        req.user!
      );
      res.status(201).json({
        ...newLesson,
        success: true,
        lesson: newLesson,
      });
    } catch (err) {
      next(err);
    }
  }
);

const handleUpdateLesson = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await curriculumService.updateLesson(
      req.params.lessonId,
      req.body,
      req.user!
    );
    res.json({
      ...updated,
      success: true,
      lesson: updated,
    });
  } catch (err) {
    next(err);
  }
};

router.patch('/modules/:moduleId/lessons/:lessonId', requireAuth, handleUpdateLesson);
router.patch('/lessons/:lessonId', requireAuth, handleUpdateLesson);
router.put('/modules/:moduleId/lessons/:lessonId', requireAuth, handleUpdateLesson);
router.put('/lessons/:lessonId', requireAuth, handleUpdateLesson);

const handleDeleteLesson = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await curriculumService.deleteLesson(req.params.lessonId, req.user!);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

router.delete('/modules/:moduleId/lessons/:lessonId', requireAuth, handleDeleteLesson);
router.delete('/lessons/:lessonId', requireAuth, handleDeleteLesson);

router.put(
  '/modules/:moduleId/lessons/reorder',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { lessonIds } = req.body;
      const result = await curriculumService.reorderLessons(
        req.params.moduleId,
        lessonIds || [],
        req.user!
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// ─── Assessment / Quiz Operations ─────────────────────────────────────────────
const handleSaveQuiz = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const saved = await curriculumService.saveQuiz(
      req.params.moduleId,
      req.body,
      req.user!
    );
    res.json(saved);
  } catch (err) {
    next(err);
  }
};

router.post('/modules/:moduleId/quiz', requireAuth, handleSaveQuiz);
router.put('/modules/:moduleId/quiz', requireAuth, handleSaveQuiz);

const handleDeleteQuiz = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quizId = req.params.quizId;
    const result = await curriculumService.deleteQuiz(quizId, req.user!);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

router.delete('/modules/:moduleId/quiz/:quizId', requireAuth, handleDeleteQuiz);
router.delete('/quizzes/:quizId', requireAuth, handleDeleteQuiz);

// ─── Course Creation & Update ─────────────────────────────────────────────────
router.post(
  '/courses',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const course = await curriculumService.createCourse(req.body, req.user!);
      res.status(201).json(course);
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/courses/:courseId',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await curriculumService.updateCourse(
        req.params.courseId,
        req.body,
        req.user!
      );
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
