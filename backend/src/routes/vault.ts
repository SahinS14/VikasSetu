import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { documentVaultService } from '../services/documentVaultService';

const router = Router();

// ─── 1. Get User's Reusable Documents ──────────────────────────────────────────
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const documents = await documentVaultService.getUserDocuments(req.user!.userId);
    res.json(documents);
  } catch (err) {
    next(err);
  }
});

// ─── 2. Upload / Register Document into Vault ─────────────────────────────────
router.post('/upload', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doc = await documentVaultService.uploadDocument(req.user!.userId, req.body);
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
});

// ─── 3. Delete Document from Vault ─────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await documentVaultService.deleteDocument(req.user!.userId, req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─── 4. Trainee Profile Readiness Checklist ────────────────────────────────────
router.get('/readiness', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const readiness = await documentVaultService.getProfileReadiness(req.user!.userId);
    res.json(readiness);
  } catch (err) {
    next(err);
  }
});

export default router;
