import 'dotenv/config';
import prisma from '../src/config/prisma';

export async function seedProgrammesAndVault() {
  console.log('🚀 Seeding NCCT Programme Types, Offerings, Batches, Eligibility, TimeSlots, and Vault...');

  // 1. Programme Types
  const programmeTypes = [
    { code: 'PGDM', name: 'Post Graduate Diploma in Management', description: 'AICTE-approved two-year full-time residential post-graduate diploma specializing in Cooperative Business & Agribusiness Management.' },
    { code: 'DCBM', name: 'Diploma in Cooperative Business Management', description: 'Core executive management diploma for cooperative executives and mid-level supervisory officers.' },
    { code: 'HDCM', name: 'Higher Diploma in Cooperative Management', description: 'Premier 26-week flagship professional diploma designed for state cooperative department officers and society executives.' },
    { code: 'SECTORAL_DIPLOMA', name: 'Sectoral Diploma Programmes', description: 'Specialized diploma certifications in Dairy, Credit Banking, Fishery, Handloom, and Sugar Cooperatives.' },
    { code: 'MDP', name: 'Management Development Programmes (MDP)', description: 'Intensive short modules for senior managers, Board of Directors, and federation executives.' },
    { code: 'SHORT_TERM', name: 'Short-Term On-Site Training', description: '1 to 2-week focused hands-on skill development, compliance, ERP, and statutory audit clinics.' },
    { code: 'AWARENESS', name: 'Awareness & Sensitization', description: 'Grassroots campaigns, youth cooperative literacy, and rural credit empowerment workshops.' },
    { code: 'SEMINAR', name: 'Seminars & Conferences', description: 'National and regional roundtables on cooperative law, tax reforms, and policy frameworks.' },
    { code: 'WORKSHOP', name: 'Workshops & Hands-On Clinics', description: 'Interactive problem-solving workshops on PACS computerization and AMCS milk quality software.' },
    { code: 'WEBINAR', name: 'Webinars & Online Lectures', description: 'Digital dissemination lectures and knowledge series broadcast nationwide.' },
  ];

  const typeMap: Record<string, string> = {};
  for (const pt of programmeTypes) {
    const record = await prisma.programmeType.upsert({
      where: { code: pt.code },
      update: pt,
      create: pt,
    });
    typeMap[pt.code] = record.id;
  }
  console.log(`  ✓ ${programmeTypes.length} Programme Types seeded`);

  // 2. Time Slots for VAMNICOM
  const timeSlots = [
    { institutionId: 'inst-vamnicom', name: 'Morning Slot 1', startTime: '09:30', endTime: '11:00', slotType: 'LECTURE' },
    { institutionId: 'inst-vamnicom', name: 'Morning Tea Break', startTime: '11:00', endTime: '11:15', slotType: 'TEA_BREAK' },
    { institutionId: 'inst-vamnicom', name: 'Morning Slot 2', startTime: '11:15', endTime: '12:45', slotType: 'LECTURE' },
    { institutionId: 'inst-vamnicom', name: 'Lunch Break', startTime: '12:45', endTime: '01:45', slotType: 'LUNCH' },
    { institutionId: 'inst-vamnicom', name: 'Afternoon Slot 1', startTime: '01:45', endTime: '03:15', slotType: 'LAB' },
    { institutionId: 'inst-vamnicom', name: 'Afternoon Tea Break', startTime: '03:15', endTime: '03:30', slotType: 'TEA_BREAK' },
    { institutionId: 'inst-vamnicom', name: 'Afternoon Slot 2', startTime: '03:30', endTime: '05:00', slotType: 'INTERACTIVE' },
  ];

  await prisma.timeSlot.deleteMany({ where: { institutionId: 'inst-vamnicom' } });
  for (const ts of timeSlots) {
    await prisma.timeSlot.create({ data: ts });
  }
  console.log(`  ✓ ${timeSlots.length} Master Time Slots seeded`);

  // 3. Programmes
  const programmes = [
    {
      id: 'prog-pgdm-2026',
      programmeTypeId: typeMap['PGDM'],
      title: 'Post Graduate Diploma in Cooperative Business Management (PGDM-CBM)',
      titleHi: 'सहकारी व्यवसाय प्रबंधन में स्नातकोत्तर डिप्लोमा (पीजीडीएम)',
      titleMr: 'सहकारी व्यवसाय व्यवस्थापनात पदव्युत्तर पदविका (PGDM)',
      instituteId: 'inst-vamnicom',
      academicYear: '2026-2028',
      startDate: '2026-07-01',
      endDate: '2028-05-30',
      durationValue: 2,
      durationUnit: 'YEARS',
      deliveryMode: 'ON_SITE',
      studyPattern: 'FULL_TIME',
      attendanceMode: 'BIOMETRIC_FACE_RFID',
      assessmentMode: 'EXAM',
      hostelStatus: 'MANDATORY',
      hostelFee: 36000,
      fee: 145000,
      applicationDeadline: new Date('2026-06-15T23:59:59Z'),
      officialNotificationUrl: 'https://vamnicom.gov.in/admissions-2026',
      learningOutcomes: [
        'Strategic leadership in large-scale multi-state cooperative enterprises',
        'Advanced financial analytics, audit, and risk management in rural banking',
        'Cooperative law compliance and board governance mastery',
      ],
      mode: 'residential',
      capacity: 60,
      enrolledCount: 42,
      category: 'Management',
      description: 'The flagship AICTE-approved 2-year full-time residential postgraduate programme by VAMNICOM Pune, recognized as equivalent to MBA by AIU. Equips aspiring leaders with cooperative management and modern managerial expertise.',
      status: 'active',
      facultyId: 'usr-faculty-1',
    },
    {
      id: 'prog-hdcm-2026',
      programmeTypeId: typeMap['HDCM'],
      title: 'Higher Diploma in Cooperative Management (HDCM)',
      titleHi: 'उच्चतर सहकारी प्रबंधन डिप्लोमा (एचडीसीएम)',
      titleMr: 'उच्च सहकारी व्यवस्थापन पदविका (HDCM)',
      instituteId: 'inst-vamnicom',
      academicYear: '2026-2027',
      startDate: '2026-09-01',
      endDate: '2027-02-28',
      durationValue: 26,
      durationUnit: 'WEEKS',
      deliveryMode: 'ON_SITE',
      studyPattern: 'FULL_TIME',
      attendanceMode: 'BIOMETRIC_FACE_RFID',
      assessmentMode: 'EXAM',
      hostelStatus: 'OPTIONAL',
      hostelFee: 18000,
      fee: 45000,
      applicationDeadline: new Date('2026-08-15T23:59:59Z'),
      officialNotificationUrl: 'https://ncct.ac.in/hdcm-2026',
      learningOutcomes: [
        'End-to-end administration of cooperative department regulations',
        'Preparation and appraisal of cooperative credit and development schemes',
        'Leadership in DCCBs, Urban Cooperative Banks, and Marketing Federations',
      ],
      mode: 'residential',
      capacity: 45,
      enrolledCount: 38,
      category: 'Cooperative Law & Administration',
      description: 'The premier professional credential of NCCT spanning 26 weeks, combining intensive classroom instruction with study tours to prominent cooperative institutions across India.',
      status: 'active',
      facultyId: 'usr-faculty-1',
    },
    {
      id: 'prog-pacs-2026-01', // existing id in DB!
      programmeTypeId: typeMap['MDP'],
      title: 'Management Development Programme on PACS Computerization & ERP Operations',
      titleHi: 'पैक्स कम्प्यूटरीकरण और ईआरपी संचालन पर प्रबंधन विकास कार्यक्रम',
      titleMr: 'PACS संगणकीकरण आणि ERP ऑपरेशन्सवरील व्यवस्थापन विकास कार्यक्रम',
      instituteId: 'inst-vamnicom',
      academicYear: '2026-2027',
      startDate: '2026-09-01',
      endDate: '2026-09-28',
      durationValue: 4,
      durationUnit: 'WEEKS',
      deliveryMode: 'BLENDED',
      studyPattern: 'MODULAR',
      attendanceMode: 'BIOMETRIC_FACE_RFID',
      assessmentMode: 'PROJECT',
      hostelStatus: 'OPTIONAL',
      hostelFee: 8000,
      fee: 12000,
      applicationDeadline: new Date('2026-08-25T23:59:59Z'),
      officialNotificationUrl: 'https://vamnicom.gov.in/mdp-pacs-erp',
      learningOutcomes: [
        'Live day-open, ledger balancing, and KCC loan disbursement on National PACS ERP',
        'AMCS interface calibration, cold-chain receipt, and digital voucher audit',
        'Compliance with NABARD guidelines and Ministry of Cooperation standards',
      ],
      mode: 'hybrid',
      capacity: 35,
      enrolledCount: 28,
      category: 'PACS Digitalization',
      description: 'Specialized 4-week blended executive programme for PACS secretaries, accountants, and district cooperative officers navigating national ERP implementation.',
      status: 'active',
      facultyId: 'usr-faculty-1',
    },
    {
      id: 'prog-dairy-2026-02', // existing id in DB!
      programmeTypeId: typeMap['SECTORAL_DIPLOMA'],
      title: 'Sectoral Diploma in Dairy Cooperative Management & Cold Chain Logistics',
      titleHi: 'डेयरी सहकारी प्रबंधन और कोल्ड चेन लॉजिस्टिक्स में क्षेत्रीय डिप्लोमा',
      titleMr: 'डेअरी सहकारी व्यवस्थापन आणि कोल्ड चेन लॉजिस्टिक्समधील क्षेत्रीय पदविका',
      instituteId: 'inst-vamnicom',
      academicYear: '2026-2027',
      startDate: '2026-10-01',
      endDate: '2026-12-24',
      durationValue: 12,
      durationUnit: 'WEEKS',
      deliveryMode: 'CORRESPONDENCE_WITH_CONTACT_CLASSES',
      studyPattern: 'PART_TIME',
      attendanceMode: 'BIOMETRIC_FACE_RFID',
      assessmentMode: 'CONTINUOUS',
      hostelStatus: 'OPTIONAL',
      hostelFee: 6000,
      fee: 22000,
      applicationDeadline: new Date('2026-09-20T23:59:59Z'),
      officialNotificationUrl: 'https://vamnicom.gov.in/dairy-diploma',
      learningOutcomes: [
        'Understanding the 3-tier Amul cooperative model and producer economics',
        'Cold chain temperature management and automated fat/SNF testing calibration',
        'Dairy union supply chain management, ERP billing, and NDDB quality benchmarks',
      ],
      mode: 'hybrid',
      capacity: 40,
      enrolledCount: 30,
      category: 'Dairy Management',
      description: 'Comprehensive 12-week program designed in partnership with Amul and NDDB, incorporating weekend physical contact classes at VAMNICOM.',
      status: 'active',
      facultyId: 'usr-faculty-1',
    },
    {
      id: 'prog-cyber-2026',
      programmeTypeId: typeMap['SHORT_TERM'],
      title: 'Executive Workshop on Cooperative Cybersecurity & Fraud Prevention',
      titleHi: 'सहकारी साइबर सुरक्षा और धोखाधड़ी रोकथाम पर कार्यकारी कार्यशाला',
      titleMr: 'सहकारी सायबर सुरक्षा आणि फसवणूक प्रतिबंधावरील कार्यकारी कार्यशाळा',
      instituteId: 'inst-vamnicom',
      academicYear: '2026-2027',
      startDate: '2026-10-15',
      endDate: '2026-10-19',
      durationValue: 5,
      durationUnit: 'DAYS',
      deliveryMode: 'SHORT_TERM_ON_SITE',
      studyPattern: 'FULL_TIME',
      attendanceMode: 'BIOMETRIC_FACE_RFID',
      assessmentMode: 'CONTINUOUS',
      hostelStatus: 'OPTIONAL',
      hostelFee: 3500,
      fee: 6500,
      applicationDeadline: new Date('2026-10-05T23:59:59Z'),
      officialNotificationUrl: 'https://ncct.ac.in/cyber-workshop',
      learningOutcomes: [
        'Cyber threat mitigation in Urban Cooperative Banks and DCCB core banking',
        'Incident response protocol and CERT-In reporting for cooperative institutions',
        'Hands-on vulnerability assessment of teller terminals and kiosk networks',
      ],
      mode: 'residential',
      capacity: 30,
      enrolledCount: 15,
      category: 'Technology & Security',
      description: '5-day intensive on-site boot camp for IT managers, compliance heads, and executive directors of cooperative banks.',
      status: 'active',
      facultyId: 'usr-faculty-1',
    },
    {
      id: 'prog-webinar-mscs',
      programmeTypeId: typeMap['WEBINAR'],
      title: 'National Webinar Series on Multi-State Cooperative Societies Amendment Act',
      titleHi: 'बहु-राज्य सहकारी समितियां संशोधन अधिनियम पर राष्ट्रीय वेबिनार श्रृंखला',
      titleMr: 'बहु-राज्य सहकारी संस्था दुरुस्ती कायद्यावरील राष्ट्रीय वेबिनार मालिका',
      instituteId: 'inst-vamnicom',
      academicYear: '2026-2027',
      startDate: '2026-11-05',
      endDate: '2026-11-05',
      durationValue: 1,
      durationUnit: 'DAYS',
      deliveryMode: 'FULLY_ONLINE',
      studyPattern: 'MODULAR',
      attendanceMode: 'MANUAL',
      assessmentMode: 'NONE',
      hostelStatus: 'NOT_AVAILABLE',
      hostelFee: 0,
      fee: 0,
      applicationDeadline: new Date('2026-11-04T23:59:59Z'),
      officialNotificationUrl: 'https://cooperation.gov.in/webinar-mscs',
      learningOutcomes: [
        'Key structural amendments under the MSCS Act 2023',
        'Election authority guidelines, cooperative ombudsman powers, and audit reforms',
      ],
      mode: 'online',
      capacity: 500,
      enrolledCount: 312,
      category: 'Cooperative Policy',
      description: 'Informational national webinar on the statutory implications of the latest MSCS reforms, featuring eminent speakers from the Ministry of Cooperation.',
      status: 'active',
      facultyId: 'usr-faculty-1',
    },
  ];

  for (const p of programmes) {
    await prisma.programme.upsert({
      where: { id: p.id },
      update: p,
      create: p,
    });
  }
  console.log(`  ✓ ${programmes.length} Programme Offerings seeded`);

  // 4. Eligibility Rules
  const rules = [
    {
      programmeId: 'prog-pgdm-2026',
      minimumQualification: 'Graduation',
      minimumPercentage: 50.0,
      experienceRequired: false,
      experienceYears: 0,
      minimumAge: 20,
      maximumAge: 32,
      entranceRequired: true,
      interviewRequired: true,
      requiredDocuments: ['AADHAAR', 'GRADUATION_DEGREE', '10TH_MARKSHEET', '12TH_MARKSHEET'],
      targetGroup: 'Graduates seeking executive careers in agribusiness, banking, and federation leadership.',
    },
    {
      programmeId: 'prog-hdcm-2026',
      minimumQualification: 'Graduation',
      minimumPercentage: 45.0,
      experienceRequired: true,
      experienceYears: 1.0,
      minimumAge: 21,
      maximumAge: 50,
      entranceRequired: false,
      interviewRequired: false,
      requiredDocuments: ['AADHAAR', 'GRADUATION_DEGREE', 'COOP_SPONSOR_LETTER'],
      targetGroup: 'Officers of State Cooperative Departments, PACS secretaries, and cooperative bank staff.',
    },
    {
      programmeId: 'prog-pacs-2026-01',
      minimumQualification: 'Graduation',
      minimumPercentage: 40.0,
      experienceRequired: true,
      experienceYears: 0.5,
      minimumAge: 18,
      maximumAge: 60,
      entranceRequired: false,
      interviewRequired: false,
      requiredDocuments: ['AADHAAR', 'EXPERIENCE_CERT'],
      targetGroup: 'PACS Secretaries, Accountants, DCCB Branch Officers, and CSC Operators.',
    },
    {
      programmeId: 'prog-dairy-2026-02',
      minimumQualification: '10+2',
      minimumPercentage: 45.0,
      experienceRequired: false,
      experienceYears: 0,
      minimumAge: 18,
      maximumAge: 55,
      entranceRequired: false,
      interviewRequired: false,
      requiredDocuments: ['AADHAAR', '12TH_MARKSHEET'],
      targetGroup: 'Dairy cooperative field supervisors, AMCS operators, and livestock farm managers.',
    },
    {
      programmeId: 'prog-cyber-2026',
      minimumQualification: 'Any',
      minimumPercentage: 0,
      experienceRequired: false,
      experienceYears: 0,
      minimumAge: 18,
      maximumAge: 65,
      entranceRequired: false,
      interviewRequired: false,
      requiredDocuments: ['AADHAAR'],
      targetGroup: 'IT officers, auditors, compliance executives, and board directors.',
    },
    {
      programmeId: 'prog-webinar-mscs',
      minimumQualification: 'Any',
      minimumPercentage: 0,
      experienceRequired: false,
      experienceYears: 0,
      requiredDocuments: ['AADHAAR'],
      targetGroup: 'All cooperative members, professionals, and the general public.',
    },
  ];

  for (const r of rules) {
    await prisma.programmeEligibilityRule.upsert({
      where: { programmeId: r.programmeId },
      update: r,
      create: r,
    });
  }
  console.log(`  ✓ ${rules.length} Programme Eligibility Rules seeded`);

  // 5. Batches for Physical & Hybrid Offerings
  const batches = [
    {
      id: 'batch-pgdm-2026-a',
      programmeId: 'prog-pgdm-2026',
      name: 'Batch 2026-A (Section 1)',
      startDate: '2026-07-01',
      endDate: '2027-04-30',
      capacity: 35,
      enrolledCount: 30,
      room: 'Lecture Hall 1 (Ground Floor)',
      classroomId: 'A101',
      kioskId: 'kiosk-pi-01',
      facultyId: 'usr-faculty-1',
      status: 'ACTIVE',
    },
    {
      id: 'batch-hdcm-2026-a',
      programmeId: 'prog-hdcm-2026',
      name: 'Batch 2026 Regular',
      startDate: '2026-09-01',
      endDate: '2027-02-28',
      capacity: 45,
      enrolledCount: 38,
      room: 'Seminar Room 2 (First Floor)',
      classroomId: 'B204',
      kioskId: 'kiosk-pi-02',
      facultyId: 'usr-faculty-1',
      status: 'ACTIVE',
    },
    {
      id: 'batch-pacs-2026-01',
      programmeId: 'prog-pacs-2026-01',
      name: 'Batch September 2026',
      startDate: '2026-09-01',
      endDate: '2026-09-28',
      capacity: 35,
      enrolledCount: 28,
      room: 'Smart Computer Lab 2',
      classroomId: 'CL102',
      kioskId: 'kiosk-pi-01',
      facultyId: 'usr-faculty-1',
      status: 'ACTIVE',
    },
    {
      id: 'batch-cyber-2026',
      programmeId: 'prog-cyber-2026',
      name: 'Batch Oct-2026 Workshop',
      startDate: '2026-10-15',
      endDate: '2026-10-19',
      capacity: 30,
      enrolledCount: 15,
      room: 'Executive Boardroom',
      classroomId: 'EX301',
      kioskId: 'kiosk-pi-01',
      facultyId: 'usr-faculty-1',
      status: 'UPCOMING',
    },
  ];

  for (const b of batches) {
    await prisma.batch.upsert({
      where: { id: b.id },
      update: b,
      create: b,
    });
  }
  console.log(`  ✓ ${batches.length} Batches seeded`);

  // 6. Connect existing sessions to batch-pacs-2026-01
  await prisma.session.updateMany({
    where: { programmeId: 'prog-pacs-2026-01' },
    data: { batchId: 'batch-pacs-2026-01', sessionMode: 'PHYSICAL', attendanceRequired: true },
  });

  // Seed conflict-free weekly timetable sessions for batch-pgdm-2026-a & batch-hdcm-2026-a
  const sampleSessions = [
    {
      id: 'sess-pgdm-mon-1',
      programmeId: 'prog-pgdm-2026',
      batchId: 'batch-pgdm-2026-a',
      title: 'Cooperative Governance & Legal Framework',
      instructor: 'Prof. Meenakshi Sundaram',
      facultyId: 'usr-faculty-1',
      date: '2026-09-21',
      timeSlot: '09:30 AM – 11:00 AM',
      room: 'Lecture Hall 1 (Ground Floor)',
      capacity: 40,
      classroomId: 'A101',
      attendanceMode: 'FACE_RFID',
      qrToken: 'qr-pgdm-mon-1',
      active: false,
      instituteId: 'inst-vamnicom',
      sessionMode: 'PHYSICAL',
      sessionType: 'LECTURE',
      attendanceRequired: true,
    },
    {
      id: 'sess-pgdm-mon-2',
      programmeId: 'prog-pgdm-2026',
      batchId: 'batch-pgdm-2026-a',
      title: 'Managerial Accounting for Cooperatives',
      instructor: 'Dr. Rajesh Deshmukh',
      facultyId: 'usr-admin-vamnicom',
      date: '2026-09-21',
      timeSlot: '11:15 AM – 12:45 PM',
      room: 'Lecture Hall 1 (Ground Floor)',
      capacity: 40,
      classroomId: 'A101',
      attendanceMode: 'FACE_RFID',
      qrToken: 'qr-pgdm-mon-2',
      active: false,
      instituteId: 'inst-vamnicom',
      sessionMode: 'PHYSICAL',
      sessionType: 'LECTURE',
      attendanceRequired: true,
    },
    {
      id: 'sess-hdcm-mon-1',
      programmeId: 'prog-hdcm-2026',
      batchId: 'batch-hdcm-2026-a',
      title: 'Credit Appraisal & Risk Assessment in DCCBs',
      instructor: 'Prof. Meenakshi Sundaram',
      facultyId: 'usr-faculty-1',
      date: '2026-09-21',
      timeSlot: '01:45 PM – 03:15 PM', // Different time slot, no conflict!
      room: 'Seminar Room 2 (First Floor)', // Different room, no conflict!
      capacity: 45,
      classroomId: 'B204',
      attendanceMode: 'FACE_RFID',
      qrToken: 'qr-hdcm-mon-1',
      active: false,
      instituteId: 'inst-vamnicom',
      sessionMode: 'PHYSICAL',
      sessionType: 'LECTURE',
      attendanceRequired: true,
    },
    {
      id: 'sess-pacs-mon-lab',
      programmeId: 'prog-pacs-2026-01',
      batchId: 'batch-pacs-2026-01',
      title: 'Hands-on Lab: Real-time KCC Disbursement & Day Balancing',
      instructor: 'Shri Arvind Mehta',
      facultyId: 'usr-superadmin',
      date: '2026-09-21',
      timeSlot: '01:45 PM – 03:15 PM',
      room: 'Smart Computer Lab 2',
      capacity: 35,
      classroomId: 'CL102',
      attendanceMode: 'FACE_RFID',
      qrToken: 'qr-pacs-mon-lab',
      active: false,
      instituteId: 'inst-vamnicom',
      sessionMode: 'PHYSICAL',
      sessionType: 'LAB',
      attendanceRequired: true,
    },
  ];

  for (const s of sampleSessions) {
    await prisma.session.upsert({
      where: { id: s.id },
      update: s,
      create: s,
    });
  }
  console.log(`  ✓ ${sampleSessions.length} Timetable Sessions seeded with zero conflicts`);

  // 7. Seed Reusable Document Vault for Rameshwar Patil (usr-trainee-1)
  const traineeDocs = [
    {
      userId: 'usr-trainee-1',
      documentType: 'AADHAAR',
      fileName: 'Aadhaar_Card_Rameshwar_Patil.pdf',
      filePath: '/uploads/documents/usr-trainee-1/aadhaar.pdf',
      fileSize: 245760,
      mimeType: 'application/pdf',
      verificationStatus: 'VERIFIED',
      verifiedBy: 'system-ekyc',
      verifiedAt: new Date('2026-01-15T10:00:00Z'),
      metadata: { uidLast4: '4589', nameAsPerDoc: 'Rameshwar Patil', dob: '1998-04-12' },
    },
    {
      userId: 'usr-trainee-1',
      documentType: 'GRADUATION_DEGREE',
      fileName: 'BCom_Degree_Pune_University.pdf',
      filePath: '/uploads/documents/usr-trainee-1/bcom_degree.pdf',
      fileSize: 524288,
      mimeType: 'application/pdf',
      verificationStatus: 'VERIFIED',
      verifiedBy: 'usr-admin-vamnicom',
      verifiedAt: new Date('2026-02-10T14:30:00Z'),
      metadata: { university: 'Savitribai Phule Pune University', percentage: 68.5, yearOfPassing: 2020 },
    },
    {
      userId: 'usr-trainee-1',
      documentType: '10TH_MARKSHEET',
      fileName: 'SSC_Class_10_Certificate.pdf',
      filePath: '/uploads/documents/usr-trainee-1/ssc_marksheet.pdf',
      fileSize: 312000,
      mimeType: 'application/pdf',
      verificationStatus: 'VERIFIED',
      verifiedBy: 'system',
      verifiedAt: new Date('2026-01-15T10:05:00Z'),
      metadata: { board: 'Maharashtra State Board', percentage: 76.2 },
    },
    {
      userId: 'usr-trainee-1',
      documentType: '12TH_MARKSHEET',
      fileName: 'HSC_Class_12_Commerce_Certificate.pdf',
      filePath: '/uploads/documents/usr-trainee-1/hsc_marksheet.pdf',
      fileSize: 340000,
      mimeType: 'application/pdf',
      verificationStatus: 'VERIFIED',
      verifiedBy: 'system',
      verifiedAt: new Date('2026-01-15T10:06:00Z'),
      metadata: { board: 'Maharashtra State Board', percentage: 71.8 },
    },
    {
      userId: 'usr-trainee-1',
      documentType: 'COOP_SPONSOR_LETTER',
      fileName: 'Shri_Datta_PACS_Nomination_Letter.pdf',
      filePath: '/uploads/documents/usr-trainee-1/nomination_letter.pdf',
      fileSize: 198000,
      mimeType: 'application/pdf',
      verificationStatus: 'VERIFIED',
      verifiedBy: 'usr-admin-vamnicom',
      verifiedAt: new Date('2026-02-15T11:00:00Z'),
      metadata: { society: 'Shri Datta PACS, Niphad, Nashik', designation: 'Junior Accountant' },
    },
    {
      userId: 'usr-trainee-1',
      documentType: 'EXPERIENCE_CERT',
      fileName: 'PACS_Work_Experience_Certificate.pdf',
      filePath: '/uploads/documents/usr-trainee-1/experience_cert.pdf',
      fileSize: 220000,
      mimeType: 'application/pdf',
      verificationStatus: 'VERIFIED',
      verifiedBy: 'usr-admin-vamnicom',
      verifiedAt: new Date('2026-02-15T11:05:00Z'),
      metadata: { years: 1.5, employer: 'Shri Datta PACS' },
    },
  ];

  const vaultMap: Record<string, string> = {};
  for (const doc of traineeDocs) {
    const record = await prisma.userDocument.upsert({
      where: { userId_documentType: { userId: doc.userId, documentType: doc.documentType } },
      update: doc,
      create: doc,
    });
    vaultMap[doc.documentType] = record.id;
  }
  console.log(`  ✓ ${traineeDocs.length} Vault Documents seeded for Rameshwar Patil`);

  // 8. Seed Programme Applications for Rameshwar Patil
  const app1 = await prisma.programmeApplication.upsert({
    where: { programmeId_userId: { programmeId: 'prog-pacs-2026-01', userId: 'usr-trainee-1' } },
    update: {
      batchId: 'batch-pacs-2026-01',
      status: 'ENROLLED',
      eligibilityResult: 'ELIGIBLE',
      hostelRequired: true,
      hostelStatus: 'ALLOCATED',
    },
    create: {
      programmeId: 'prog-pacs-2026-01',
      userId: 'usr-trainee-1',
      batchId: 'batch-pacs-2026-01',
      status: 'ENROLLED',
      eligibilityResult: 'ELIGIBLE',
      hostelRequired: true,
      hostelStatus: 'ALLOCATED',
    },
  });

  // Link consented documents to Application 1
  if (vaultMap['AADHAAR'] && vaultMap['EXPERIENCE_CERT']) {
    await prisma.applicationDocument.upsert({
      where: { applicationId_documentId: { applicationId: app1.id, documentId: vaultMap['AADHAAR'] } },
      update: { consented: true, reviewStatus: 'ACCEPTED' },
      create: { applicationId: app1.id, documentId: vaultMap['AADHAAR'], consented: true, reviewStatus: 'ACCEPTED' },
    });
    await prisma.applicationDocument.upsert({
      where: { applicationId_documentId: { applicationId: app1.id, documentId: vaultMap['EXPERIENCE_CERT'] } },
      update: { consented: true, reviewStatus: 'ACCEPTED' },
      create: { applicationId: app1.id, documentId: vaultMap['EXPERIENCE_CERT'], consented: true, reviewStatus: 'ACCEPTED' },
    });
  }

  const app2 = await prisma.programmeApplication.upsert({
    where: { programmeId_userId: { programmeId: 'prog-hdcm-2026', userId: 'usr-trainee-1' } },
    update: {
      batchId: 'batch-hdcm-2026-a',
      status: 'SUBMITTED',
      eligibilityResult: 'ELIGIBLE',
      hostelRequired: true,
      hostelStatus: 'REQUESTED',
    },
    create: {
      programmeId: 'prog-hdcm-2026',
      userId: 'usr-trainee-1',
      batchId: 'batch-hdcm-2026-a',
      status: 'SUBMITTED',
      eligibilityResult: 'ELIGIBLE',
      hostelRequired: true,
      hostelStatus: 'REQUESTED',
    },
  });

  if (vaultMap['AADHAAR'] && vaultMap['GRADUATION_DEGREE'] && vaultMap['COOP_SPONSOR_LETTER']) {
    await prisma.applicationDocument.upsert({
      where: { applicationId_documentId: { applicationId: app2.id, documentId: vaultMap['AADHAAR'] } },
      update: { consented: true, reviewStatus: 'ACCEPTED' },
      create: { applicationId: app2.id, documentId: vaultMap['AADHAAR'], consented: true, reviewStatus: 'ACCEPTED' },
    });
    await prisma.applicationDocument.upsert({
      where: { applicationId_documentId: { applicationId: app2.id, documentId: vaultMap['GRADUATION_DEGREE'] } },
      update: { consented: true, reviewStatus: 'ACCEPTED' },
      create: { applicationId: app2.id, documentId: vaultMap['GRADUATION_DEGREE'], consented: true, reviewStatus: 'ACCEPTED' },
    });
    await prisma.applicationDocument.upsert({
      where: { applicationId_documentId: { applicationId: app2.id, documentId: vaultMap['COOP_SPONSOR_LETTER'] } },
      update: { consented: true, reviewStatus: 'ACCEPTED' },
      create: { applicationId: app2.id, documentId: vaultMap['COOP_SPONSOR_LETTER'], consented: true, reviewStatus: 'ACCEPTED' },
    });
  }

  console.log(`  ✓ 2 Programme Applications seeded for Rameshwar Patil with consented documents`);
  console.log('✅ NCCT Data successfully seeded into Supabase PostgreSQL.');
}

if (require.main === module) {
  seedProgrammesAndVault()
    .catch(e => { console.error('Error seeding programmes/vault:', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
}
