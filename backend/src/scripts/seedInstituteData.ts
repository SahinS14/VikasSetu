import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedInstituteDatabase() {
  console.log('Seeding Institute Admin database records in PostgreSQL/Supabase...');

  // Format today's date as YYYY-MM-DD
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // 1. Programmes
  const programmes = [
    {
      id: 'prog-pacs-2026-01',
      title: 'PACS Computerization & ERP Operations (Residential)',
      titleHi: 'पैक्स कम्प्यूटरीकरण एवं ई-आरपी संचालन (आवासीय)',
      titleMr: 'PACS संगणकीकरण व ई-आरपी कामकाज (निवासी)',
      instituteId: 'inst-vamnicom',
      startDate: '2026-03-01',
      endDate: '2026-03-28',
      mode: 'residential',
      capacity: 35,
      enrolledCount: 30,
      category: 'PACS Digitalization',
      description: 'Comprehensive 4-week on-campus training programme on the National PACS ERP software suite.',
      status: 'active',
    },
    {
      id: 'prog-dairy-2026-02',
      title: 'Dairy Cooperative AMCS & Cold Chain Management',
      titleHi: 'डेयरी सहकारी एएमसीएस एवं कोल्ड चेन प्रबंधन',
      titleMr: 'दुग्ध सहकारी AMCS आणि कोल्ड चेन व्यवस्थापन',
      instituteId: 'inst-vamnicom',
      startDate: '2026-03-15',
      endDate: '2026-04-10',
      mode: 'hybrid',
      capacity: 30,
      enrolledCount: 22,
      category: 'Dairy & Livestock',
      description: 'Hands-on training covering automatic milk collection stations, FAT/SNF automated analyzers.',
      status: 'upcoming',
    },
    {
      id: 'prog-shg-2026-03',
      title: 'SHG Federation Governance & Micro-Credit Accounting',
      titleHi: 'एसएचजी फेडरेशन सुशासन एवं सूक्ष्म-ऋण लेखांकन',
      titleMr: 'SHG फेडरेशन प्रशासन आणि सूक्ष्म-कर्ज लेखा',
      instituteId: 'inst-vamnicom',
      startDate: '2026-04-01',
      endDate: '2026-04-20',
      mode: 'residential',
      capacity: 30,
      enrolledCount: 15,
      category: 'SHG Governance',
      description: 'Leadership and statutory bookkeeping workshop for women cooperative federations.',
      status: 'upcoming',
    },
  ];

  for (const p of programmes) {
    await prisma.programme.upsert({
      where: { id: p.id },
      update: p,
      create: p,
    });
  }
  console.log(`✓ Upserted ${programmes.length} programmes`);

  // 2. Nominations
  const nominations = [
    {
      id: 'nom-001',
      programmeId: 'prog-pacs-2026-01',
      userId: 'usr-trainee-1',
      traineeName: 'Rameshwar Patil',
      traineeEmail: 'rameshwar.pacs@gmail.com',
      cooperativeName: 'Shri Datta PACS, Niphad, Nashik',
      status: 'approved',
      nominatedDate: '2026-02-15',
    },
    {
      id: 'nom-002',
      programmeId: 'prog-pacs-2026-01',
      userId: 'usr-trainee-3',
      traineeName: 'Ganesh Shinde',
      traineeEmail: 'ganesh.dairy@gmail.com',
      cooperativeName: 'Mahanand Dairy Cooperative Union',
      status: 'approved',
      nominatedDate: '2026-02-16',
    },
    {
      id: 'nom-003',
      programmeId: 'prog-pacs-2026-01',
      userId: 'usr-trainee-4',
      traineeName: 'Anjali Sharma',
      traineeEmail: 'anjali.coop@gmail.com',
      cooperativeName: 'Kisan Seva Sahakari Samiti, Alwar',
      status: 'pending',
      nominatedDate: '2026-03-02',
    },
    {
      id: 'nom-004',
      programmeId: 'prog-dairy-2026-02',
      userId: 'usr-trainee-5',
      traineeName: 'Manoj Kumar Nayak',
      traineeEmail: 'manoj.nayak@coop.in',
      cooperativeName: 'Puri District Cooperative Central Bank',
      status: 'pending',
      nominatedDate: '2026-03-03',
    },
    {
      id: 'nom-005',
      programmeId: 'prog-pacs-2026-01',
      userId: 'usr-trainee-6',
      traineeName: 'Kavita Jadhav',
      traineeEmail: 'kavita.j@shg-mah.org',
      cooperativeName: 'Baramati Agro Cooperative Society, Pune',
      status: 'pending',
      nominatedDate: '2026-03-04',
    },
    {
      id: 'nom-006',
      programmeId: 'prog-dairy-2026-02',
      userId: null,
      traineeName: 'Vikramaditya Solanki',
      traineeEmail: 'vikram.solanki@amul.coop',
      cooperativeName: 'Saras Dairy Cooperative Federation, Jaipur',
      status: 'pending',
      nominatedDate: '2026-03-04',
    },
    {
      id: 'nom-007',
      programmeId: 'prog-shg-2026-03',
      userId: null,
      traineeName: 'Pooja Mandhare',
      traineeEmail: 'pooja.shg@prerna.org',
      cooperativeName: 'Prerna Mahila SHG Federation, Barabanki',
      status: 'approved',
      nominatedDate: '2026-02-28',
    },
    {
      id: 'nom-008',
      programmeId: 'prog-shg-2026-03',
      userId: null,
      traineeName: 'Deepak Verma',
      traineeEmail: 'deepak.v@kisanseva.in',
      cooperativeName: 'Indore PACS Central Rural Bank',
      status: 'rejected',
      nominatedDate: '2026-02-20',
      rejectionReason: 'Applicant does not meet the minimum cooperative affiliation tenure.',
    },
    {
      id: 'nom-009',
      programmeId: 'prog-dairy-2026-02',
      userId: null,
      traineeName: 'Surekha Gaikwad',
      traineeEmail: 'surekha.dairy@warana.coop',
      cooperativeName: 'Warana Dairy Sangh, Kolhapur',
      status: 'pending',
      nominatedDate: '2026-03-05',
    },
    {
      id: 'nom-010',
      programmeId: 'prog-pacs-2026-01',
      userId: null,
      traineeName: 'Sanjay Deshpande',
      traineeEmail: 'sanjay.deshpande@khedpacs.org',
      cooperativeName: 'Khed Taluka Primary Agricultural Society',
      status: 'pending',
      nominatedDate: '2026-03-05',
    },
  ];

  for (const n of nominations) {
    await prisma.nomination.upsert({
      where: { id: n.id },
      update: n,
      create: n,
    });
  }
  console.log(`✓ Upserted ${nominations.length} nominations (6 pending)`);

  // 3. Hostel Beds
  const hostelBeds = [
    { id: 'bed-101-a', roomNumber: '101', bedNumber: 'Bed A', block: 'Block A (Men)', programmeId: 'prog-pacs-2026-01', instituteId: 'inst-vamnicom', traineeId: 'usr-trainee-1', traineeName: 'Rameshwar Patil', status: 'occupied' },
    { id: 'bed-101-b', roomNumber: '101', bedNumber: 'Bed B', block: 'Block A (Men)', programmeId: 'prog-pacs-2026-01', instituteId: 'inst-vamnicom', traineeId: 'usr-trainee-3', traineeName: 'Ganesh Shinde', status: 'occupied' },
    { id: 'bed-102-a', roomNumber: '102', bedNumber: 'Bed A', block: 'Block A (Men)', programmeId: 'prog-pacs-2026-01', instituteId: 'inst-vamnicom', status: 'vacant' },
    { id: 'bed-102-b', roomNumber: '102', bedNumber: 'Bed B', block: 'Block A (Men)', programmeId: 'prog-pacs-2026-01', instituteId: 'inst-vamnicom', status: 'vacant' },
    { id: 'bed-201-a', roomNumber: '201', bedNumber: 'Bed A', block: 'Block B (Women)', programmeId: 'prog-pacs-2026-01', instituteId: 'inst-vamnicom', traineeId: 'usr-trainee-2', traineeName: 'Sunita Devi', status: 'occupied' },
    { id: 'bed-201-b', roomNumber: '201', bedNumber: 'Bed B', block: 'Block B (Women)', programmeId: 'prog-pacs-2026-01', instituteId: 'inst-vamnicom', traineeId: 'usr-trainee-4', traineeName: 'Anjali Sharma', status: 'occupied' },
    { id: 'bed-202-a', roomNumber: '202', bedNumber: 'Bed A', block: 'Block B (Women)', programmeId: 'prog-pacs-2026-01', instituteId: 'inst-vamnicom', status: 'vacant' },
    { id: 'bed-301-a', roomNumber: '301', bedNumber: 'Suite 1', block: 'Executive Guest Block', programmeId: 'prog-pacs-2026-01', instituteId: 'inst-vamnicom', status: 'occupied', traineeName: 'Guest Keynote Speaker' },
  ];

  for (const b of hostelBeds) {
    await prisma.hostelBed.upsert({
      where: { id: b.id },
      update: b,
      create: b,
    });
  }
  console.log(`✓ Upserted ${hostelBeds.length} hostel beds (5 occupied / 8 total)`);

  // 4. Live Sessions (Ensure both today and generic dates exist)
  const sessions = [
    {
      id: 'sess-today-01',
      programmeId: 'prog-pacs-2026-01',
      title: 'Lab Session: Live Day-Open, Ledger Reconciliation & KCC Posting',
      instructor: 'Prof. Meenakshi Sundaram',
      date: todayStr,
      timeSlot: '10:00 AM – 01:00 PM',
      room: 'Smart Computer Lab 2 (VAMNICOM Academic Block)',
      qrToken: 'QR-VAMNICOM-TODAY-01',
      active: true,
      instituteId: 'inst-vamnicom',
    },
    {
      id: 'sess-today-02',
      programmeId: 'prog-pacs-2026-01',
      title: 'Common Service Centre (CSC) Service Delivery in Rural PACS',
      instructor: 'Shri Anand Tripathi',
      date: todayStr,
      timeSlot: '02:30 PM – 05:00 PM',
      room: 'Auditorium Hall B',
      qrToken: 'QR-VAMNICOM-TODAY-02',
      active: true,
      instituteId: 'inst-vamnicom',
    },
    {
      id: 'sess-vam-001',
      programmeId: 'prog-pacs-2026-01',
      title: 'Lab Session: Live Day-Open, Ledger Reconciliation & KCC Posting',
      instructor: 'Prof. Meenakshi Sundaram',
      date: '2026-09-07',
      timeSlot: '10:00 AM – 01:00 PM',
      room: 'Smart Computer Lab 2 (VAMNICOM Academic Block)',
      qrToken: 'QR-VAMNICOM-SESS-2026-001',
      active: true,
      instituteId: 'inst-vamnicom',
    },
  ];

  for (const s of sessions) {
    await prisma.session.upsert({
      where: { id: s.id },
      update: s,
      create: s,
    });
  }
  console.log(`✓ Upserted ${sessions.length} sessions (2 for today: ${todayStr})`);

  // 5. Attendance Records for sess-today-01
  const attendanceRecords = [
    {
      id: 'att-td-001',
      sessionId: 'sess-today-01',
      userId: 'usr-trainee-1',
      traineeName: 'Rameshwar Patil',
      traineeCoop: 'Shri Datta PACS, Niphad, Nashik',
      method: 'qr',
      timestamp: `${todayStr} 09:55:12`,
      confidenceScore: 99.4,
      deviceLocation: 'VAMNICOM Campus, Pune (Lat: 18.5314, Long: 73.8446)',
    },
    {
      id: 'att-td-002',
      sessionId: 'sess-today-01',
      userId: 'usr-trainee-3',
      traineeName: 'Ganesh Shinde',
      traineeCoop: 'Mahanand Dairy Union, Kolhapur',
      method: 'face',
      timestamp: `${todayStr} 09:58:30`,
      confidenceScore: 96.8,
      deviceLocation: 'Raspberry Pi Kiosk Node-01 (VAMNICOM Lab Entry)',
    },
  ];

  for (const a of attendanceRecords) {
    await prisma.attendanceRecord.upsert({
      where: { sessionId_userId: { sessionId: a.sessionId, userId: a.userId } },
      update: a,
      create: a,
    });
  }
  console.log(`✓ Upserted ${attendanceRecords.length} attendance records for sess-today-01 (2 Present)`);

  // 6. Timetable Entries
  const timetable = [
    { id: 'tt-1', programmeId: 'prog-pacs-2026-01', instituteId: 'inst-vamnicom', day: 'Monday', timeSlot: '09:30 AM - 11:00 AM', subject: 'National PACS Computerization Framework', facultyName: 'Dr. Rajesh Deshmukh', venue: 'Lecture Hall 1' },
    { id: 'tt-2', programmeId: 'prog-pacs-2026-01', instituteId: 'inst-vamnicom', day: 'Monday', timeSlot: '11:30 AM - 01:00 PM', subject: 'Hands-on ERP Day-Open & Cash Book Simulation', facultyName: 'Prof. Meenakshi Sundaram', venue: 'Smart Computer Lab 2' },
    { id: 'tt-3', programmeId: 'prog-pacs-2026-01', instituteId: 'inst-vamnicom', day: 'Monday', timeSlot: '02:30 PM - 04:30 PM', subject: 'KCC Loan Sanctioning & DLTC Scale of Finance', facultyName: 'Shri R. K. Sharma', venue: 'Smart Computer Lab 2' },
    { id: 'tt-4', programmeId: 'prog-pacs-2026-01', instituteId: 'inst-vamnicom', day: 'Tuesday', timeSlot: '09:30 AM - 11:30 AM', subject: 'Fertilizer & Non-Credit Inventory POS Management', facultyName: 'Prof. Meenakshi Sundaram', venue: 'Lecture Hall 1' },
    { id: 'tt-5', programmeId: 'prog-pacs-2026-01', instituteId: 'inst-vamnicom', day: 'Tuesday', timeSlot: '02:00 PM - 05:00 PM', subject: 'Common Service Centre (CSC) Digital Services Live Demo', facultyName: 'Shri Anand Tripathi', venue: 'Auditorium Hall B' },
    { id: 'tt-6', programmeId: 'prog-pacs-2026-01', instituteId: 'inst-vamnicom', day: 'Wednesday', timeSlot: '09:30 AM - 11:30 AM', subject: 'Statutory Audit Trail & NABARD Compliance Reporting', facultyName: 'Dr. Rajesh Deshmukh', venue: 'Lecture Hall 1' },
    { id: 'tt-7', programmeId: 'prog-dairy-2026-02', instituteId: 'inst-vamnicom', day: 'Wednesday', timeSlot: '11:45 AM - 01:15 PM', subject: 'AMCS Automated Milk Testing & Sensor Calibration', facultyName: 'Prof. Meenakshi Sundaram', venue: 'Smart Computer Lab 2' },
    { id: 'tt-8', programmeId: 'prog-pacs-2026-01', instituteId: 'inst-vamnicom', day: 'Wednesday', timeSlot: '02:30 PM - 04:30 PM', subject: 'Double-Entry General Ledger Migration & Day-End Balancing', facultyName: 'Shri R. K. Sharma', venue: 'Smart Computer Lab 2' },
    { id: 'tt-9', programmeId: 'prog-pacs-2026-01', instituteId: 'inst-vamnicom', day: 'Thursday', timeSlot: '09:30 AM - 11:30 AM', subject: 'Multi-Service PACS Diversification: PMKSK & FPO Hubs', facultyName: 'Dr. Rajesh Deshmukh', venue: 'Auditorium Hall B' },
    { id: 'tt-10', programmeId: 'prog-dairy-2026-02', instituteId: 'inst-vamnicom', day: 'Thursday', timeSlot: '11:45 AM - 01:15 PM', subject: 'Cold Chain Logistics & Bulk Milk Cooler (BMC) Telemetry', facultyName: 'Shri Anand Tripathi', venue: 'Lecture Hall 2' },
    { id: 'tt-11', programmeId: 'prog-shg-2026-03', instituteId: 'inst-vamnicom', day: 'Thursday', timeSlot: '02:30 PM - 04:30 PM', subject: 'Panchasutra Micro-Credit Bookkeeping & Audit Readiness', facultyName: 'Prof. Meenakshi Sundaram', venue: 'Smart Computer Lab 2' },
    { id: 'tt-12', programmeId: 'prog-pacs-2026-01', instituteId: 'inst-vamnicom', day: 'Friday', timeSlot: '09:30 AM - 11:30 AM', subject: 'NABARD Rural Credit Portal Integration & Interest Subvention', facultyName: 'Shri R. K. Sharma', venue: 'Lecture Hall 1' },
    { id: 'tt-13', programmeId: 'prog-pacs-2026-01', instituteId: 'inst-vamnicom', day: 'Friday', timeSlot: '02:00 PM - 04:00 PM', subject: 'Hands-on Disaster Recovery & Cloud Data Backup Protocols', facultyName: 'Dr. Rajesh Deshmukh', venue: 'Smart Computer Lab 2' },
    { id: 'tt-14', programmeId: 'prog-dairy-2026-02', instituteId: 'inst-vamnicom', day: 'Friday', timeSlot: '04:15 PM - 05:45 PM', subject: 'Cooperative Governance: Bye-laws & AGM Legal Protocols', facultyName: 'Shri Anand Tripathi', venue: 'Auditorium Hall B' },
    { id: 'tt-15', programmeId: 'prog-pacs-2026-01', instituteId: 'inst-vamnicom', day: 'Saturday', timeSlot: '09:30 AM - 12:30 PM', subject: 'Capstone Simulation: Full PACS Month-End Closing & Trial Balance', facultyName: 'Prof. Meenakshi Sundaram', venue: 'Smart Computer Lab 2' },
    { id: 'tt-16', programmeId: 'prog-pacs-2026-01', instituteId: 'inst-vamnicom', day: 'Saturday', timeSlot: '02:00 PM - 04:30 PM', subject: 'Weekly Assessment, Viva Voce & Biometric Attendance Sign-off', facultyName: 'Dr. Rajesh Deshmukh', venue: 'Lecture Hall 1' },
  ];

  for (const t of timetable) {
    await prisma.timetableEntry.upsert({
      where: { id: t.id },
      update: t,
      create: t,
    });
  }
  console.log(`✓ Upserted ${timetable.length} timetable entries`);

  console.log('✅ Institute database seeding complete!');
}

if (require.main === module) {
  seedInstituteDatabase()
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
