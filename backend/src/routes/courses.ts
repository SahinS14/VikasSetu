import { Router } from 'express';
import { courseController } from '../controllers/courseController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', courseController.getAll);          // public — anyone can browse
router.get('/:id', requireAuth, courseController.getById);

export default router;
