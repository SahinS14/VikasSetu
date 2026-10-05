import { Router } from 'express';
import { chatController } from '../controllers/chatController';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = Router();

const messageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(1000),
});

router.post('/', requireAuth, validate(messageSchema), chatController.send);
router.get('/history', requireAuth, chatController.history);

export default router;
