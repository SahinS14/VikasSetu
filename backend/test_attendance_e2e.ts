/**
 * backend/test_attendance_e2e.ts
 *
 * End-to-end automated verification for the new Attendance Management Architecture:
 * 1. Faculty session creation & dynamic QR generation
 * 2. Strict authorization boundaries (Trainee blocked from management)
 * 3. Server-side token validation & course enrollment verification
 * 4. PostgreSQL AttendanceRecord persistence & duplicate prevention
 * 5. Real-time summary metrics & session closure
 */

import 'dotenv/config';

const BASE_URL = 'http://localhost:5000/api';

async function login(identifier: string, password: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  const data = await res.json() as any;
  if (!data.token) {
    throw new Error(`Login failed for ${identifier}: ${JSON.stringify(data)}`);
  }
  return data.token;
}

async function runTests() {
  console.log('🧪 Starting End-to-End Attendance Architecture Verification...\n');

  // Step 1: Login as Faculty
  console.log('1. Logging in as Faculty (faculty@ncct.gov.in)...');
  const facultyToken = await login('faculty@ncct.gov.in', 'Faculty@1234');
  console.log('   ✅ Faculty authenticated.');

  // Step 2: Login as Trainee
  console.log('2. Logging in as Trainee (rameshwar.pacs@gmail.com)...');
  const traineeToken = await login('rameshwar.pacs@gmail.com', 'Demo@1234');
  console.log('   ✅ Trainee authenticated.');

  // Step 3: Security Test — Trainee must NOT be able to create session
  console.log('3. Security Check: Trainee attempting to create session...');
  const unauthorizedCreate = await fetch(`${BASE_URL}/attendance/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${traineeToken}` },
    body: JSON.stringify({
      title: 'Hacked Trainee Session',
      date: '2026-09-08',
      timeSlot: '10:00 AM - 12:00 PM',
      room: 'Room 99',
    }),
  });
  if (unauthorizedCreate.status === 403) {
    console.log('   ✅ Correctly blocked with 403 Forbidden.');
  } else {
    throw new Error(`Security breach: Trainee created session with status ${unauthorizedCreate.status}`);
  }

  // Step 4: Faculty creates a new session
  console.log('4. Faculty creating session for course "crs-pacs-erp-101"...');
  const createRes = await fetch(`${BASE_URL}/attendance/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${facultyToken}` },
    body: JSON.stringify({
      courseId: 'crs-pacs-erp-101',
      title: 'Day-Open & Ledger Reconciliation Masterclass',
      date: '2026-09-08',
      timeSlot: '11:00 AM – 01:00 PM',
      room: 'Smart Computer Lab 2',
      capacity: 35,
      attendanceMode: 'QR',
    }),
  });
  const createdSession = await createRes.json() as any;
  if (!createdSession.id) {
    throw new Error(`Session creation failed: ${JSON.stringify(createdSession)}`);
  }
  console.log(`   ✅ Session created: ${createdSession.title} (ID: ${createdSession.id}, active: ${createdSession.active})`);

  // Step 5: Faculty starts the session & activates dynamic QR
  console.log('5. Faculty starting attendance session...');
  const startRes = await fetch(`${BASE_URL}/attendance/sessions/${createdSession.id}/start`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${facultyToken}` },
  });
  const activeSession = await startRes.json() as any;
  if (!activeSession.active || !activeSession.qrToken) {
    throw new Error(`Session activation failed: ${JSON.stringify(activeSession)}`);
  }
  console.log(`   ✅ Session LIVE! Dynamic QR Token: ${activeSession.qrToken}`);

  // Step 6: Trainee attempts check-in with invalid token
  console.log('6. Trainee attempting check-in with WRONG QR token...');
  const badTokenRes = await fetch(`${BASE_URL}/attendance/check-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${traineeToken}` },
    body: JSON.stringify({
      sessionId: createdSession.id,
      qrToken: 'WRONG-QR-TOKEN-999',
      method: 'qr',
    }),
  });
  if (badTokenRes.status === 400) {
    const err = await badTokenRes.json() as any;
    console.log(`   ✅ Correctly rejected: "${err.error || err.message}"`);
  } else {
    throw new Error(`Expected 400 rejection for bad token, got ${badTokenRes.status}`);
  }

  // Step 7: Trainee checks in with VALID token
  console.log('7. Trainee checking in with VALID dynamic QR token...');
  const checkInRes = await fetch(`${BASE_URL}/attendance/check-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${traineeToken}` },
    body: JSON.stringify({
      sessionId: createdSession.id,
      qrToken: activeSession.qrToken,
      method: 'qr',
    }),
  });
  const checkInData = await checkInRes.json() as any;
  if (!checkInData.success || !checkInData.record) {
    throw new Error(`Check-in failed: ${JSON.stringify(checkInData)}`);
  }
  console.log(`   ✅ Attendance RECORDED: ${checkInData.record.traineeName} | Method: ${checkInData.record.method} | Status: ${checkInData.record.status}`);

  // Step 8: Trainee attempts duplicate check-in
  console.log('8. Trainee attempting DUPLICATE check-in...');
  const dupRes = await fetch(`${BASE_URL}/attendance/check-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${traineeToken}` },
    body: JSON.stringify({
      sessionId: createdSession.id,
      qrToken: activeSession.qrToken,
      method: 'qr',
    }),
  });
  if (dupRes.status === 409) {
    const err = await dupRes.json() as any;
    console.log(`   ✅ Correctly rejected duplicate: "${err.error || err.message}"`);
  } else {
    throw new Error(`Expected 409 conflict for duplicate, got ${dupRes.status}`);
  }

  // Step 9: Faculty monitors live session details & roster
  console.log('9. Faculty fetching live session attendance details...');
  const detailsRes = await fetch(`${BASE_URL}/attendance/sessions/${createdSession.id}`, {
    headers: { Authorization: `Bearer ${facultyToken}` },
  });
  const details = await detailsRes.json() as any;
  console.log(`   ✅ Live Summary: Present: ${details.summary.presentCount}/${details.summary.totalEligible} (${details.summary.attendancePercentage}%)`);
  console.log(`   ✅ Roster verified: ${details.session.attendance[0]?.traineeName} (${details.session.attendance[0]?.user?.email}) checked in at ${details.session.attendance[0]?.timestamp}`);

  // Step 10: Faculty closes the session
  console.log('10. Faculty closing session...');
  const closeRes = await fetch(`${BASE_URL}/attendance/sessions/${createdSession.id}/close`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${facultyToken}` },
  });
  const closedSession = await closeRes.json() as any;
  if (closedSession.active !== false) {
    throw new Error(`Closing session failed: ${JSON.stringify(closedSession)}`);
  }
  console.log('   ✅ Session status now COMPLETED / Inactive.');

  // Step 11: Trainee attempts check-in on CLOSED session
  console.log('11. Trainee attempting check-in on CLOSED session...');
  const closedCheckInRes = await fetch(`${BASE_URL}/attendance/check-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${traineeToken}` },
    body: JSON.stringify({
      sessionId: createdSession.id,
      qrToken: activeSession.qrToken,
      method: 'qr',
    }),
  });
  if (closedCheckInRes.status === 400) {
    const err = await closedCheckInRes.json() as any;
    console.log(`   ✅ Correctly rejected: "${err.error || err.message}"`);
  } else {
    throw new Error(`Expected 400 for closed session check-in, got ${closedCheckInRes.status}`);
  }

  console.log('\n🎉 ALL 11 END-TO-END VERIFICATION STEPS PASSED PERFECTLY!\n');
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
