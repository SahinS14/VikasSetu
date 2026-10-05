import { Router } from 'express';
import { skillCardController } from '../controllers/skillCardController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// ─── Trainee Authenticated Routes ──────────────────────────────────────────
router.get('/trainees/me/skill-card', requireAuth, skillCardController.getMySkillCard);
router.post('/trainees/me/skill-card/regenerate', requireAuth, skillCardController.regenerateSkillCard);

// ─── Public Unauthenticated Routes (Recruiters, Institutions, QR Scanners) ─
router.get('/public/skill-card/:token', skillCardController.getPublicSkillCard);
router.post('/public/skill-card/:token/contact', skillCardController.submitRecruiterInquiry);

export default router;
