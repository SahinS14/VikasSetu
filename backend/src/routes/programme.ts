import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { programmeService } from '../services/programmeService';

const router = Router();

// ─── 1. Programme Types ────────────────────────────────────────────────────────
router.get('/types', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const types = await programmeService.getProgrammeTypes();
    res.json(types);
  } catch (err) {
    next(err);
  }
});

// ─── 2. Programme Catalogue (Search & Filters) ─────────────────────────────────
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await programmeService.getProgrammes(req.query as any);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─── 3. Trainee Applications (My Applications) ─────────────────────────────────
router.get('/my-applications', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const applications = await programmeService.getMyApplications(req.user!.userId);
    res.json(applications);
  } catch (err) {
    next(err);
  }
});

// ─── 4. Trainee Timetable (Auto-derived from batches) ──────────────────────────
router.get('/my-timetable', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const timetable = await programmeService.getTraineeTimetable(req.user!.userId);
    res.json(timetable);
  } catch (err) {
    next(err);
  }
});

// ─── 5. Programme Detail ───────────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Optional auth token check: if header present, extract user to evaluate personalized eligibility
    let userId: string | undefined = undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(token, process.env.JWT_SECRET || 'vikassetu-dev-secret-key-ncct-2026') as any;
        userId = decoded.userId || decoded.id;
      } catch {
        // Continue unauthenticated
      }
    }

    const programme = await programmeService.getProgrammeById(req.params.id, userId);
    res.json(programme);
  } catch (err) {
    next(err);
  }
});

// ─── 6. Automated Eligibility Check Endpoint ───────────────────────────────────
router.get('/:id/eligibility', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await programmeService.evaluateEligibility(req.params.id, req.user!.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─── 7. Apply to Programme ─────────────────────────────────────────────────────
router.post('/:id/apply', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const application = await programmeService.applyToProgramme(
      req.params.id,
      req.user!.userId,
      req.body
    );
    res.status(201).json(application);
  } catch (err) {
    next(err);
  }
});

export default router;
