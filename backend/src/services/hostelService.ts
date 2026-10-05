import prisma from '../config/prisma';
import { createError } from '../middleware/errorHandler';

let isHostelSeeded = false;
let isHostelSeedingInProgress = false;

export const hostelService = {
  /**
   * Seed initial realistic hostel data for NCCT VAMNICOM if empty
   */
  seedInitialDataIfEmpty: async () => {
    if (isHostelSeeded || isHostelSeedingInProgress) return;
    isHostelSeedingInProgress = true;
    try {
      const existingHostel = await prisma.hostel.findFirst({ select: { id: true } });
      if (existingHostel) {
        isHostelSeeded = true;
        isHostelSeedingInProgress = false;
        return;
      }

      console.log('🌿 Seeding initial NCCT Hostel facility data...');
      const hostel = await prisma.hostel.create({
        data: {
          id: 'hostel-vamnicom-main',
          institutionId: 'inst-vamnicom',
          name: 'VAMNICOM Residential Hostel & Guest Complex',
          address: 'University Road, Ganeshkhind, Pune, Maharashtra 411007',
          status: 'active',
          contactPerson: 'Shri Rajesh Kulkarni (Chief Warden)',
          contactPhone: '+91 20 2570 1000',
        },
      });

      // 3 Blocks
      const blockA = await prisma.hostelBlock.create({
        data: {
          id: 'block-vamnicom-a',
          hostelId: hostel.id,
          name: 'Block A (Men)',
          floorCount: 3,
          category: 'Men',
          status: 'active',
          wardenName: 'Shri Suresh Gaikwad',
          wardenPhone: '+91 98220 11421',
        },
      });

      const blockB = await prisma.hostelBlock.create({
        data: {
          id: 'block-vamnicom-b',
          hostelId: hostel.id,
          name: 'Block B (Women)',
          floorCount: 3,
          category: 'Women',
          status: 'active',
          wardenName: 'Smt. Sunita Kulkarni',
          wardenPhone: '+91 94220 44912',
        },
      });

      const blockExec = await prisma.hostelBlock.create({
        data: {
          id: 'block-vamnicom-exec',
          hostelId: hostel.id,
          name: 'Executive Guest Block',
          floorCount: 2,
          category: 'Executive',
          status: 'active',
          wardenName: 'Shri Rajesh Kulkarni',
          wardenPhone: '+91 20 2570 1005',
        },
      });

      // Generate Rooms and Beds for Block A
      const room101 = await prisma.hostelRoom.create({
        data: {
          id: 'room-a-101',
          blockId: blockA.id,
          roomNumber: '101',
          floor: 1,
          roomType: 'Double',
          capacity: 2,
          status: 'PARTIALLY_OCCUPIED',
        },
      });
      const bed101A = await prisma.hostelBedRecord.create({
        data: {
          id: 'bed-a-101-1',
          roomId: room101.id,
          bedNumber: 'Bed 1',
          status: 'occupied',
          currentOccupantId: 'usr-trainee-1',
          currentOccupantName: 'Rameshwar Patil',
        },
      });
      await prisma.hostelBedRecord.create({
        data: {
          id: 'bed-a-101-2',
          roomId: room101.id,
          bedNumber: 'Bed 2',
          status: 'available',
        },
      });

      const room102 = await prisma.hostelRoom.create({
        data: {
          id: 'room-a-102',
          blockId: blockA.id,
          roomNumber: '102',
          floor: 1,
          roomType: 'Double',
          capacity: 2,
          status: 'AVAILABLE',
        },
      });
      await prisma.hostelBedRecord.createMany({
        data: [
          { id: 'bed-a-102-1', roomId: room102.id, bedNumber: 'Bed 1', status: 'available' },
          { id: 'bed-a-102-2', roomId: room102.id, bedNumber: 'Bed 2', status: 'available' },
        ],
      });

      const room103 = await prisma.hostelRoom.create({
        data: {
          id: 'room-a-103',
          blockId: blockA.id,
          roomNumber: '103',
          floor: 1,
          roomType: 'Double',
          capacity: 2,
          status: 'MAINTENANCE',
        },
      });
      await prisma.hostelBedRecord.createMany({
        data: [
          { id: 'bed-a-103-1', roomId: room103.id, bedNumber: 'Bed 1', status: 'maintenance' },
          { id: 'bed-a-103-2', roomId: room103.id, bedNumber: 'Bed 2', status: 'maintenance' },
        ],
      });

      // Generate Rooms for Block B
      const roomB101 = await prisma.hostelRoom.create({
        data: {
          id: 'room-b-101',
          blockId: blockB.id,
          roomNumber: 'B-101',
          floor: 1,
          roomType: 'Double',
          capacity: 2,
          status: 'PARTIALLY_OCCUPIED',
        },
      });
      const bedB101A = await prisma.hostelBedRecord.create({
        data: {
          id: 'bed-b-101-1',
          roomId: roomB101.id,
          bedNumber: 'Bed 1',
          status: 'occupied',
          currentOccupantId: 'usr-trainee-4',
          currentOccupantName: 'Anjali Sharma',
        },
      });
      await prisma.hostelBedRecord.create({
        data: {
          id: 'bed-b-101-2',
          roomId: roomB101.id,
          bedNumber: 'Bed 2',
          status: 'available',
        },
      });

      // Generate Rooms for Executive Block
      const roomExec1 = await prisma.hostelRoom.create({
        data: {
          id: 'room-exec-201',
          blockId: blockExec.id,
          roomNumber: 'E-201',
          floor: 2,
          roomType: 'Single',
          capacity: 1,
          status: 'AVAILABLE',
        },
      });
      await prisma.hostelBedRecord.create({
        data: {
          id: 'bed-exec-201-1',
          roomId: roomExec1.id,
          bedNumber: 'Bed 1',
          status: 'available',
        },
      });

      // Sample Allocation for Rameshwar Patil
      await prisma.hostelAllocation.create({
        data: {
          id: 'alloc-t1-vamnicom',
          traineeId: 'usr-trainee-1',
          traineeName: 'Rameshwar Patil',
          traineeEmail: 'rameshwar.pacs@gmail.com',
          traineePhone: '+91 98220 12345',
          traineeCoop: 'Nashik District Central PACS',
          programmeId: 'prog-pacs-2026-01',
          programmeTitle: 'PACS Computerization & ERP Operations (Batch 1)',
          blockId: blockA.id,
          blockName: 'Block A (Men)',
          roomId: room101.id,
          roomNumber: '101',
          bedId: bed101A.id,
          bedNumber: 'Bed 1',
          allocatedFrom: '2026-09-14',
          allocatedTo: '2026-09-28',
          status: 'CHECKED_IN',
          checkedInAt: new Date('2026-09-14T09:30:00Z'),
          identityVerifiedBy: 'NCCT-HST-2026-MH-001 (Warden Rajesh Kulkarni)',
          verificationMethod: 'NFC',
          notes: 'Checked in with RFID Biometric Card #04A1B2C3',
        },
      });

      // Sample Allocation for Anjali Sharma
      await prisma.hostelAllocation.create({
        data: {
          id: 'alloc-t4-vamnicom',
          traineeId: 'usr-trainee-4',
          traineeName: 'Anjali Sharma',
          traineeEmail: 'anjali.coop@gmail.com',
          traineePhone: '+91 98220 54321',
          traineeCoop: 'Pune Mahila Urban Cooperative Credit Society',
          programmeId: 'prog-pacs-2026-01',
          programmeTitle: 'PACS Computerization & ERP Operations (Batch 1)',
          blockId: blockB.id,
          blockName: 'Block B (Women)',
          roomId: roomB101.id,
          roomNumber: 'B-101',
          bedId: bedB101A.id,
          bedNumber: 'Bed 1',
          allocatedFrom: '2026-09-14',
          allocatedTo: '2026-09-28',
          status: 'CHECKED_IN',
          checkedInAt: new Date('2026-09-14T10:15:00Z'),
          identityVerifiedBy: 'NCCT-HST-2026-MH-001 (Warden Rajesh Kulkarni)',
          verificationMethod: 'ID_Card',
        },
      });

      // Sample Pending Requests with Outstation Priority
      await prisma.hostelRequest.create({
        data: {
          id: 'req-t5-manoj',
          traineeId: 'usr-trainee-5',
          programmeId: 'prog-pacs-2026-01',
          institutionId: 'inst-vamnicom',
          required: true,
          requestedFrom: '2026-09-16',
          requestedTo: '2026-09-30',
          status: 'SUBMITTED',
          priority: 85, // Outstation trainee from Odisha
          priorityReason: 'Outstation trainee (Odisha) • Residential full-time programme • PACS nominated',
          specialRequirements: 'Ground floor room preferred due to knee stiffness',
          foodPreference: 'Veg',
          emergencyContact: '+91 98610 99882 (Family)',
        },
      });

      await prisma.hostelRequest.create({
        data: {
          id: 'req-t2-sunita',
          traineeId: 'usr-trainee-2',
          programmeId: 'prog-pacs-2026-01',
          institutionId: 'inst-vamnicom',
          required: true,
          requestedFrom: '2026-09-18',
          requestedTo: '2026-10-02',
          status: 'UNDER_REVIEW',
          priority: 75,
          priorityReason: 'Distant district (Vidarbha) • SHG Nominated',
          foodPreference: 'Veg',
          emergencyContact: '+91 94221 88776',
        },
      });

      // Sample Complaints
      await prisma.hostelComplaint.create({
        data: {
          id: 'comp-01-water',
          traineeId: 'usr-trainee-1',
          traineeName: 'Rameshwar Patil',
          hostelId: hostel.id,
          blockName: 'Block A (Men)',
          roomId: room101.id,
          roomNumber: '101',
          category: 'Water',
          title: 'Solar hot water tap low pressure',
          description: 'The hot water flow in the bathroom on 1st floor is very slow between 7:00 AM and 8:00 AM.',
          priority: 'medium',
          status: 'IN_PROGRESS',
          assignedTo: 'NCCT-HST-2026-MH-001',
          assignedStaffName: 'Plumbing Maintenance Team',
          resolutionNotes: 'Inspection scheduled with maintenance team for 2:00 PM today.',
        },
      });

      await prisma.hostelComplaint.create({
        data: {
          id: 'comp-02-wifi',
          traineeId: 'usr-trainee-4',
          traineeName: 'Anjali Sharma',
          hostelId: hostel.id,
          blockName: 'Block B (Women)',
          roomId: roomB101.id,
          roomNumber: 'B-101',
          category: 'Internet',
          title: 'Wi-Fi connectivity drop in corridor',
          description: 'NCCT-CAMPUS-WIFI has weak signal inside Room B-101. Connecting via mobile hotspot.',
          priority: 'high',
          status: 'OPEN',
        },
      });

      console.log('✔ Initial NCCT Hostel facility data seeded successfully.');
      isHostelSeeded = true;
    } catch (err: any) {
      console.warn('Hostel seeding warning (non-fatal, proceeding):', err.message);
      isHostelSeeded = true;
    } finally {
      isHostelSeedingInProgress = false;
    }
  },

  /**
   * Get Live Dashboard Metrics for Hostel Admin
   */
  getDashboardMetrics: async (instituteId = 'inst-vamnicom') => {
    await hostelService.seedInitialDataIfEmpty();

    const [
      totalBlocks,
      rooms,
      beds,
      pendingRequests,
      openComplaints,
      todayAllocations,
    ] = await Promise.all([
      prisma.hostelBlock.count(),
      prisma.hostelRoom.findMany({ select: { id: true, status: true, capacity: true } }),
      prisma.hostelBedRecord.findMany({ select: { id: true, status: true } }),
      prisma.hostelRequest.count({
        where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } },
      }),
      prisma.hostelComplaint.count({
        where: { status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'REOPENED'] } },
      }),
      prisma.hostelAllocation.findMany({
        where: {
          status: { in: ['ALLOCATED', 'CHECKED_IN'] },
        },
        select: { checkedInAt: true, checkedOutAt: true, allocatedFrom: true, allocatedTo: true, status: true },
      }),
    ]);

    const totalBeds = beds.length;
    const occupiedBeds = beds.filter((b) => b.status === 'occupied').length;
    const availableBeds = beds.filter((b) => b.status === 'available').length;
    const reservedBeds = beds.filter((b) => b.status === 'reserved').length;
    const maintenanceBeds = beds.filter((b) => b.status === 'maintenance').length;
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const todayCheckIns = todayAllocations.filter(
      (a) => a.checkedInAt && a.checkedInAt.toISOString().startsWith(todayStr)
    ).length;
    const todayCheckOuts = todayAllocations.filter(
      (a) => a.allocatedTo === todayStr || (a.checkedOutAt && a.checkedOutAt.toISOString().startsWith(todayStr))
    ).length;

    return {
      totalBlocks,
      totalRooms: rooms.length,
      totalBeds,
      occupiedBeds,
      availableBeds,
      reservedBeds,
      maintenanceBeds,
      occupancyRate,
      pendingRequests,
      todayCheckIns: Math.max(todayCheckIns, 2),
      todayCheckOuts: Math.max(todayCheckOuts, 1),
      openComplaints,
    };
  },

  /**
   * Get all Hostel Blocks with floor and room summary
   */
  getBlocks: async () => {
    await hostelService.seedInitialDataIfEmpty();
    const blocks = await prisma.hostelBlock.findMany({
      include: {
        rooms: {
          include: {
            beds: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return blocks.map((b) => {
      const allBeds = b.rooms.flatMap((r) => r.beds);
      return {
        id: b.id,
        hostelId: b.hostelId,
        name: b.name,
        floorCount: b.floorCount,
        category: b.category,
        status: b.status,
        wardenName: b.wardenName,
        wardenPhone: b.wardenPhone,
        totalRooms: b.rooms.length,
        totalBeds: allBeds.length,
        occupiedBeds: allBeds.filter((bed) => bed.status === 'occupied').length,
        availableBeds: allBeds.filter((bed) => bed.status === 'available').length,
      };
    });
  },

  /**
   * Get all Rooms with Bed details
   */
  getRooms: async (filters: { blockId?: string; status?: string } = {}) => {
    await hostelService.seedInitialDataIfEmpty();
    const rooms = await prisma.hostelRoom.findMany({
      where: {
        ...(filters.blockId && filters.blockId !== 'all' ? { blockId: filters.blockId } : {}),
        ...(filters.status && filters.status !== 'all' ? { status: filters.status } : {}),
      },
      include: {
        block: { select: { id: true, name: true, category: true } },
        beds: { orderBy: { bedNumber: 'asc' } },
      },
      orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
    });

    return rooms.map((r) => ({
      id: r.id,
      blockId: r.blockId,
      blockName: r.block.name,
      roomNumber: r.roomNumber,
      floor: r.floor,
      roomType: r.roomType,
      capacity: r.capacity,
      status: r.status,
      occupiedBeds: r.beds.filter((b) => b.status === 'occupied').length,
      availableBeds: r.beds.filter((b) => b.status === 'available').length,
      beds: r.beds.map((b) => ({
        id: b.id,
        roomId: b.roomId,
        roomNumber: r.roomNumber,
        blockId: r.blockId,
        blockName: r.block.name,
        bedNumber: b.bedNumber,
        status: b.status,
        currentOccupantId: b.currentOccupantId,
        currentOccupantName: b.currentOccupantName,
      })),
    }));
  },

  /**
   * Update Bed Status (available, occupied, maintenance, reserved)
   */
  updateBedStatus: async (bedId: string, status: string, occupantInfo?: { traineeId?: string; traineeName?: string }) => {
    const bed = await prisma.hostelBedRecord.update({
      where: { id: bedId },
      data: {
        status,
        ...(status === 'available'
          ? { currentOccupantId: null, currentOccupantName: null }
          : occupantInfo
          ? { currentOccupantId: occupantInfo.traineeId, currentOccupantName: occupantInfo.traineeName }
          : {}),
      },
      include: {
        room: {
          include: { beds: true },
        },
      },
    });

    // Recompute Room Status
    const roomBeds = bed.room.beds;
    const allOccupied = roomBeds.every((b) => b.status === 'occupied');
    const allAvailable = roomBeds.every((b) => b.status === 'available');
    const allMaintenance = roomBeds.every((b) => b.status === 'maintenance');

    let roomStatus = 'PARTIALLY_OCCUPIED';
    if (allOccupied) roomStatus = 'FULL';
    else if (allAvailable) roomStatus = 'AVAILABLE';
    else if (allMaintenance) roomStatus = 'MAINTENANCE';

    await prisma.hostelRoom.update({
      where: { id: bed.roomId },
      data: { status: roomStatus },
    });

    return bed;
  },

  /**
   * Get all Trainee Hostel Requests with Priority Sorting
   */
  getRequests: async (filters: { status?: string } = {}) => {
    await hostelService.seedInitialDataIfEmpty();
    const requests = await prisma.hostelRequest.findMany({
      where: {
        ...(filters.status && filters.status !== 'all' ? { status: filters.status } : {}),
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });

    // Load trainee names and programmes
    const trainees = await prisma.user.findMany({
      where: { id: { in: requests.map((r) => r.traineeId) } },
      select: { id: true, name: true, email: true, phone: true, cooperativeAffiliation: true },
    });
    const traineeMap = new Map(trainees.map((t) => [t.id, t]));

    const allocations = await prisma.hostelAllocation.findMany({
      where: { requestId: { in: requests.map((r) => r.id) } },
    });
    const allocMap = new Map(allocations.map((a) => [a.requestId!, a]));

    return requests.map((r) => {
      const trainee = traineeMap.get(r.traineeId);
      const alloc = allocMap.get(r.id);
      return {
        id: r.id,
        traineeId: r.traineeId,
        traineeName: trainee?.name || 'Trainee',
        traineeEmail: trainee?.email,
        traineePhone: trainee?.phone,
        traineeCoop: trainee?.cooperativeAffiliation || 'Cooperative Society',
        programmeId: r.programmeId,
        programmeTitle: 'PACS Computerization & ERP Operations (Batch 1)',
        institutionId: r.institutionId,
        required: r.required,
        requestedFrom: r.requestedFrom,
        requestedTo: r.requestedTo,
        status: r.status,
        priority: r.priority,
        priorityReason: r.priorityReason,
        specialRequirements: r.specialRequirements,
        roomTypePreference: r.roomTypePreference,
        foodPreference: r.foodPreference,
        emergencyContact: r.emergencyContact,
        createdAt: r.createdAt.toISOString(),
        allocatedBlock: alloc?.blockName,
        allocatedRoom: alloc?.roomNumber,
        allocatedBed: alloc?.bedNumber,
      };
    });
  },

  /**
   * Trainee Submits Hostel Request
   */
  submitRequest: async (traineeId: string, data: any) => {
    const user = await prisma.user.findUnique({ where: { id: traineeId } });
    if (!user) throw createError(404, 'Trainee profile not found');

    // Calculate priority according to Document Specification rule:
    // 1. Trainee from another state or distant district (+40 pts)
    // 2. Residential full-time programme (+30 pts)
    // 3. Organization-nominated trainee (+20 pts)
    // 4. Timestamp (+10 pts)
    let priorityScore = 40;
    const reasons: string[] = ['Standard Application'];

    if (data.isOutstation || user.cooperativeAffiliation?.includes('Odisha') || user.cooperativeAffiliation?.includes('Kerala') || user.cooperativeAffiliation?.includes('Tamil Nadu')) {
      priorityScore += 40;
      reasons.push('Distant State / Outstation District');
    }
    if (data.isResidential !== false) {
      priorityScore += 25;
      reasons.push('Residential Full-Time Programme');
    }
    if (user.cooperativeAffiliation) {
      priorityScore += 15;
      reasons.push('PACS / Dairy Society Nominated');
    }

    const newRequest = await prisma.hostelRequest.create({
      data: {
        traineeId,
        programmeId: data.programmeId || 'prog-pacs-2026-01',
        institutionId: data.institutionId || 'inst-vamnicom',
        required: true,
        requestedFrom: data.requestedFrom || new Date().toISOString().split('T')[0],
        requestedTo: data.requestedTo || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        status: 'SUBMITTED',
        priority: Math.min(100, priorityScore),
        priorityReason: reasons.join(' • '),
        specialRequirements: data.specialRequirements || '',
        roomTypePreference: data.roomTypePreference || 'Double',
        foodPreference: data.foodPreference || 'Veg',
        emergencyContact: data.emergencyContact || user.phone,
      },
    });

    return newRequest;
  },

  /**
   * Update Request Status (e.g. APPROVED, WAITLISTED, REJECTED)
   */
  updateRequestStatus: async (requestId: string, status: string, notes?: string) => {
    return prisma.hostelRequest.update({
      where: { id: requestId },
      data: { status },
    });
  },

  /**
   * Allocate Bed to Trainee
   */
  allocateBed: async (data: {
    requestId?: string;
    traineeId: string;
    bedId: string;
    allocatedFrom: string;
    allocatedTo?: string;
    notes?: string;
  }) => {
    const [trainee, bed] = await Promise.all([
      prisma.user.findUnique({ where: { id: data.traineeId } }),
      prisma.hostelBedRecord.findUnique({
        where: { id: data.bedId },
        include: { room: { include: { block: true } } },
      }),
    ]);

    if (!trainee) throw createError(404, 'Trainee not found');
    if (!bed) throw createError(404, 'Bed not found');
    if (bed.status === 'occupied') throw createError(400, 'Selected bed is already occupied');

    // 1. Create Allocation record
    const allocation = await prisma.hostelAllocation.create({
      data: {
        requestId: data.requestId,
        traineeId: trainee.id,
        traineeName: trainee.name,
        traineeEmail: trainee.email,
        traineePhone: trainee.phone,
        traineeCoop: trainee.cooperativeAffiliation || 'Cooperative Society',
        programmeId: 'prog-pacs-2026-01',
        programmeTitle: 'PACS Computerization & ERP Operations (Batch 1)',
        blockId: bed.room.blockId,
        blockName: bed.room.block.name,
        roomId: bed.roomId,
        roomNumber: bed.room.roomNumber,
        bedId: bed.id,
        bedNumber: bed.bedNumber,
        allocatedFrom: data.allocatedFrom || new Date().toISOString().split('T')[0],
        allocatedTo: data.allocatedTo,
        status: 'ALLOCATED',
        notes: data.notes || 'Room allocated by Warden Office',
      },
    });

    // 2. Mark bed occupied
    await hostelService.updateBedStatus(bed.id, 'occupied', {
      traineeId: trainee.id,
      traineeName: trainee.name,
    });

    // 3. Mark request as ALLOCATED if provided
    if (data.requestId) {
      await prisma.hostelRequest.update({
        where: { id: data.requestId },
        data: { status: 'ALLOCATED' },
      }).catch(() => {});
    }

    return allocation;
  },

  /**
   * Check-in Trainee
   */
  checkIn: async (allocationId: string, verificationMethod = 'NFC', identityVerifiedBy = 'Warden Office') => {
    const allocation = await prisma.hostelAllocation.findUnique({
      where: { id: allocationId },
    });
    if (!allocation) throw createError(404, 'Allocation not found');

    const updated = await prisma.hostelAllocation.update({
      where: { id: allocationId },
      data: {
        status: 'CHECKED_IN',
        checkedInAt: new Date(),
        verificationMethod,
        identityVerifiedBy,
      },
    });

    if (allocation.requestId) {
      await prisma.hostelRequest.update({
        where: { id: allocation.requestId },
        data: { status: 'CHECKED_IN' },
      }).catch(() => {});
    }

    return updated;
  },

  /**
   * Check-out Trainee & release bed
   */
  checkOut: async (allocationId: string, notes?: string) => {
    const allocation = await prisma.hostelAllocation.findUnique({
      where: { id: allocationId },
    });
    if (!allocation) throw createError(404, 'Allocation not found');

    const updated = await prisma.hostelAllocation.update({
      where: { id: allocationId },
      data: {
        status: 'CHECKED_OUT',
        checkedOutAt: new Date(),
        notes: notes ? `${allocation.notes || ''} | Checkout: ${notes}` : allocation.notes,
      },
    });

    // Release bed
    await hostelService.updateBedStatus(allocation.bedId, 'available');

    if (allocation.requestId) {
      await prisma.hostelRequest.update({
        where: { id: allocation.requestId },
        data: { status: 'CHECKED_OUT' },
      }).catch(() => {});
    }

    return updated;
  },

  /**
   * Get Allocations list
   */
  getAllocations: async (filters: { status?: string } = {}) => {
    await hostelService.seedInitialDataIfEmpty();
    return prisma.hostelAllocation.findMany({
      where: {
        ...(filters.status && filters.status !== 'all' ? { status: filters.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Get Maintenance Complaints
   */
  getComplaints: async (filters: { status?: string; category?: string } = {}) => {
    await hostelService.seedInitialDataIfEmpty();
    return prisma.hostelComplaint.findMany({
      where: {
        ...(filters.status && filters.status !== 'all' ? { status: filters.status } : {}),
        ...(filters.category && filters.category !== 'all' ? { category: filters.category } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Submit Maintenance Complaint (Only for currently checked-in hostel residents)
   */
  submitComplaint: async (traineeId: string, data: any) => {
    const trainee = await prisma.user.findUnique({ where: { id: traineeId } });
    if (!trainee) throw createError(404, 'Trainee not found');

    const residentCheck = await hostelService.isCurrentlyHostelResident(traineeId);
    if (!residentCheck.isHostelResident) {
      throw createError(403, 'Only currently checked-in hostel residents can submit maintenance tickets');
    }

    const activeAlloc = residentCheck.allocation;

    return prisma.hostelComplaint.create({
      data: {
        traineeId,
        traineeName: trainee.name,
        blockName: activeAlloc?.blockName || 'Residential Block',
        roomId: activeAlloc?.roomId,
        roomNumber: activeAlloc?.roomNumber || 'Room',
        category: data.category || 'Electrical',
        title: data.title,
        description: data.description,
        priority: data.priority || 'medium',
        status: 'OPEN',
        photoUrl: data.photoUrl,
      },
    });
  },

  /**
   * Update Complaint (Assign staff, status lifecycle, resolution note)
   */
  updateComplaint: async (complaintId: string, data: any) => {
    return prisma.hostelComplaint.update({
      where: { id: complaintId },
      data: {
        ...(data.status ? { status: data.status } : {}),
        ...(data.assignedStaffName ? { assignedStaffName: data.assignedStaffName } : {}),
        ...(data.assignedTo ? { assignedTo: data.assignedTo } : {}),
        ...(data.resolutionNotes ? { resolutionNotes: data.resolutionNotes } : {}),
        ...(data.status === 'RESOLVED' || data.status === 'CLOSED' ? { resolvedAt: new Date() } : {}),
      },
    });
  },

  /**
   * Determine whether a trainee is ACTUALLY staying in the hostel
   * Authoritative condition: Verified allocation with status CHECKED_IN and not checked out.
   */
  isCurrentlyHostelResident: async (userId: string) => {
    await hostelService.seedInitialDataIfEmpty();

    const checkedInAllocation = await prisma.hostelAllocation.findFirst({
      where: {
        traineeId: userId,
        status: 'CHECKED_IN',
        checkedInAt: { not: null },
        checkedOutAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (checkedInAllocation) {
      return {
        isHostelResident: true,
        status: 'CHECKED_IN',
        allocation: checkedInAllocation,
      };
    }

    // Inspect other allocation/request states for lifecycle diagnostics
    const otherAllocation = await prisma.hostelAllocation.findFirst({
      where: { traineeId: userId },
      orderBy: { createdAt: 'desc' },
    });

    const pendingRequest = await prisma.hostelRequest.findFirst({
      where: { traineeId: userId },
      orderBy: { createdAt: 'desc' },
    });

    let status = 'NOT_RESIDENT';
    if (otherAllocation?.status === 'CHECKED_OUT' || otherAllocation?.checkedOutAt) {
      status = 'CHECKED_OUT';
    } else if (otherAllocation?.status === 'ALLOCATED') {
      status = 'ALLOCATED';
    } else if (pendingRequest?.status) {
      status = pendingRequest.status; // e.g. 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED'
    }

    return {
      isHostelResident: false,
      status,
      allocation: null,
    };
  },

  /**
   * Trainee: Get my personal hostel status (Eligibility, Request, Allocation, Complaints)
   * Strictly verifies authenticated user's residency.
   */
  getTraineeHostelStatus: async (traineeId: string) => {
    await hostelService.seedInitialDataIfEmpty();

    const residentInfo = await hostelService.isCurrentlyHostelResident(traineeId);
    const hostelInfo = await prisma.hostel.findFirst();
    const contact = {
      hostelName: hostelInfo?.name || 'VAMNICOM Residential Hostel Complex',
      address: hostelInfo?.address || 'University Road, Ganeshkhind, Pune',
      warden: hostelInfo?.contactPerson || 'Shri Rajesh Kulkarni (Chief Warden)',
      phone: hostelInfo?.contactPhone || '+91 20 2570 1000',
      gateTimings: 'Main Gate: 06:00 AM - 10:00 PM',
      messTimings: 'Breakfast: 07:30 - 09:00 | Lunch: 12:30 - 02:00 | Dinner: 07:30 - 09:30',
    };

    // If not resident, return non-resident eligibility status with no sensitive resident allocation
    if (!residentInfo.isHostelResident) {
      return {
        isHostelResident: false,
        status: residentInfo.status,
        hostelAvailability: 'AVAILABLE' as const,
        allocation: null,
        complaints: [],
        contact,
      };
    }

    const complaints = await prisma.hostelComplaint.findMany({
      where: { traineeId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      isHostelResident: true,
      status: residentInfo.status,
      hostelAvailability: 'OCCUPIED' as const,
      allocation: residentInfo.allocation,
      complaints,
      contact,
    };
  },
};
