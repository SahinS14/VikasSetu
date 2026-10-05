/**
 * backend/src/controllers/attendanceController.ts
 *
 * REST Controller for Offline Physical Classroom Attendance Management.
 */

import { Request, Response, NextFunction } from 'express';
import { attendanceService } from '../services/attendanceService';
import { deviceService } from '../services/deviceService';

export const attendanceController = {
  // Session Management
  getSessions: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = {
        userId: req.user!.userId,
        role: req.user!.role,
        instituteId: (req.user as any)?.instituteId,
      };
      const filters = {
        courseId: req.query.courseId as string | undefined,
        date: req.query.date as string | undefined,
        activeOnly: req.query.active === 'true',
      };
      const sessions = await attendanceService.listSessions(user, filters);
      res.json(sessions);
    } catch (err) {
      next(err);
    }
  },

  getSessionDetails: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = {
        userId: req.user!.userId,
        role: req.user!.role,
        instituteId: (req.user as any)?.instituteId,
      };
      const result = await attendanceService.getSessionDetails(req.params.id, user);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  getSessionRecords: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = {
        userId: req.user!.userId,
        role: req.user!.role,
        instituteId: (req.user as any)?.instituteId,
      };
      const records = await attendanceService.getSessionRecords(req.params.id, user);
      res.json(records);
    } catch (err) {
      next(err);
    }
  },

  createSession: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = {
        userId: req.user!.userId,
        role: req.user!.role,
        name: (req.user as any)?.name,
        instituteId: (req.user as any)?.instituteId,
      };
      const session = await attendanceService.createSession(req.body, user);
      res.status(201).json(session);
    } catch (err) {
      next(err);
    }
  },

  startSession: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = {
        userId: req.user!.userId,
        role: req.user!.role,
        instituteId: (req.user as any)?.instituteId,
      };
      const session = await attendanceService.startSession(req.params.id, user);
      res.json(session);
    } catch (err) {
      next(err);
    }
  },

  closeSession: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = {
        userId: req.user!.userId,
        role: req.user!.role,
        instituteId: (req.user as any)?.instituteId,
      };
      const session = await attendanceService.closeSession(req.params.id, user);
      res.json(session);
    } catch (err) {
      next(err);
    }
  },

  getSessionSummary: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await attendanceService.getSessionSummary(req.params.id);
      res.json(summary);
    } catch (err) {
      next(err);
    }
  },

  // Online Web Face Attendance
  markFace: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await attendanceService.markWebFaceAttendance({
        userId: req.user!.userId,
        sessionId: req.body.sessionId,
        imageBase64: req.body.image,
      });
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  getActiveSessions: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessions = await attendanceService.getActiveSessionsForTrainee(req.user!.userId);
      res.json(sessions);
    } catch (err) {
      next(err);
    }
  },

  // Classroom Edge Device Endpoints
  deviceHeartbeat: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { deviceCode } = req.body;
      const device = await deviceService.heartbeat(deviceCode);
      res.json({ success: true, device });
    } catch (err) {
      next(err);
    }
  },

  deviceRfid: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await attendanceService.deviceRfidTap(req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  deviceVerifyFace: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await attendanceService.deviceVerifyFace(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  assignRfid: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await attendanceService.assignRfid(req.body, req.user!);
      res.json({ success: true, message: 'RFID assigned successfully', trainee: result });
    } catch (err) {
      next(err);
    }
  },

  enrollFace: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await attendanceService.enrollFace(req.body, req.user!);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  checkFaceHealth: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await attendanceService.checkFaceHealth();
      res.status(result.status === 'ok' ? 200 : 503).json(result);
    } catch (err) {
      next(err);
    }
  },

  getTraineeHistory: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetUserId = (req.query.userId as string) || req.user!.userId;
      // Trainees can only see their own history
      if (req.user!.role === 'trainee' && targetUserId !== req.user!.userId) {
        return res.status(403).json({ error: 'Unauthorized to view other trainees attendance' });
      }
      const history = await attendanceService.getTraineeHistory(targetUserId);
      res.json(history);
    } catch (err) {
      next(err);
    }
  },

  // Institute Admin Device Registry
  getDevices: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const instituteId = (req.user as any)?.instituteId;
      const devices = await deviceService.listDevices(instituteId);
      res.json(devices);
    } catch (err) {
      next(err);
    }
  },

  registerDevice: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const instituteId = (req.user as any)?.instituteId || 'inst-vamnicom';
      const device = await deviceService.registerDevice({
        ...req.body,
        instituteId,
      });
      res.status(201).json(device);
    } catch (err) {
      next(err);
    }
  },
};
