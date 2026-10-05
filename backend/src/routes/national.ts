import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { nationalService } from '../services/nationalService';
import { nationalAnalyticsService } from '../services/nationalAnalyticsService';

const router = Router();

// Middleware: Strict Super Admin Authorization
const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Forbidden: Super Admin access required' });
  }
  next();
};

/**
 * GET /api/national/dashboard
 * Aggregated real-time national training analytics across all NCCT institutes.
 */
router.get('/dashboard', requireAuth, requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await nationalService.getNationalDashboard(req.user!);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/national/analytics
 * Comprehensive 100% database-driven National Analytics for Super Admin.
 */
router.get('/analytics', requireAuth, requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await nationalAnalyticsService.getNationalAnalytics(req.user!);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/national/summary
 */
router.get('/summary', requireAuth, requireSuperAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await nationalService.getNationalSummary();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/national/trainings
 */
router.get('/trainings', requireAuth, requireSuperAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await nationalService.getInstituteTrainingAnalytics();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/national/skills
 */
router.get('/skills', requireAuth, requireSuperAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await nationalService.getSkillDemand();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/national/trend
 */
router.get('/trend', requireAuth, requireSuperAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await nationalService.getCertificationTrend();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/national/attendance
 */
router.get('/attendance', requireAuth, requireSuperAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await nationalService.getAttendanceAnalytics();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/national/placements
 */
router.get('/placements', requireAuth, requireSuperAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await nationalService.getPlacementAnalytics();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
