import { Request, Response, NextFunction } from 'express';
import { jobService } from '../services/jobService';

export const jobController = {
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const jobs = await jobService.getAllJobs(req.user?.userId);
      res.json(jobs);
    } catch (err) {
      next(err);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const job = await jobService.getJobById(req.params.id, req.user?.userId);
      res.json(job);
    } catch (err) {
      next(err);
    }
  },

  getMatchDetails: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const match = await jobService.getJobMatchDetails(req.user!.userId, req.params.id);
      res.json(match);
    } catch (err) {
      next(err);
    }
  },

  apply: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await jobService.applyForJob(req.user!.userId, req.params.id);
      res.status(result.alreadyApplied ? 200 : 201).json(result);
    } catch (err) {
      next(err);
    }
  },

  getMyApplications: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const applications = await jobService.getMyApplications(req.user!.userId);
      res.json(applications);
    } catch (err) {
      next(err);
    }
  },

  getRecruiterCandidates: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const candidates = await jobService.getRecruiterCandidates(req.user?.userId);
      res.json(candidates);
    } catch (err) {
      next(err);
    }
  },

  updateStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = req.body;
      const updated = await jobService.updateApplicationStatus(req.params.id, status);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },
};
