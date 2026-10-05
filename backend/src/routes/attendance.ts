/**
 * backend/src/routes/attendance.ts
 *
 * Express Routes for Offline Physical Classroom Attendance Management & Hardware Integration.
 */

import { Router } from 'express';
import { attendanceController } from '../controllers/attendanceController';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = Router();

const createSessionSchema = z.object({
  title: z.string().min(3, 'Session title must be at least 3 characters'),
  courseId: z.string().optional(),
  date: z.string().min(1, 'Date is required (YYYY-MM-DD)'),
  timeSlot: z.string().min(1, 'Time slot is required'),
  room: z.string().min(1, 'Location / Room is required'),
  classroomId: z.string().optional(),
  instructor: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  attendanceMode: z.string().optional(),
});

const deviceRfidSchema = z.object({
  deviceCode: z.string().min(1, 'deviceCode is required'),
  rfidUid: z.string().min(1, 'rfidUid is required'),
});

const deviceVerifyFaceSchema = z.object({
  deviceCode: z.string().min(1, 'deviceCode is required'),
  rfidUid: z.string().min(1, 'rfidUid is required'),
  imageBase64: z.string().min(10, 'Valid imageBase64 is required'),
  verificationToken: z.string().optional(),
  sessionId: z.string().optional(),
});

const assignRfidSchema = z.object({
  traineeId: z.string().min(1, 'traineeId is required'),
  rfidUid: z.string().min(1, 'rfidUid is required'),
});

const registerDeviceSchema = z.object({
  deviceCode: z.string().min(2, 'deviceCode required'),
  classroomId: z.string().min(1, 'classroomId required'),
  name: z.string().min(2, 'name required'),
});

const markFaceSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
  image: z.string().min(10, 'Valid base64 image is required'),
});

// ─── Online Web Camera Face Attendance (Trainee Web Portal) ─────────────────
router.get('/active', requireAuth, attendanceController.getActiveSessions);
router.post('/face', requireAuth, validate(markFaceSchema), attendanceController.markFace);

// ─── Classroom Edge Device Hardware APIs (Called by Raspberry Pi / PC / Simulator) ───
router.post('/device/heartbeat', attendanceController.deviceHeartbeat);
router.post('/device/rfid', validate(deviceRfidSchema), attendanceController.deviceRfid);
router.post('/device/verify-face', validate(deviceVerifyFaceSchema), attendanceController.deviceVerifyFace);

// ─── Trainee Attendance History & Biometric Enrollment ────────────────────────
router.get('/history', requireAuth, attendanceController.getTraineeHistory);
router.get('/face/health', attendanceController.checkFaceHealth);
router.post('/face/enroll', requireAuth, attendanceController.enrollFace);
router.post('/face/register', requireAuth, attendanceController.enrollFace);

// ─── Faculty & Admin Session Operations ──────────────────────────────────────
router.get('/sessions', requireAuth, attendanceController.getSessions);
router.post('/sessions', requireAuth, validate(createSessionSchema), attendanceController.createSession);
router.get('/sessions/:id', requireAuth, attendanceController.getSessionDetails);
router.get('/sessions/:id/summary', requireAuth, attendanceController.getSessionSummary);
router.get('/sessions/:id/records', requireAuth, attendanceController.getSessionRecords);
router.post('/sessions/:id/start', requireAuth, attendanceController.startSession);
router.post('/sessions/:id/close', requireAuth, attendanceController.closeSession);

// ─── Institute Admin Device & RFID Management ────────────────────────────────
router.get('/devices', requireAuth, attendanceController.getDevices);
router.post('/devices', requireAuth, validate(registerDeviceSchema), attendanceController.registerDevice);
router.post('/device/assign-rfid', requireAuth, validate(assignRfidSchema), attendanceController.assignRfid);

export default router;
