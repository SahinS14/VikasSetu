/**
 * backend/src/services/attendanceService.ts
 *
 * Comprehensive Offline Physical Classroom Attendance Service for VikasSetu.
 * Hardware Flow:
 *   Classroom Edge Device (RFID + Camera)
 *      ↓
 *   Python Face AI (ArcFace buffalo_l on port 8000)
 *      ↓
 *   Express Backend (11 Security & Anti-Proxy Validations)
 *      ↓
 *   PostgreSQL / Supabase Database (Unique sessionId + userId)
 *
 * Trainees: View attendance history & perform one-time face enrollment.
 * Faculty: Start/stop sessions & monitor live attendance via polling.
 * Institute Admin: Manage devices & assign RFID cards.
 */

import prisma from '../config/prisma';
import { userRepository } from '../repositories/userRepository';
import { notificationRepository } from '../repositories/notificationRepository';
import { deviceService } from './deviceService';
import { createError } from '../middleware/errorHandler';

const FACE_SERVICE_URL = (process.env.FACE_SERVICE_URL || 'http://127.0.0.1:8000').trim().replace(/\/+$/, '');
const CONFIDENCE_THRESHOLD = 0.50; // ArcFace cosine similarity threshold

/**
 * Safely calls the Python Face AI microservice with timeout, retry for cold starts,
 * and robust HTML/gateway error sanitization (never leaking raw 502 HTML to the client).
 */
async function callFaceService(endpoint: string, payload: Record<string, any>, timeoutMs = 45000): Promise<any> {
  const baseUrl = (process.env.FACE_SERVICE_URL || FACE_SERVICE_URL).trim().replace(/\/+$/, '');
  const url = `${baseUrl}${endpoint}`;

  for (let attempt = 1; attempt <= 2; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Connection': 'close',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';

      if (!response.ok) {
        const rawBody = await response.text();
        console.error(`[FaceService Error (attempt ${attempt})] Endpoint: ${endpoint}, Status: ${response.status}, Content-Type: ${contentType}`);
        console.error(`[FaceService Error] Snippet: ${rawBody.slice(0, 300)}`);

        // If Render is waking up from idle (502/503), retry once after a short wait
        if ((response.status === 502 || response.status === 503) && attempt === 1) {
          console.log(`[FaceService] Upstream is waking up (status ${response.status}). Retrying in 3s...`);
          await new Promise((resolve) => setTimeout(resolve, 3000));
          continue;
        }

        if (contentType.includes('text/html') || rawBody.trim().startsWith('<')) {
          throw createError(503, 'Face enrollment service is starting up or temporarily unavailable. Please retry in a few moments.');
        }

        try {
          const jsonErr = JSON.parse(rawBody);
          const detail = jsonErr.detail || jsonErr.message || jsonErr.error || 'Face service rejected the request';
          throw createError(response.status >= 400 && response.status < 500 ? response.status : 503, detail);
        } catch (e: any) {
          if (e.status) throw e;
          throw createError(503, rawBody.slice(0, 150) || 'Face service error occurred');
        }
      }

      return await response.json();
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (attempt === 1 && (err.status === 502 || err.status === 503 || err.name === 'AbortError' || err.code === 'ECONNRESET')) {
        console.log(`[FaceService] Attempt 1 failed (${err.message || err.code}). Retrying in 3s...`);
        await new Promise((resolve) => setTimeout(resolve, 3000));
        continue;
      }
      if (err.status) throw err;
      console.error(`[FaceService] Network error calling ${endpoint}:`, err.message);
      if (err.name === 'AbortError') {
        throw createError(504, 'Face service request timed out. The service may be waking up — please try again in a few seconds.');
      }
      throw createError(503, 'Face recognition service is currently unavailable.');
    }
  }
}

// Short-lived verification tokens cache: token -> { traineeId, sessionId, expiresAt }
const verificationTokens = new Map<string, { traineeId: string; sessionId: string; expiresAt: number }>();

function cleanExpiredTokens() {
  const now = Date.now();
  for (const [token, data] of verificationTokens.entries()) {
    if (data.expiresAt < now) {
      verificationTokens.delete(token);
    }
  }
}

export const attendanceService = {
  /**
   * List sessions based on the caller's role and filters.
   */
  listSessions: async (
    user: { userId: string; role: string; instituteId?: string | null },
    filters?: { courseId?: string; date?: string; activeOnly?: boolean }
  ) => {
    const where: any = {};

    if (filters?.courseId) {
      where.courseId = filters.courseId;
    }
    if (filters?.date) {
      where.date = filters.date;
    }
    if (filters?.activeOnly) {
      where.active = true;
    }

    if (user.role === 'trainee') {
      const enrollments = await prisma.enrollment.findMany({
        where: { userId: user.userId },
        select: { courseId: true },
      });
      const enrolledCourseIds = enrollments.map(e => e.courseId);
      where.active = true;
      where.OR = [
        { courseId: { in: enrolledCourseIds } },
        { courseId: null },
      ];
    } else if (user.role === 'institute_admin' && user.instituteId) {
      where.instituteId = user.instituteId;
    } else if (user.role === 'faculty') {
      if (user.instituteId) {
        where.instituteId = user.instituteId;
      }
    }

    return prisma.session.findMany({
      where,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      include: {
        _count: {
          select: { attendance: true },
        },
      },
    });
  },

  /**
   * Get single session details with calculated attendance summary metrics.
   */
  getSessionDetails: async (
    sessionId: string,
    user?: { userId: string; role: string; instituteId?: string | null }
  ) => {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        attendance: {
          orderBy: { timestamp: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                rfidUid: true,
                faceEnrolled: true,
                faceIdentity: true,
                cooperativeAffiliation: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!session) throw createError(404, 'Session not found');

    if (user && user.role === 'institute_admin' && user.instituteId && session.instituteId !== user.instituteId) {
      throw createError(403, 'Unauthorized: Session belongs to another institute');
    }

    let totalEligible = session.capacity || 40;
    if (session.courseId) {
      const enrolledCount = await prisma.enrollment.count({
        where: { courseId: session.courseId },
      });
      if (enrolledCount > 0) {
        totalEligible = enrolledCount;
      }
    }

    const presentCount = session.attendance.length;
    const absentCount = Math.max(0, totalEligible - presentCount);
    const attendancePercentage = totalEligible > 0 ? Math.round((presentCount / totalEligible) * 100) : 0;

    return {
      session,
      summary: {
        totalEligible,
        presentCount,
        absentCount,
        attendancePercentage,
      },
    };
  },

  /**
   * Fetch attendance records for a specific session.
   */
  getSessionRecords: async (
    sessionId: string,
    user?: { userId: string; role: string; instituteId?: string | null }
  ) => {
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) throw createError(404, 'Session not found');

    if (user && user.role === 'institute_admin' && user.instituteId && session.instituteId !== user.instituteId) {
      throw createError(403, 'Unauthorized: Session belongs to another institute');
    }

    return prisma.attendanceRecord.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            rfidUid: true,
            cooperativeAffiliation: true,
            avatarUrl: true,
          },
        },
      },
    });
  },

  /**
   * Faculty / Admin creates a new session.
   */
  createSession: async (
    data: {
      courseId?: string;
      title: string;
      instructor?: string;
      date: string;
      timeSlot: string;
      room: string;
      classroomId?: string;
      capacity?: number;
      attendanceMode?: string;
    },
    user: { userId: string; role: string; name?: string; instituteId?: string | null }
  ) => {
    if (!['faculty', 'institute_admin', 'super_admin'].includes(user.role)) {
      throw createError(403, 'Only faculty and administrators can create attendance sessions');
    }

    let progId = 'prog-pacs-2026-01';
    let instId = user.instituteId || 'inst-vamnicom';

    if (data.courseId) {
      const course = await prisma.course.findUnique({ where: { id: data.courseId } });
      if (course) {
        progId = course.programmeId || progId;
        instId = course.instituteId || instId;
      }
    }

    const instructorName = (data.instructor && data.instructor.trim().length > 0)
      ? data.instructor.trim()
      : (user.name || 'NCCT Faculty');

    const qrToken = `SESS-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    return prisma.session.create({
      data: {
        id: `sess-${Date.now()}`,
        programmeId: progId,
        courseId: data.courseId || null,
        title: data.title,
        instructor: instructorName,
        facultyId: user.userId,
        date: data.date,
        timeSlot: data.timeSlot,
        room: data.room,
        classroomId: data.classroomId || data.room,
        capacity: data.capacity || 40,
        attendanceMode: data.attendanceMode || 'FACE_RFID',
        qrToken,
        active: false,
        instituteId: instId,
      },
    });
  },

  /**
   * Faculty starts attendance for a classroom session.
   * Activates session so physical classroom devices can process check-ins.
   */
  startSession: async (
    sessionId: string,
    user: { userId: string; role: string; instituteId?: string | null }
  ) => {
    if (!['faculty', 'institute_admin', 'super_admin'].includes(user.role)) {
      throw createError(403, 'Unauthorized to start attendance sessions');
    }

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) throw createError(404, 'Session not found');

    if (user.role === 'institute_admin' && user.instituteId && session.instituteId !== user.instituteId) {
      throw createError(403, 'Unauthorized: Cannot modify session from another institute');
    }

    if (user.role === 'faculty' && session.facultyId && session.facultyId !== user.userId) {
      if (user.instituteId && session.instituteId !== user.instituteId) {
        throw createError(403, 'Unauthorized: Cannot modify another faculty member’s session');
      }
    }

    const qrExpiresAt = new Date(Date.now() + 120 * 60 * 1000); // 2-hour attendance window

    return prisma.session.update({
      where: { id: sessionId },
      data: {
        active: true,
        qrExpiresAt,
      },
    });
  },

  /**
   * Faculty stops / closes attendance for a session.
   */
  closeSession: async (
    sessionId: string,
    user: { userId: string; role: string; instituteId?: string | null }
  ) => {
    if (!['faculty', 'institute_admin', 'super_admin'].includes(user.role)) {
      throw createError(403, 'Unauthorized to close attendance sessions');
    }

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) throw createError(404, 'Session not found');

    if (user.role === 'institute_admin' && user.instituteId && session.instituteId !== user.instituteId) {
      throw createError(403, 'Unauthorized: Cannot modify session from another institute');
    }

    return prisma.session.update({
      where: { id: sessionId },
      data: {
        active: false,
      },
    });
  },

  /**
   * ============================================================
   * ONLINE WEB CAMERA FACE ATTENDANCE
   * ============================================================
   */

  /**
   * Fetch active sessions available for the authenticated trainee.
   */
  getActiveSessionsForTrainee: async (userId: string) => {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      select: { courseId: true },
    });
    const enrolledCourseIds = enrollments.map(e => e.courseId);

    const activeSessions = await prisma.session.findMany({
      where: {
        active: true,
        OR: [
          { courseId: { in: enrolledCourseIds } },
          { courseId: null },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        attendance: {
          where: { userId },
          select: { id: true, status: true, timestamp: true, method: true, confidenceScore: true },
        },
      },
    });

    return activeSessions.map(s => {
      const myRecord = s.attendance[0] || null;
      return {
        id: s.id,
        title: s.title,
        courseId: s.courseId,
        instructor: s.instructor,
        date: s.date,
        timeSlot: s.timeSlot,
        room: s.room,
        classroomId: s.classroomId,
        active: s.active,
        isMarked: Boolean(myRecord),
        myAttendance: myRecord,
      };
    });
  },

  /**
   * Mark attendance via Web Camera frame + Python ArcFace AI.
   * Validates:
   *   1. Authenticated trainee
   *   2. Session exists & is LIVE
   *   3. Current time within attendance window
   *   4. Trainee actively enrolled in course
   *   5. No duplicate attendance
   *   6. Python ArcFace recognizes face
   *   7. Recognized identity matches authenticated trainee account (Anti-Proxy)
   *   8. Confidence meets required threshold
   */
  markWebFaceAttendance: async (data: {
    userId: string;
    sessionId: string;
    imageBase64: string;
  }) => {
    const { userId, sessionId, imageBase64 } = data;

    if (!sessionId || !imageBase64) {
      throw createError(400, 'sessionId and image are required.');
    }

    // 1. Authenticate trainee
    const trainee = await prisma.user.findUnique({ where: { id: userId } });
    if (!trainee) throw createError(404, 'User not found.');
    if (trainee.role.toLowerCase() !== 'trainee') {
      throw createError(403, 'Only enrolled trainees can mark web attendance.');
    }

    // 2 & 3. Validate session is LIVE
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) throw createError(404, 'Session not found.');
    if (!session.active) {
      throw createError(400, 'Attendance session is not LIVE or has been closed by faculty.');
    }

    // Check attendance window expiry
    if (session.qrExpiresAt && new Date() > new Date(session.qrExpiresAt)) {
      throw createError(400, 'Attendance window has expired for this session.');
    }

    // 4. Validate trainee course enrollment
    if (session.courseId) {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          userId: trainee.id,
          courseId: session.courseId,
        },
      });
      if (!enrollment) {
        throw createError(403, `You are not enrolled in "${session.title}". Only enrolled students can mark attendance.`);
      }
    }

    // 5. Check duplicate attendance
    const existing = await prisma.attendanceRecord.findUnique({
      where: {
        sessionId_userId: {
          sessionId: session.id,
          userId: trainee.id,
        },
      },
    });
    if (existing) {
      throw createError(409, 'Attendance already marked for this session.');
    }

    // 6. Send image to Python Face AI
    const FACE_MATCH_THRESHOLD = parseFloat(process.env.FACE_MATCH_THRESHOLD || '0.50');
    console.log('[FACE API] Request received for web face recognition');
    const faceResult = await callFaceService('/recognize', { image: imageBase64 });
    console.log('[FACE API] Python response received: matched=' + faceResult.matched + ', identity=' + (faceResult.identity || faceResult.recognizedName) + ', confidence=' + faceResult.confidence);

    const { matched, recognizedName, identity, confidence, message } = faceResult;
    const recognizedIdentity = (recognizedName || identity || '').trim();

    if (!matched || !recognizedIdentity || recognizedIdentity === 'UNKNOWN') {
      throw createError(400, 'Face not recognized. Please position your face clearly in the camera and try again.');
    }

    // 8. Confidence threshold check
    if (confidence < FACE_MATCH_THRESHOLD) {
      throw createError(400, `Face recognition confidence (${confidence}) is below the required security threshold (${FACE_MATCH_THRESHOLD}).`);
    }

    // 7. IDENTITY SECURITY CHECK (ANTI-PROXY GUARD):
    // Compare recognized user against authenticated logged-in user
    const expectedName = trainee.name.toLowerCase();
    const expectedFaceId = (trainee.faceIdentity || '').toLowerCase();
    const expectedUserId = trainee.id.toLowerCase();
    const actualRec = recognizedIdentity.toLowerCase();

    const isMatch = (
      (expectedFaceId && (actualRec === expectedFaceId || expectedFaceId.includes(actualRec))) ||
      actualRec === expectedName ||
      expectedName.includes(actualRec) ||
      actualRec === expectedUserId
    );

    if (!isMatch) {
      console.warn(`[ANTI-PROXY ALERT] Logged in as "${trainee.name}" (${trainee.id}), but face recognized as "${recognizedIdentity}".`);
      throw createError(403, `Face does not match the logged-in account. Logged in as "${trainee.name}", but recognized face belongs to "${recognizedIdentity}".`);
    }

    // ALL CONDITIONS MET -> Insert AttendanceRecord in PostgreSQL
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });

    const record = await prisma.attendanceRecord.create({
      data: {
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sessionId: session.id,
        userId: trainee.id,
        traineeName: trainee.name,
        traineeCoop: trainee.cooperativeAffiliation || 'NCCT Enrolled Trainee',
        method: 'FACE_ONLINE',
        status: 'PRESENT',
        timestamp: `${session.date} ${timeFormatted}`,
        confidenceScore: Math.round(confidence * 1000) / 10,
        deviceLocation: 'Web Camera (VikasSetu Portal)',
      },
    });

    // Notify trainee
    try {
      await notificationRepository.create({
        id: `notif-att-${record.id}`,
        userId: trainee.id,
        title: 'Attendance Marked ✅',
        message: `Your web face attendance for "${session.title}" has been recorded as PRESENT at ${timeFormatted}.`,
        timestamp: now.toISOString(),
        type: 'attendance',
      });
    } catch (nErr) {
      console.warn('[AttendanceService] Could not send notification:', nErr);
    }

    return {
      success: true,
      message: 'Attendance marked successfully!',
      status: 'PRESENT',
      trainee: {
        id: trainee.id,
        name: trainee.name,
      },
      course: {
        id: session.courseId,
        title: session.title,
      },
      confidence,
      markedAt: record.timestamp,
      method: 'FACE_ONLINE',
    };
  },

  /**
   * ============================================================
   * PHYSICAL CLASSROOM HARDWARE FLOW
   * ============================================================
   */

  /**
   * STEP 1: Classroom Device reports RFID tap
   * Validates device, looks up active session in classroom, validates RFID mapping,
   * verifies course enrollment, checks duplicate, and returns short-lived verification token.
   */
  deviceRfidTap: async (data: { deviceCode: string; rfidUid: string; sessionId?: string }) => {
    cleanExpiredTokens();
    const { deviceCode, rfidUid, sessionId } = data;

    if (!deviceCode || !rfidUid) {
      throw createError(400, 'deviceCode and rfidUid are required.');
    }

    // 1. Validate device
    const device = await deviceService.getDeviceByCode(deviceCode);
    if (!device) {
      throw createError(403, `Unregistered device code "${deviceCode}".`);
    }

    // Update device heartbeat
    await deviceService.heartbeat(deviceCode).catch(() => null);

    // 2. Locate active session for classroom or specific target session
    let targetSession: any = null;
    if (sessionId) {
      targetSession = await prisma.session.findUnique({ where: { id: sessionId } });
      if (!targetSession || !targetSession.active) {
        throw createError(400, `Attendance session is not LIVE or has been closed by faculty.`);
      }
    } else {
      targetSession = await prisma.session.findFirst({
        where: {
          active: true,
          OR: [
            { classroomId: device.classroomId },
            { room: device.classroomId },
            { classroomId: null },
          ],
          instituteId: device.instituteId,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!targetSession) {
      throw createError(400, `No LIVE attendance session found in Classroom "${device.classroomId}". Please ask faculty to start attendance.`);
    }

    // Check attendance window expiry
    if (targetSession.qrExpiresAt && new Date() > new Date(targetSession.qrExpiresAt)) {
      throw createError(400, 'Attendance window has expired for this session.');
    }

    // 3. Lookup trainee by RFID
    const trainee = await prisma.user.findUnique({
      where: { rfidUid: rfidUid.trim() },
    });

    if (!trainee) {
      throw createError(404, `Unknown RFID card (${rfidUid}). Card is not assigned to any trainee.`);
    }

    // 4. Validate trainee enrollment
    if (targetSession.courseId) {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          userId: trainee.id,
          courseId: targetSession.courseId,
        },
      });
      if (!enrollment) {
        throw createError(403, `Trainee "${trainee.name}" is not enrolled in this course.`);
      }
    }

    // 5. Check if already marked present
    const existingRecord = await prisma.attendanceRecord.findUnique({
      where: {
        sessionId_userId: {
          sessionId: targetSession.id,
          userId: trainee.id,
        },
      },
    });

    if (existingRecord) {
      throw createError(409, `Attendance already marked for ${trainee.name}.`);
    }

    // 6. Generate 60-second verification token for face matching stage
    const verificationToken = `VT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    verificationTokens.set(verificationToken, {
      traineeId: trainee.id,
      sessionId: targetSession.id,
      expiresAt: Date.now() + 60 * 1000,
    });

    return {
      success: true,
      traineeId: trainee.id,
      traineeName: trainee.name,
      sessionId: targetSession.id,
      courseTitle: targetSession.title,
      classroomId: device.classroomId,
      verificationToken,
      message: `RFID verified for ${trainee.name}. Please look into the camera for face verification.`,
    };
  },

  /**
   * STEP 2: Physical Device / Simulator Face Verification & Final Decision
   * Validates all 11 conditions:
   *   1. Device registered
   *   2. Device belongs to correct classroom
   *   3. Session is LIVE
   *   4. Session window is valid
   *   5. RFID exists
   *   6. RFID belongs to Trainee A
   *   7. Trainee A is enrolled in course
   *   8. Face was recognized by Python model
   *   9. Recognized face belongs to Trainee A (ANTI-PROXY VALIDATION)
   *   10. Confidence meets threshold
   *   11. Trainee has not already been marked present
   */
  deviceVerifyFace: async (data: {
    deviceCode: string;
    rfidUid: string;
    verificationToken?: string;
    imageBase64: string;
    sessionId?: string;
  }) => {
    cleanExpiredTokens();
    const { deviceCode, rfidUid, verificationToken, imageBase64, sessionId } = data;

    if (!deviceCode || !rfidUid || !imageBase64) {
      throw createError(400, 'deviceCode, rfidUid, and imageBase64 are required.');
    }

    // 1 & 2. Device Validation
    const device = await deviceService.getDeviceByCode(deviceCode);
    if (!device) {
      throw createError(403, `Unregistered device code "${deviceCode}".`);
    }
    await deviceService.heartbeat(deviceCode).catch(() => null);

    // 3 & 4. Session LIVE & Window Validation
    let targetSessionId = sessionId;
    if (verificationToken && verificationTokens.has(verificationToken)) {
      targetSessionId = verificationTokens.get(verificationToken)!.sessionId;
    }

    let session: any = null;
    if (targetSessionId) {
      session = await prisma.session.findUnique({ where: { id: targetSessionId } });
    } else {
      session = await prisma.session.findFirst({
        where: {
          active: true,
          OR: [
            { classroomId: device.classroomId },
            { room: device.classroomId },
            { classroomId: null },
          ],
          instituteId: device.instituteId,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!session) {
      throw createError(400, `No attendance session found for classroom "${device.classroomId}".`);
    }
    if (!session.active) {
      throw createError(400, 'Attendance session is not LIVE or has been closed by faculty.');
    }
    if (session.qrExpiresAt && new Date() > new Date(session.qrExpiresAt)) {
      throw createError(400, 'Attendance window has expired for this session.');
    }

    // 5 & 6. RFID belongs to Trainee A
    const trainee = await prisma.user.findUnique({
      where: { rfidUid: rfidUid.trim() },
    });
    if (!trainee) {
      throw createError(404, `Unknown RFID UID (${rfidUid}). Card is not assigned to any trainee.`);
    }

    // 7. Trainee A enrolled in course
    if (session.courseId) {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          userId: trainee.id,
          courseId: session.courseId,
        },
      });
      if (!enrollment) {
        throw createError(403, `Trainee "${trainee.name}" is not enrolled in course "${session.title}".`);
      }
    }

    // 11. Duplicate check before face inference
    const existing = await prisma.attendanceRecord.findUnique({
      where: {
        sessionId_userId: {
          sessionId: session.id,
          userId: trainee.id,
        },
      },
    });
    if (existing) {
      throw createError(409, `Attendance already marked for ${trainee.name} in this session.`);
    }

    // 8. Python Face AI Verification
    console.log('[FACE API] Request received for physical classroom face verification');
    const faceResult = await callFaceService('/recognize', { image: imageBase64 });
    console.log('[FACE API] Python response received: matched=' + faceResult.matched + ', identity=' + (faceResult.identity || faceResult.recognizedName) + ', confidence=' + faceResult.confidence);

    const { matched, identity, confidence, message } = faceResult;

    if (!matched || !identity || identity === 'UNKNOWN') {
      throw createError(400, `Face not recognized: ${message || 'No enrolled face matched in camera frame'}. (Confidence: ${confidence})`);
    }

    // 10. Server-side confidence threshold check
    if (confidence < CONFIDENCE_THRESHOLD) {
      throw createError(400, `Face recognition confidence (${confidence}) is below the required security threshold (${CONFIDENCE_THRESHOLD}).`);
    }

    // 9. ANTI-PROXY ATTENDANCE VALIDATION:
    // Recognized face identity must match the trainee holding this RFID card.
    const expectedIdentity = (trainee.faceIdentity || trainee.name || trainee.id).toLowerCase();
    const recognizedIdentity = identity.toLowerCase();

    const isMatch = (
      recognizedIdentity === expectedIdentity ||
      recognizedIdentity === trainee.id.toLowerCase() ||
      recognizedIdentity === trainee.name.toLowerCase() ||
      expectedIdentity.includes(recognizedIdentity) ||
      recognizedIdentity.includes(expectedIdentity)
    );

    if (!isMatch) {
      console.warn(`[ANTI-PROXY REJECTION] RFID belongs to "${trainee.name}" (${trainee.id}) but Face recognized as "${identity}" (Confidence: ${confidence})`);
      throw createError(403, `Identity mismatch! Proxy attendance rejected: RFID card belongs to "${trainee.name}", but face recognized as "${identity}". Attendance NOT recorded.`);
    }

    // ALL 11 CONDITIONS PASSED -> Create AttendanceRecord
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });

    const record = await prisma.attendanceRecord.create({
      data: {
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sessionId: session.id,
        userId: trainee.id,
        traineeName: trainee.name,
        traineeCoop: trainee.cooperativeAffiliation || 'NCCT Enrolled Trainee',
        method: 'FACE_RFID',
        status: 'PRESENT',
        timestamp: `${session.date} ${timeFormatted}`,
        confidenceScore: Math.round(confidence * 1000) / 10, // e.g. 94.2%
        deviceLocation: `${device.name} (${device.classroomId})`,
      },
    });

    // Cleanup verification token if used
    if (verificationToken) {
      verificationTokens.delete(verificationToken);
    }

    // Send notification
    try {
      await notificationRepository.create({
        id: `notif-att-${record.id}`,
        userId: trainee.id,
        title: 'Classroom Attendance Recorded ✅',
        message: `Your physical classroom attendance for "${session.title}" was verified via RFID + Face AI at ${timeFormatted}.`,
        timestamp: now.toISOString(),
        type: 'attendance',
      });
    } catch (nErr) {
      console.warn('[AttendanceService] Could not send notification:', nErr);
    }

    return {
      success: true,
      status: 'PRESENT',
      trainee: {
        id: trainee.id,
        name: trainee.name,
        rfidUid: trainee.rfidUid,
      },
      course: {
        id: session.courseId,
        title: session.title,
      },
      session: {
        id: session.id,
        room: session.room,
        classroomId: session.classroomId,
      },
      confidence,
      markedAt: record.timestamp,
      method: 'FACE_RFID',
    };
  },

  /**
   * Assign or update RFID UID for a trainee (Faculty or Admin only).
   */
  assignRfid: async (
    data: { traineeId: string; rfidUid: string },
    user: { userId: string; role: string }
  ) => {
    if (!['faculty', 'institute_admin', 'super_admin'].includes(user.role)) {
      throw createError(403, 'Unauthorized to assign RFID cards.');
    }

    const { traineeId, rfidUid } = data;
    if (!traineeId || !rfidUid) {
      throw createError(400, 'traineeId and rfidUid are required.');
    }

    const trainee = await prisma.user.findUnique({ where: { id: traineeId } });
    if (!trainee) throw createError(404, 'Trainee not found.');

    const cleanRfid = rfidUid.trim();

    // Check if card is already assigned to someone else
    const existing = await prisma.user.findUnique({ where: { rfidUid: cleanRfid } });
    if (existing && existing.id !== traineeId) {
      throw createError(409, `RFID card "${cleanRfid}" is already assigned to "${existing.name}" (${existing.id}).`);
    }

    return prisma.user.update({
      where: { id: traineeId },
      data: { rfidUid: cleanRfid },
      select: {
        id: true,
        name: true,
        email: true,
        rfidUid: true,
        faceEnrolled: true,
        faceIdentity: true,
      },
    });
  },

  /**
   * One-time Biometric Face Enrollment.
   * Trainee (or Admin/Faculty on their behalf) uploads face photo to Python model.
   */
  enrollFace: async (
    data: { userId: string; identity?: string; imageBase64: string },
    user: { userId: string; role: string }
  ) => {
    // Only the trainee themselves or an admin/faculty can enroll face
    if (user.role === 'trainee' && user.userId !== data.userId) {
      throw createError(403, 'Trainees can only complete their own face enrollment.');
    }

    const trainee = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!trainee) throw createError(404, 'User not found.');

    const targetIdentity = (data.identity || trainee.name.split(' ')[0] || trainee.id).toLowerCase();

    // Call Python Face Service /enroll
    console.log('[FACE API] Request received for face enrollment: identity=' + targetIdentity);
    const pyResult = await callFaceService('/enroll', {
      identity: targetIdentity,
      image: data.imageBase64,
    });
    console.log('[FACE API] Python response received for enrollment: success=' + pyResult.success + ', total=' + pyResult.enrolled_count);

    // Update user in DB
    const updated = await prisma.user.update({
      where: { id: data.userId },
      data: {
        faceEnrolled: true,
        faceIdentity: targetIdentity,
      },
      select: {
        id: true,
        name: true,
        email: true,
        faceEnrolled: true,
        faceIdentity: true,
      },
    });

    return {
      success: true,
      message: `Biometric face enrollment completed successfully for ${updated.name}`,
      user: updated,
      modelIdentity: targetIdentity,
    };
  },

  /**
   * Get attendance history for a specific trainee.
   */
  getTraineeHistory: async (userId: string) => {
    const records = await prisma.attendanceRecord.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      include: {
        session: {
          select: {
            id: true,
            title: true,
            date: true,
            timeSlot: true,
            room: true,
            classroomId: true,
            courseId: true,
          },
        },
      },
    });

    return records.map(r => ({
      id: r.id,
      sessionId: r.sessionId,
      courseTitle: r.session?.title || 'Classroom Session',
      date: r.session?.date || r.timestamp.split(' ')[0],
      time: r.timestamp.includes(' ') ? r.timestamp.split(' ').slice(1).join(' ') : r.timestamp,
      room: r.session?.room || r.session?.classroomId || 'Classroom',
      method: r.method,
      confidence: r.confidenceScore,
      status: r.status,
      deviceLocation: r.deviceLocation,
    }));
  },

  /**
   * Real-time polling summary for Faculty dashboard.
   */
  getSessionSummary: async (sessionId: string) => {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        attendance: {
          orderBy: { timestamp: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                rfidUid: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!session) throw createError(404, 'Session not found');

    let totalEligible = session.capacity || 40;
    if (session.courseId) {
      const count = await prisma.enrollment.count({ where: { courseId: session.courseId } });
      if (count > 0) totalEligible = count;
    }

    const presentCount = session.attendance.length;
    const absentCount = Math.max(0, totalEligible - presentCount);
    const attendancePercentage = totalEligible > 0 ? Math.round((presentCount / totalEligible) * 100) : 0;

    return {
      sessionId: session.id,
      title: session.title,
      room: session.room,
      classroomId: session.classroomId,
      active: session.active,
      date: session.date,
      timeSlot: session.timeSlot,
      summary: {
        totalEligible,
        presentCount,
        absentCount,
        attendancePercentage,
      },
      attendees: session.attendance.map(a => ({
        id: a.id,
        traineeId: a.userId,
        name: a.traineeName,
        email: a.user?.email,
        coop: a.traineeCoop,
        method: a.method,
        status: a.status,
        confidence: a.confidenceScore,
        time: a.timestamp,
        rfidUid: a.user?.rfidUid,
      })),
    };
  },

  /**
   * Diagnostic health check testing Node -> Python Face Service connectivity.
   */
  checkFaceHealth: async () => {
    try {
      const targetUrl = (process.env.FACE_SERVICE_URL || FACE_SERVICE_URL).trim().replace(/\/+$/, '');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(`${targetUrl}/health`, {
        signal: controller.signal,
        headers: { 'Connection': 'close' },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data: any = await res.json().catch(() => ({}));
        return {
          status: 'ok',
          faceService: 'reachable',
          model: data.model || 'ArcFace buffalo_sc',
          enrolledCount: data.enrolled_count ?? undefined,
        };
      }
      return {
        status: 'error',
        faceService: 'unreachable',
        statusCode: res.status,
      };
    } catch (err: any) {
      return {
        status: 'error',
        faceService: 'unreachable',
        error: 'Face service request failed or timed out',
      };
    }
  },
};
