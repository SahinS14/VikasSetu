import { Router } from 'express';
import { learningController } from '../controllers/learningController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Public certificate verification
router.get('/certificates/verify/:token', learningController.verifyCertificate);

// Protected learning routes
router.post('/courses/:courseId/enroll', requireAuth, learningController.enroll);
router.get('/courses/:courseId', requireAuth, learningController.getCourseLearning);
router.post('/lessons/:lessonId/complete', requireAuth, learningController.completeLesson);
router.post('/lessons/:lessonId/progress', requireAuth, learningController.saveProgress);
router.get('/lessons/:lessonId/progress', requireAuth, learningController.getProgress);
router.get('/modules/:moduleId/quiz', requireAuth, learningController.getModuleQuiz);
router.get('/quizzes/:quizId', requireAuth, learningController.getQuiz);
router.post('/quizzes/:quizId/submit', requireAuth, learningController.submitQuiz);

export default router;
