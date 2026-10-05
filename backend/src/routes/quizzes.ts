import { Router } from 'express';
import { quizController } from '../controllers/quizController';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = Router();

const submitSchema = z.object({
  courseId: z.string().optional(),
  answers: z.union([z.array(z.any()), z.record(z.any())]),
});

router.post('/:quizId/submit', requireAuth, validate(submitSchema), quizController.submit);

export default router;
