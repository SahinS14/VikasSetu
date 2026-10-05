/**
 * backend/test_web_attendance_e2e.ts
 *
 * Comprehensive End-to-End Automated Test Suite for VikasSetu
 * Web-Based Face Attendance System.
 *
 * Verifies all 11 core flow & anti-proxy security cases:
 *  1. Faculty starts classroom attendance session -> Session LIVE.
 *  2. Trainee queries active sessions -> Sees eligible session.
 *  3. Trainee marks web face attendance -> PRESENT (FACE_ONLINE) saved in PostgreSQL.
 *  4. Duplicate attendance prevention -> 409 Conflict rejected.
 *  5. Anti-Proxy Protection: Logged-in trainee vs recognized face mismatch -> 403 Rejected.
 *  6. Course enrollment verification: Unenrolled trainee -> 403 Rejected.
 *  7. Closed / Inactive session check -> 400 Rejected.
 *  8. Low confidence detection -> 400 Rejected.
 *  9. No face detected in frame -> 400 Rejected.
 * 10. Faculty real-time attendance roster & summary polling -> Verified in PostgreSQL.
 * 11. Trainee attendance history retrieval -> Verified in PostgreSQL.
 */

import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import prisma from './src/config/prisma';

const API_BASE = 'http://127.0.0.1:5000/api';
const FACE_SERVICE_URL = 'http://127.0.0.1:8000';
const JWT_SECRET = process.env.JWT_SECRET || 'vikas_setu_secret_jwt_key_2026';

// Real test frames (generated from real faces)
const face0Path = path.resolve(__dirname, '../FACE/test_face_0.jpg');
const face1Path = path.resolve(__dirname, '../FACE/test_face_1.jpg');
const blankPath = path.resolve(__dirname, '../FACE/test_blank.jpg');

const face0Base64 = `data:image/jpeg;base64,${fs.readFileSync(face0Path).toString('base64')}`;
const face1Base64 = `data:image/jpeg;base64,${fs.readFileSync(face1Path).toString('base64')}`;
const blankBase64 = `data:image/jpeg;base64,${fs.readFileSync(blankPath).toString('base64')}`;

function generateToken(user: { id: string; email: string; role: string }) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '2h' }
  );
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 SAHAKAR SETU: WEB-BASED FACE ATTENDANCE E2E VERIFICATION');
  console.log('================================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      if (detail) console.log(`   └─ ${detail}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (detail) console.error(`   └─ Details: ${detail}`);
      failedTests++;
    }
  }

  try {
    // 0. Setup Users & Auth Tokens
    const faculty = await prisma.user.findFirst({ where: { role: 'faculty' } });
    if (!faculty) throw new Error('No faculty user found in database');

    const trainee1 = await prisma.user.findUnique({ where: { id: 'usr-trainee-1' } });
    if (!trainee1) throw new Error('Trainee usr-trainee-1 not found in database');

    const trainee2 = await prisma.user.findUnique({ where: { id: 'usr-trainee-2' } });
    if (!trainee2) throw new Error('Trainee usr-trainee-2 not found in database');

    const facultyToken = generateToken({ id: faculty.id, email: faculty.email, role: 'faculty' });
    const trainee1Token = generateToken({ id: trainee1.id, email: trainee1.email, role: 'trainee' });
    const trainee2Token = generateToken({ id: trainee2.id, email: trainee2.email, role: 'trainee' });

    const originalTrainee1FaceId = trainee1.faceIdentity === 'test_student' ? null : trainee1.faceIdentity;
    const originalTrainee1Enrolled = trainee1.faceIdentity === 'test_student' ? false : trainee1.faceEnrolled;
    const originalTrainee2FaceId = trainee2.faceIdentity;
    const originalTrainee2Enrolled = trainee2.faceEnrolled;

    console.log(`[Setup] Faculty: ${faculty.name} (${faculty.id})`);
    console.log(`[Setup] Trainee 1 original faceId: "${originalTrainee1FaceId}"`);
    console.log(`[Setup] Trainee 2 original faceId: "${originalTrainee2FaceId}"\n`);

    // Enroll test_face_0 as test_student on the real Face AI service
    const enrollTestRes = await fetch(`${FACE_SERVICE_URL}/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identity: 'test_student',
        image: face0Base64,
      }),
    });
    const enrollTestData = await enrollTestRes.json();
    console.log(`[Setup] Real model face enrollment: ${enrollTestData.success ? 'SUCCESS' : 'FAILED'}, identity: ${enrollTestData.identity}`);

    // Set trainee 1 face identity to test_student
    await prisma.user.update({
      where: { id: trainee1.id },
      data: { faceIdentity: 'test_student', faceEnrolled: true },
    });
    // Set trainee 2 face identity to sunita
    await prisma.user.update({
      where: { id: trainee2.id },
      data: { faceIdentity: 'sunita', faceEnrolled: true },
    });

    // Clean up any previous test sessions / records
    const testSessionId = `test-sess-e2e-${Date.now()}`;
    const courseId = 'crs-pacs-erp-101'; // Rameshwar Patil is enrolled in this course

    // Ensure trainee 1 is enrolled in crs-pacs-erp-101
    await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: trainee1.id,
          courseId,
        },
      },
      update: {},
      create: {
        id: `enr-test-t1-${Date.now()}`,
        userId: trainee1.id,
        courseId,
        status: 'IN_PROGRESS',
        enrolledDate: new Date().toISOString().split('T')[0],
      },
    });

    const existingSession = await prisma.session.findFirst();
    const programmeId = existingSession?.programmeId || 'prog-pacs-2026';

    // Create a new session for this test
    const todayStr = new Date().toISOString().split('T')[0];
    const createdSession = await prisma.session.create({
      data: {
        id: testSessionId,
        title: 'PACS ERP Operations E2E Lab',
        courseId,
        programmeId,
        date: todayStr,
        timeSlot: '10:00 AM - 12:00 PM',
        room: 'Lab 201',
        classroomId: 'CR-101',
        instructor: faculty.name,
        facultyId: faculty.id,
        instituteId: faculty.instituteId,
        active: false,
        attendanceMode: 'WEB_FACE',
        qrToken: `QR-${Date.now()}-1`,
      },
    });

    // ──────────────────────────────────────────────────────────────────────────
    // CASE 1: Faculty Starts Attendance Session
    // ──────────────────────────────────────────────────────────────────────────
    const startRes = await fetch(`${API_BASE}/attendance/sessions/${testSessionId}/start`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${facultyToken}`,
        'Content-Type': 'application/json',
      },
    });
    const startData = await startRes.json();
    assert(
      startRes.ok && (startData.active === true || startData.session?.active === true),
      'Case 1: Faculty Starts Classroom Attendance Session',
      `Session status: ${startData.status || startData.session?.status}, Active: ${startData.active ?? startData.session?.active}`
    );

    // ──────────────────────────────────────────────────────────────────────────
    // CASE 2: Trainee Queries Active Classroom Sessions
    // ──────────────────────────────────────────────────────────────────────────
    const activeRes = await fetch(`${API_BASE}/attendance/active`, {
      headers: { Authorization: `Bearer ${trainee1Token}` },
    });
    const activeList = await activeRes.json();
    const foundSession = Array.isArray(activeList) && activeList.some((s: any) => s.id === testSessionId);
    assert(
      activeRes.ok && foundSession,
      'Case 2: Trainee retrieves active sessions for enrolled course',
      `Active sessions count: ${activeList.length}, Found test session: ${foundSession}`
    );

    // ──────────────────────────────────────────────────────────────────────────
    // CASE 3: Valid Web Face Attendance Verification & Persistence
    // ──────────────────────────────────────────────────────────────────────────
    // Trainee 1 (Rameshwar Patil, faceIdentity: 'test_student') sends matching real face
    const markRes = await fetch(`${API_BASE}/attendance/face`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${trainee1Token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: testSessionId,
        image: face0Base64,
      }),
    });
    const markData = await markRes.json();
    assert(
      markRes.ok && markData.status === 'PRESENT' && markData.method === 'FACE_ONLINE',
      'Case 3: Enrolled trainee successfully marks web face attendance',
      `Status: ${markData.status}, Method: ${markData.method}, Confidence: ${markData.confidence}%`
    );

    // Verify record directly in PostgreSQL
    const dbRecord = await prisma.attendanceRecord.findUnique({
      where: {
        sessionId_userId: {
          sessionId: testSessionId,
          userId: trainee1.id,
        },
      },
    });
    assert(
      dbRecord !== null && dbRecord.status === 'PRESENT' && dbRecord.method === 'FACE_ONLINE',
      'Case 3 (DB Verification): Record persisted in PostgreSQL with method=FACE_ONLINE',
      `Record ID: ${dbRecord?.id}, Method: ${dbRecord?.method}, Confidence: ${dbRecord?.confidenceScore}`
    );

    // ──────────────────────────────────────────────────────────────────────────
    // CASE 4: Duplicate Attendance Prevention
    // ──────────────────────────────────────────────────────────────────────────
    const dupRes = await fetch(`${API_BASE}/attendance/face`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${trainee1Token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: testSessionId,
        image: face0Base64,
      }),
    });
    assert(
      dupRes.status === 409,
      'Case 4: Duplicate attendance attempt rejected with 409 Conflict',
      `HTTP status: ${dupRes.status}`
    );

    // ──────────────────────────────────────────────────────────────────────────
    // CASE 5: Anti-Proxy Guard (Logged-in Trainee 2 vs Face Identity test_student)
    // ──────────────────────────────────────────────────────────────────────────
    // Ensure Trainee 2 is enrolled so enrollment check doesn't shadow anti-proxy
    await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: trainee2.id,
          courseId,
        },
      },
      update: {},
      create: {
        id: `enr-test-t2-${Date.now()}`,
        userId: trainee2.id,
        courseId,
        status: 'IN_PROGRESS',
        enrolledDate: todayStr,
      },
    });

    const proxyRes = await fetch(`${API_BASE}/attendance/face`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${trainee2Token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: testSessionId,
        image: face0Base64, // Trainee 2 is Sunita, but face is test_student
      }),
    });
    const proxyData = await proxyRes.json();
    const errorMsg = proxyData.message || proxyData.error || '';
    assert(
      proxyRes.status === 403 && errorMsg.includes('Face does not match the logged-in account'),
      'Case 5: Anti-Proxy Protection rejects face identity mismatch with 403 Forbidden',
      `HTTP Status: ${proxyRes.status}, Error: "${errorMsg}"`
    );

    // ──────────────────────────────────────────────────────────────────────────
    // CASE 6: Course Enrollment Guard (Trainee not enrolled in course)
    // ──────────────────────────────────────────────────────────────────────────
    // Create separate course session where trainee 1 is NOT enrolled
    const unEnrolledSessionId = `test-sess-unenrolled-${Date.now()}`;
    await prisma.session.create({
      data: {
        id: unEnrolledSessionId,
        title: 'Advanced Agri-Dairy Processing',
        courseId: 'crs-non-existent-or-unassigned',
        programmeId,
        date: todayStr,
        timeSlot: '02:00 PM - 04:00 PM',
        room: 'Room 303',
        classroomId: 'CR-303',
        instructor: faculty.name,
        facultyId: faculty.id,
        active: true,
        attendanceMode: 'WEB_FACE',
        qrToken: `QR-${Date.now()}-2`,
      },
    });

    const unEnrolledRes = await fetch(`${API_BASE}/attendance/face`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${trainee1Token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: unEnrolledSessionId,
        image: face0Base64,
      }),
    });
    assert(
      unEnrolledRes.status === 403,
      'Case 6: Unenrolled student rejected with 403 Forbidden',
      `HTTP Status: ${unEnrolledRes.status}`
    );

    // ──────────────────────────────────────────────────────────────────────────
    // CASE 7: Inactive / Closed Session Guard
    // ──────────────────────────────────────────────────────────────────────────
    const closedSessionId = `test-sess-closed-${Date.now()}`;
    await prisma.session.create({
      data: {
        id: closedSessionId,
        title: 'Closed Session Test',
        courseId,
        programmeId,
        date: todayStr,
        timeSlot: '08:00 AM - 09:00 AM',
        room: 'Lab 101',
        classroomId: 'CR-101',
        instructor: faculty.name,
        facultyId: faculty.id,
        active: false, // Closed!
        attendanceMode: 'WEB_FACE',
        qrToken: `QR-${Date.now()}-3`,
      },
    });

    const closedRes = await fetch(`${API_BASE}/attendance/face`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${trainee1Token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: closedSessionId,
        image: face0Base64,
      }),
    });
    assert(
      closedRes.status === 400,
      'Case 7: Closed / Inactive session rejected with 400 Bad Request',
      `HTTP Status: ${closedRes.status}`
    );

    // ──────────────────────────────────────────────────────────────────────────
    // CASE 8: Low Confidence / Unknown Face Match Guard (Real Unenrolled Face)
    // ──────────────────────────────────────────────────────────────────────────
    // Create active session for Trainee 1
    const lowConfSessionId = `test-sess-lowconf-${Date.now()}`;
    await prisma.session.create({
      data: {
        id: lowConfSessionId,
        title: 'Low Conf Test Session',
        courseId,
        programmeId,
        date: todayStr,
        timeSlot: '04:00 PM - 05:00 PM',
        room: 'Lab 102',
        instructor: faculty.name,
        facultyId: faculty.id,
        active: true,
        attendanceMode: 'WEB_FACE',
        qrToken: `QR-${Date.now()}-4`,
      },
    });

    const lowConfRes = await fetch(`${API_BASE}/attendance/face`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${trainee1Token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: lowConfSessionId,
        image: face1Base64, // Real face but not enrolled (confidence ~0.07 < 0.50)
      }),
    });
    assert(
      lowConfRes.status === 400,
      'Case 8: Low confidence face match rejected with 400 Bad Request',
      `HTTP Status: ${lowConfRes.status}`
    );

    // ──────────────────────────────────────────────────────────────────────────
    // CASE 9: No Face Detected in Frame Guard (Real Blank Image)
    // ──────────────────────────────────────────────────────────────────────────
    const noFaceRes = await fetch(`${API_BASE}/attendance/face`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${trainee1Token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: lowConfSessionId,
        image: blankBase64, // Real blank frame with 0 faces
      }),
    });
    assert(
      noFaceRes.status === 400,
      'Case 9: Frame with no face rejected with 400 Bad Request',
      `HTTP Status: ${noFaceRes.status}`
    );

    // ──────────────────────────────────────────────────────────────────────────
    // CASE 10: Faculty Real-Time Attendance Roster & Summary
    // ──────────────────────────────────────────────────────────────────────────
    const summaryRes = await fetch(`${API_BASE}/attendance/sessions/${testSessionId}/summary`, {
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    const summaryData = await summaryRes.json();
    const hasTrainee1 = summaryData.attendees?.some(
      (a: any) => a.traineeId === trainee1.id && a.method === 'FACE_ONLINE'
    );
    assert(
      summaryRes.ok && summaryData.summary?.presentCount >= 1 && hasTrainee1,
      'Case 10: Faculty real-time roster reflects trainee web face attendance',
      `Present count: ${summaryData.summary?.presentCount}, Trainee 1 in attendees: ${hasTrainee1}`
    );

    // ──────────────────────────────────────────────────────────────────────────
    // CASE 11: Trainee Attendance History
    // ──────────────────────────────────────────────────────────────────────────
    const historyRes = await fetch(`${API_BASE}/attendance/history`, {
      headers: { Authorization: `Bearer ${trainee1Token}` },
    });
    const historyData = await historyRes.json();
    const recordedInHistory = Array.isArray(historyData) && historyData.some(
      (h: any) => h.sessionId === testSessionId && h.method === 'FACE_ONLINE'
    );
    assert(
      historyRes.ok && recordedInHistory,
      'Case 11: Trainee attendance history displays verified record with FACE_ONLINE',
      `Total history records: ${historyData.length}, Found session: ${recordedInHistory}`
    );

    // ──────────────────────────────────────────────────────────────────────────
    // Cleanup Test Data
    // ──────────────────────────────────────────────────────────────────────────
    await prisma.attendanceRecord.deleteMany({
      where: {
        sessionId: {
          in: [testSessionId, unEnrolledSessionId, closedSessionId, lowConfSessionId],
        },
      },
    }).catch(() => {});

    await prisma.session.deleteMany({
      where: {
        id: {
          in: [testSessionId, unEnrolledSessionId, closedSessionId, lowConfSessionId],
        },
      },
    }).catch(() => {});

    // Restore trainee identities in database
    await prisma.user.update({
      where: { id: trainee1.id },
      data: { faceIdentity: originalTrainee1FaceId, faceEnrolled: originalTrainee1Enrolled },
    }).catch((e) => console.warn('Warning restoring trainee1 face:', e.message));

    await prisma.user.update({
      where: { id: trainee2.id },
      data: { faceIdentity: originalTrainee2FaceId, faceEnrolled: originalTrainee2Enrolled },
    }).catch((e) => console.warn('Warning restoring trainee2 face:', e.message));

    // Remove test_student via microservice and fallback
    try {
      await fetch(`${FACE_SERVICE_URL}/identities/test_student`, { method: 'DELETE' });
    } catch (_) {}

    const enrolledPklPath = path.resolve(__dirname, '../FACE/enrolled.pkl');
    if (fs.existsSync(enrolledPklPath)) {
      const { execSync } = await import('child_process');
      try {
        execSync(
          `& "C:\\Users\\KARTHIKEYAN\\AppData\\Local\\Programs\\Python\\Python311\\python.exe" -c "import pickle; p = r'${enrolledPklPath}'; f = open(p, 'rb'); d = pickle.load(f); f.close(); d.pop('test_student', None); f = open(p, 'wb'); pickle.dump(d, f); f.close()"`,
          { shell: 'powershell.exe' }
        );
      } catch (_) {}
    }

    console.log('\n================================================================');
    console.log(`🎉 TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
    console.log('================================================================');

    if (failedTests > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err: any) {
    console.error('Fatal error during test execution:', err);
    process.exit(1);
  }
}

runTests();
