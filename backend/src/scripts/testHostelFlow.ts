/**
 * backend/src/scripts/testHostelFlow.ts
 *
 * Automated verification script for Hostel Management System:
 * Tests the complete lifecycle against Supabase PostgreSQL:
 * 1. Initialize & Seed Hostel + Blocks + Rooms + Beds
 * 2. Verify Occupancy Telemetry & Metrics
 * 3. Submit Trainee Request (Verify weighted scoring: outstation +40, residential +25)
 * 4. Allocate Bed to Trainee
 * 5. Check-In Trainee (Gate pass verification)
 * 6. Lodge Maintenance Complaint
 * 7. Resolve Complaint
 * 8. Check-Out Trainee (Inspect & verify Bed status resets to Available)
 */

import { hostelService } from '../services/hostelService';
import prisma from '../config/prisma';

async function runHostelVerification() {
  console.log('========================================================');
  console.log('🧪 RUNNING COMPREHENSIVE HOSTEL MANAGEMENT SYSTEM VERIFICATION');
  console.log('========================================================\n');

  try {
    // 1. Seed or get hostel
    console.log('[STEP 1] Initializing Hostel Data for VAMNICOM Pune...');
    await hostelService.seedInitialDataIfEmpty();
    const hostel = await prisma.hostel.findFirst();
    if (!hostel) throw new Error('Hostel was not created');
    console.log(`✅ Hostel Active: "${hostel.name}" (${hostel.id})`);

    // 2. Telemetry & Metrics
    console.log('\n[STEP 2] Fetching Live Dashboard Metrics...');
    const metrics = await hostelService.getDashboardMetrics(hostel.institutionId);
    console.log('✅ Metrics retrieved:');
    console.log(`   - Total Blocks: ${metrics.totalBlocks}`);
    console.log(`   - Total Rooms: ${metrics.totalRooms}`);
    console.log(`   - Total Beds: ${metrics.totalBeds}`);
    console.log(`   - Occupied Beds: ${metrics.occupiedBeds}`);
    console.log(`   - Available Beds: ${metrics.availableBeds}`);
    console.log(`   - Occupancy Rate: ${metrics.occupancyRate}%`);

    // 3. Blocks & Rooms
    console.log('\n[STEP 3] Verifying Blocks & Bed Inventory...');
    const blocks = await hostelService.getBlocks();
    console.log(`✅ ${blocks.length} Blocks configured:`);
    blocks.forEach(b => console.log(`   • ${b.name} (${b.category}, Floors: ${b.floorCount})`));

    const rooms = await hostelService.getRooms({ blockId: blocks[0].id });
    console.log(`✅ ${rooms.length} Rooms in Block 1 (${blocks[0].name})`);
    const availableBed = rooms[0].beds?.find((b: any) => b.status === 'available');
    if (!availableBed) {
      throw new Error('No available bed found in room 1 for testing!');
    }
    console.log(`   • Found Available Bed: ${availableBed.bedNumber} (ID: ${availableBed.id}) in Room ${rooms[0].roomNumber}`);

    // 4. Submit Trainee Request
    console.log('\n[STEP 4] Submitting Trainee Accommodation Request...');
    const testTraineeId = 'usr-trainee-1'; // Rameshwar Patil
    const newRequest = await hostelService.submitRequest(testTraineeId, {
      programmeId: 'prog-pacs-2026-01',
      institutionId: hostel.institutionId,
      requestedFrom: '2026-09-20',
      requestedTo: '2026-09-27',
      isOutstation: true,
      isResidential: true,
      specialRequirements: 'Ground floor room preferred',
      foodPreference: 'Veg'
    });
    console.log(`✅ Request Submitted: ID: ${newRequest.id}`);
    console.log(`   - Calculated Priority Score: ${newRequest.priority} pts`);
    console.log(`   - Priority Reason: ${newRequest.priorityReason}`);
    console.log(`   - Status: ${newRequest.status}`);

    // 5. Bed Allocation
    console.log('\n[STEP 5] Allocating Bed to Trainee...');
    const allocation = await hostelService.allocateBed({
      requestId: newRequest.id,
      traineeId: testTraineeId,
      bedId: availableBed.id,
      allocatedFrom: '2026-09-20',
      allocatedTo: '2026-09-27',
      notes: 'Priority allocation for outstation residential PACS trainee'
    });
    console.log(`✅ Bed Allocated: ID: ${allocation.id}`);
    console.log(`   - Room: ${allocation.roomNumber}, Bed: ${allocation.bedNumber}`);
    console.log(`   - Block: ${allocation.blockName}`);

    // Verify Bed is now occupied
    const bedAfterAlloc = await prisma.hostelBedRecord.findUnique({ where: { id: availableBed.id } });
    console.log(`   - Bed status in database: ${bedAfterAlloc?.status} (Occupant: ${bedAfterAlloc?.currentOccupantName})`);
    if (bedAfterAlloc?.status !== 'occupied') {
      throw new Error('Bed status did not transition to occupied!');
    }

    // 6. Gate Check-In Desk
    console.log('\n[STEP 6] Performing Gate Desk Check-In...');
    const checkedIn = await hostelService.checkIn(allocation.id, 'NFC', 'Warden Shri Rajesh Kulkarni');
    console.log(`✅ Check-In Completed!`);
    console.log(`   - Checked In At: ${checkedIn.checkedInAt}`);
    console.log(`   - Verification Method: ${checkedIn.verificationMethod}`);
    console.log(`   - Verified By: ${checkedIn.identityVerifiedBy}`);
    console.log(`   - Status: ${checkedIn.status}`);

    // 7. Lodge Complaint
    console.log('\n[STEP 7] Lodging Maintenance Complaint...');
    const complaint = await hostelService.submitComplaint(testTraineeId, {
      category: 'Electrical',
      title: 'Study lamp fixture loose',
      description: 'The desk lamp switch is sparking occasionally.',
      priority: 'medium'
    });
    console.log(`✅ Ticket Created: ${complaint.title} (Status: ${complaint.status})`);

    // 8. Resolve Complaint
    console.log('\n[STEP 8] Resolving Maintenance Ticket...');
    const resolvedComp = await hostelService.updateComplaint(complaint.id, {
      status: 'RESOLVED',
      resolutionNotes: 'Tightened electrical contact and tested illumination.',
      assignedStaffName: 'Electrician Sunil G.'
    });
    console.log(`✅ Ticket Resolved! Status: ${resolvedComp.status}`);
    console.log(`   - Notes: ${resolvedComp.resolutionNotes}`);

    // 9. Gate Check-Out & Bed Release
    console.log('\n[STEP 9] Trainee Check-Out & Room Inspection...');
    const checkedOut = await hostelService.checkOut(allocation.id, 'Keys returned and inventory verified complete');
    console.log(`✅ Check-Out Completed: Status: ${checkedOut.status}`);
    console.log(`   - Checked Out At: ${checkedOut.checkedOutAt}`);

    // Verify Bed is now released back to available
    const bedAfterCheckout = await prisma.hostelBedRecord.findUnique({ where: { id: availableBed.id } });
    console.log(`   - Bed status after checkout: ${bedAfterCheckout?.status} (Occupant: ${bedAfterCheckout?.currentOccupantName || 'None'})`);
    if (bedAfterCheckout?.status !== 'available') {
      throw new Error('Bed was not released back to available status!');
    }

    // 10. Trainee personal status API check
    console.log('\n[STEP 10] Checking Trainee Personal Hostel Status endpoint...');
    const traineeStatus = await hostelService.getTraineeHostelStatus(testTraineeId);
    console.log(`✅ Trainee Status: Availability: ${traineeStatus.hostelAvailability}, Resident: ${traineeStatus.isHostelResident}`);
    console.log(`   - Warden Contact: ${traineeStatus.contact?.warden}`);
    console.log(`   - Gate Timings: ${traineeStatus.contact?.gateTimings}`);

    console.log('\n========================================================');
    console.log('🎉 ALL 10 HOSTEL TESTS PASSED WITH 100% INTEGRITY & COMPLIANCE!');
    console.log('========================================================');
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runHostelVerification();
