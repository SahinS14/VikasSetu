import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { facultyService } from '../services/facultyService';
import { createError } from '../middleware/errorHandler';

const router = Router();

/**
 * GET /api/faculty/dashboard
 * Aggregates authenticated faculty stats, authored courses, enrolled trainees,
 * session schedules with QR tokens, at-risk trainee flags, quiz performance,
 * certificate pipeline, and employment readiness matching.
 */
router.get('/dashboard', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const role = (user.role || '').toLowerCase();

    // Faculty or higher academic administrator access
    if (role !== 'faculty' && role !== 'institute_admin' && role !== 'super_admin') {
      throw createError(403, 'Forbidden: Faculty Dashboard requires faculty or academic admin credentials');
    }

    const data = await facultyService.getDashboardData(user.userId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/faculty/courses
 * Returns the list of courses authored/managed by the authenticated faculty,
 * with real enrollment counts, completion rates, and quiz pass rates.
 */
router.get('/courses', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const role = (user.role || '').toLowerCase();

    if (role !== 'faculty' && role !== 'institute_admin' && role !== 'super_admin') {
      throw createError(403, 'Forbidden: Faculty courses endpoint requires faculty or academic admin credentials');
    }

    const courses = await facultyService.getCourses(user.userId);
    res.json(courses);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/faculty/courses/:courseId/roster
 * Returns the real enrolled trainee roster for a specific course,
 * with individual progress, quiz scores, and completion status.
 */
router.get('/courses/:courseId/roster', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const role = (user.role || '').toLowerCase();

    if (role !== 'faculty' && role !== 'institute_admin' && role !== 'super_admin') {
      throw createError(403, 'Forbidden: Faculty roster endpoint requires faculty or academic admin credentials');
    }

    const { courseId } = req.params;
    const roster = await facultyService.getCourseRoster(courseId);
    res.json(roster);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/faculty/timetable
 * Returns scheduled physical & hybrid sessions assigned to the faculty with zero conflicts
 */
router.get('/timetable', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { instituteService } = await import('../services/instituteService');
    const timetable = await instituteService.getFacultyTimetable(req.user!.userId, req.user!);
    res.json(timetable);
  } catch (err) {
    next(err);
  }
});

export default router;
