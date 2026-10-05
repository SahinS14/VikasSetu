import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { instituteService } from '../services/instituteService';

const router = Router();

// ─── Dashboard & Analytics ───────────────────────────────────────────────────
router.get(
  '/dashboard',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await instituteService.getDashboard(req.user!);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/analytics',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await instituteService.getAnalytics(req.user!);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
);

// ─── Programmes ───────────────────────────────────────────────────────────────
router.get(
  '/programmes',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const programmes = await instituteService.getProgrammes(req.user!, req.query as any);
      res.json(programmes);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/programmes/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const programme = await instituteService.getProgrammeById(req.params.id, req.user!);
      res.json(programme);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/programmes',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const created = await instituteService.createProgramme(req.body, req.user!);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/programmes/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await instituteService.updateProgramme(req.params.id, req.body, req.user!);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/programmes/:id/archive',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const archived = await instituteService.archiveProgramme(req.params.id, req.user!);
      res.json(archived);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/programmes/:id/nominations',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await instituteService.getProgrammeNominations(
        req.params.id,
        req.user!,
        req.query as any
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// ─── Nominations ──────────────────────────────────────────────────────────────
router.get(
  '/nominations',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const nominations = await instituteService.getNominations(req.user!, req.query as any);
      res.json(nominations);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/nominations/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const nomination = await instituteService.getNominationById(req.params.id, req.user!);
      res.json(nomination);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/nominations/:id/approve',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await instituteService.approveNomination(req.params.id, req.user!);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/nominations/:id/reject',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reason } = req.body;
      const updated = await instituteService.rejectNomination(req.params.id, reason, req.user!);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/nominations/:id/status',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, rejectionReason } = req.body;
      const updated = await instituteService.updateNominationStatus(
        req.params.id,
        status,
        rejectionReason,
        req.user!
      );
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/nominations/bulk-import',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { programmeId, records, validateOnly } = req.body;
      if (!programmeId) {
        return res.status(400).json({ error: 'Programme ID is required.' });
      }
      if (!Array.isArray(records)) {
        return res.status(400).json({ error: 'Records array is required.' });
      }
      const result = await instituteService.bulkImportNominations(
        programmeId,
        records,
        Boolean(validateOnly),
        req.user!
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/nominations/bulk-approve',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { nominationIds } = req.body;
      const result = await instituteService.bulkApproveNominations(nominationIds, req.user!);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/nominations/bulk-reject',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { nominationIds, reason } = req.body;
      const result = await instituteService.bulkRejectNominations(nominationIds, reason, req.user!);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// ─── Hostel Beds ──────────────────────────────────────────────────────────────
router.get(
  '/hostel',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const beds = await instituteService.getHostelBeds(req.user!);
      res.json(beds);
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/hostel/beds/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await instituteService.updateHostelBed(req.params.id, req.body, req.user!);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// ─── Sessions ─────────────────────────────────────────────────────────────────
router.get(
  '/sessions',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessions = await instituteService.getSessions(req.user!, req.query.date as string);
      res.json(sessions);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/sessions',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const created = await instituteService.createSession(req.body, req.user!);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/sessions/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await instituteService.updateSession(req.params.id, req.body, req.user!);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/sessions/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await instituteService.deleteSession(req.params.id, req.user!);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// ─── Trainees ─────────────────────────────────────────────────────────────────
router.get(
  '/trainees',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const trainees = await instituteService.getTrainees(req.user!, req.query as any);
      res.json(trainees);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/trainees/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const trainee = await instituteService.getTraineeById(req.params.id, req.user!);
      res.json(trainee);
    } catch (err) {
      next(err);
    }
  }
);

// ─── Institutes List ──────────────────────────────────────────────────────────
router.get(
  '/institutes',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const institutes = await instituteService.getInstitutes();
      res.json(institutes);
    } catch (err) {
      next(err);
    }
  }
);

// ─── Timetable & Batches ──────────────────────────────────────────────────────
router.get(
  '/timetable',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const timetable = await instituteService.getTimetable(req.user!);
      res.json(timetable);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/batches',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const batches = await instituteService.getBatches(req.query.programmeId as string, req.user!);
      res.json(batches);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/batches',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const batch = await instituteService.createBatch(req.body, req.user!);
      res.status(201).json(batch);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/sessions/check-conflict',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const instituteId = instituteService.resolveInstituteId(req.user!);
      const result = await instituteService.checkSessionConflict({
        ...req.body,
        instituteId,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
