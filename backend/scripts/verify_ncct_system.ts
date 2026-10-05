import 'dotenv/config';
import prisma from '../src/config/prisma';
import { programmeService } from '../src/services/programmeService';
import { documentVaultService } from '../src/services/documentVaultService';
import { instituteService } from '../src/services/instituteService';

async function runVerification() {
  console.log('🧪 Starting End-to-End NCCT Institutional Verification Suite...\n');

  // Test 1: NCCT Programme Types
  console.log('1️⃣  Checking NCCT Programme Types:');
  const types = await programmeService.getProgrammeTypes();
  console.log(`   Found ${types.length} programme types:`, types.map(t => t.code).join(', '));
  if (types.length < 5) throw new Error('Missing programme types');
  console.log('   ✅ Programme types verified.\n');

  // Test 2: Programme Catalogue & Details
  console.log('2️⃣  Checking Programme Catalogue & Offerings:');
  const catalog = await programmeService.getProgrammes();
  console.log(`   Catalogue has ${catalog.data.length} offerings.`);
  const pgdm = await programmeService.getProgrammeById('prog-pgdm-2026', 'usr-trainee-1');
  console.log(`   Loaded '${pgdm.title}' with deliveryMode: ${pgdm.deliveryMode}, fee: ₹${pgdm.fee}`);
  if (!pgdm.eligibilityRule) throw new Error('Eligibility rule missing on PGDM');
  console.log('   ✅ Programme catalogue and detail verified.\n');

  // Test 3: Automated Eligibility Verification Engine
  console.log('3️⃣  Testing Rule-Based Eligibility Engine:');
  const rameshwarPGDM = await programmeService.evaluateEligibility('prog-pgdm-2026', 'usr-trainee-1');
  console.log('   Rameshwar Patil eligibility for PGDM:', {
    status: rameshwarPGDM.status,
    eligible: rameshwarPGDM.eligible,
    criteriaMet: rameshwarPGDM.criteria.filter(c => c.passed).length,
    missingDocs: rameshwarPGDM.missingDocuments,
  });
  if (!rameshwarPGDM.eligible) throw new Error('Rameshwar should be eligible for PGDM');
  console.log('   ✅ Eligibility verification engine verified.\n');

  // Test 4: Reusable Document Vault & Profile Readiness
  console.log('4️⃣  Testing Document Vault & Profile Readiness:');
  const vaultDocs = await documentVaultService.getUserDocuments('usr-trainee-1');
  console.log(`   Rameshwar has ${vaultDocs.length} reusable documents in vault:`, vaultDocs.map(d => d.documentType).join(', '));
  const readiness = await documentVaultService.getProfileReadiness('usr-trainee-1');
  console.log(`   Profile Readiness Score: ${readiness.readinessScore}%, Level: ${readiness.readinessLevel}, Checklist: ${readiness.checklist.length} items`);
  if (readiness.readinessScore < 70) throw new Error('Readiness score should be >= 70%');
  console.log('   ✅ Document vault and profile readiness verified.\n');

  // Test 5: Timetable Conflict Detection Engine
  console.log('5️⃣  Testing Timetable Scheduling Conflict Engine:');
  // There is an existing session in 'Lecture Hall 1 (Ground Floor)' at '09:30 AM – 11:00 AM' on '2026-09-21'
  const conflictCheck = await instituteService.checkSessionConflict({
    instituteId: 'inst-vamnicom',
    date: '2026-09-21',
    timeSlot: '09:30 AM – 11:00 AM',
    room: 'Lecture Hall 1 (Ground Floor)',
    instructor: 'Any Other Faculty',
  });
  console.log('   Collision check result for occupied Lecture Hall 1:', conflictCheck);
  if (!conflictCheck.hasConflict) throw new Error('Conflict detection failed to catch occupied room collision!');
  console.log('   Collision correctly caught:', conflictCheck.message);

  // Non-conflicting test
  const noConflictCheck = await instituteService.checkSessionConflict({
    instituteId: 'inst-vamnicom',
    date: '2026-09-21',
    timeSlot: '03:30 PM – 05:00 PM',
    room: 'Executive Boardroom',
    instructor: 'Dr. Rajesh Deshmukh',
  });
  console.log('   Zero-conflict slot check result:', noConflictCheck);
  if (noConflictCheck.hasConflict) throw new Error('False positive conflict detected!');
  console.log('   ✅ Timetable collision engine verified with 100% accuracy.\n');

  // Test 6: Trainee Timetable Auto-Generation from Batch Enrollment
  console.log('6️⃣  Testing Auto-Derived Trainee Timetable:');
  const traineeTimetable = await programmeService.getTraineeTimetable('usr-trainee-1');
  console.log(`   Trainee has ${traineeTimetable.totalSessions} scheduled sessions across batches:`);
  Object.entries(traineeTimetable.scheduleByDay).forEach(([day, sessList]: any) => {
    if (sessList.length > 0) {
      console.log(`     - ${day}: ${sessList.length} session(s) (${sessList.map((s: any) => s.timeSlot + ' ' + s.title).join('; ')})`);
    }
  });
  if (traineeTimetable.totalSessions === 0) throw new Error('Trainee timetable should not be empty');
  console.log('   ✅ Auto-derived Trainee Timetable verified.\n');

  console.log('🎉 ALL 6 VERIFICATION TEST SUITES PASSED SUCCESSFULLY!');
}

runVerification()
  .catch(e => {
    console.error('❌ Verification failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
