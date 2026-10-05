import { Router } from 'express';
import { enrollmentController } from '../controllers/courseController';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = Router();

const enrollSchema = z.object({
  courseId: z.string().min(1, 'courseId required'),
});

const lessonSchema = z.object({
  lessonId: z.string().min(1, 'lessonId required'),
});

router.get('/my', requireAuth, enrollmentController.getMyEnrollments);
router.get('/me', requireAuth, enrollmentController.getMyEnrollments);
router.get('/mine', requireAuth, enrollmentController.getMyEnrollments);
router.get('/:id', requireAuth, enrollmentController.getById);
router.post('/', requireAuth, validate(enrollSchema), enrollmentController.enroll);
router.patch('/:id/progress', requireAuth, validate(lessonSchema), enrollmentController.updateProgress);
router.patch('/:id/lesson', requireAuth, validate(lessonSchema), enrollmentController.markLesson);

export default router;
