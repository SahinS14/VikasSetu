import { Router } from 'express';
import { notificationController } from '../controllers/notificationController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/me', requireAuth, notificationController.getMyNotifications);
router.patch('/:id/read', requireAuth, notificationController.markAsRead);
router.post('/read-all', requireAuth, notificationController.markAllAsRead);

export default router;
