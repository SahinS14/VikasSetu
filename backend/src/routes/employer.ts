import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { employerService } from '../services/employerService';
import { createError } from '../middleware/errorHandler';

const router = Router();

// ─── Role guard helper ────────────────────────────────────────────────────────
const requireEmployer = (req: Request, _res: Response, next: NextFunction) => {
  const role = req.user?.role;
  if (role === 'employer' || role === 'super_admin') return next();
  return next(createError(403, 'Forbidden: employer or super_admin role required'));
};

// ─── GET /api/employer/dashboard ─────────────────────────────────────────────
// Returns 100% database-driven dashboard metrics for the authenticated employer.
router.get(
  '/dashboard',
  requireAuth,
  requireEmployer,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await employerService.getDashboardData(req.user!.userId);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/employer/contact ───────────────────────────────────────────────
// Recruiter contacts a candidate → updates JobInterest status, creates notification.
router.post(
  '/contact',
  requireAuth,
  requireEmployer,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { jobInterestId, candidateUserId, jobTitle } = req.body;
      if (!jobInterestId || !candidateUserId || !jobTitle) {
        throw createError(400, 'jobInterestId, candidateUserId, and jobTitle are required');
      }
      const result = await employerService.contactCandidate(req.user!.userId, {
        jobInterestId,
        candidateUserId,
        jobTitle,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/employer/jobs ──────────────────────────────────────────────────
// Create a new job posting owned by the authenticated employer.
router.post(
  '/jobs',
  requireAuth,
  requireEmployer,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const job = await employerService.createJob(req.user!.userId, req.body);
      res.status(201).json(job);
    } catch (err) {
      next(err);
    }
  }
);

// ─── PUT /api/employer/jobs/:id ───────────────────────────────────────────────
// Update a job posting (employer must own it).
router.put(
  '/jobs/:id',
  requireAuth,
  requireEmployer,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const job = await employerService.updateJob(req.user!.userId, req.params.id, req.body);
      res.json(job);
    } catch (err) {
      next(err);
    }
  }
);

// ─── DELETE /api/employer/jobs/:id ────────────────────────────────────────────
// Soft-close a job posting (employer must own it).
router.delete(
  '/jobs/:id',
  requireAuth,
  requireEmployer,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const job = await employerService.deleteJob(req.user!.userId, req.params.id);
      res.json(job);
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /api/employer/jobs/:id/status ──────────────────────────────────────
// Toggle job ACTIVE ↔ CLOSED (employer must own it).
router.patch(
  '/jobs/:id/status',
  requireAuth,
  requireEmployer,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const job = await employerService.toggleJobStatus(req.user!.userId, req.params.id);
      res.json(job);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
