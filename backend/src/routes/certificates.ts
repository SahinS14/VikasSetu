import { Router } from 'express';
import { certificateController } from '../controllers/certificateController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// /api/certificates/:id is PUBLIC — enables cross-device verification without login
router.get('/my', requireAuth, certificateController.getMyCertificates);
router.get('/me', requireAuth, certificateController.getMyCertificates);
router.get('/mine', requireAuth, certificateController.getMyCertificates);
router.get('/verify/:token', certificateController.verify);
router.get('/:id', certificateController.getById);   // no requireAuth intentionally

export default router;
