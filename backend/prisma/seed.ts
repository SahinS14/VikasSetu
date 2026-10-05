/**
 * VikasSetu — Prisma seed script
 * Run: npx tsx prisma/seed.ts   (uses DIRECT_URL for direct Supabase connection)
 *
 * Seeds all demo data that matches the frontend SEED_* constants so the
 * existing demo credentials and UI screenshots remain identical.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { seedProgrammesAndVault } from './seed_programmes_vault';

const prisma = new PrismaClient();
const SALT = 10;

async function main() {
  console.log('🌱  Seeding VikasSetu database…');

  // ─── Hash demo passwords ───────────────────────────────────────────────────
  const [pwTrainee, pwAdmin, pwSuper, pwFaculty, pwEmployer, pwDevice, pwHostel] = await Promise.all([
    bcrypt.hash('Demo@1234', SALT),
    bcrypt.hash('Admin@1234', SALT),
    bcrypt.hash('Super@1234', SALT),
    bcrypt.hash('Faculty@1234', SALT),
    bcrypt.hash('Employer@1234', SALT),
    bcrypt.hash('Demo@1234', SALT),
    bcrypt.hash('Hostel@1234', SALT),
  ]);

  // ─── Institutes (all 20 NCCT institutes) ──────────────────────────────────
  const institutes = [
    { id: 'inst-vamnicom', name: 'VAMNICOM (Vaikunth Mehta National Institute of Cooperative Management)', nameHi: 'वैकुंठ मेहता राष्ट्रीय सहकारी प्रबंध संस्थान (वाम्निकॉम)', type: 'VAMNICOM', city: 'Pune', state: 'Maharashtra', director: 'Dr. H. K. Mishra', capacity: 450, contactEmail: 'director@vamnicom.gov.in', contactPhone: '+91 20 2553 7974', activeCount: 382 },
    { id: 'inst-ricm-chd', name: 'Regional Institute of Cooperative Management (RICM), Chandigarh', nameHi: 'क्षेत्रीय सहकारी प्रबंध संस्थान, चंडीगढ़', type: 'RICM', city: 'Chandigarh', state: 'Chandigarh / Punjab', director: 'Shri R. K. Sharma', capacity: 200, contactEmail: 'info@ricmchandigarh.gov.in', contactPhone: '+91 172 260 2145', activeCount: 164 },
    { id: 'inst-ricm-blr', name: 'Regional Institute of Cooperative Management (RICM), Bengaluru', nameHi: 'क्षेत्रीय सहकारी प्रबंध संस्थान, बेंगलुरु', type: 'RICM', city: 'Bengaluru', state: 'Karnataka', director: 'Dr. M. S. Patil', capacity: 220, contactEmail: 'ricm.bengaluru@ncct.ac.in', contactPhone: '+91 80 2344 5566', activeCount: 195 },
    { id: 'inst-ricm-kly', name: 'Regional Institute of Cooperative Management (RICM), Kalyani', nameHi: 'क्षेत्रीय सहकारी प्रबंध संस्थान, कल्याणी', type: 'RICM', city: 'Kalyani', state: 'West Bengal', director: 'Prof. S. Sengupta', capacity: 180, contactEmail: 'ricm.kalyani@ncct.ac.in', contactPhone: '+91 33 2582 8221', activeCount: 142 },
    { id: 'inst-ricm-gdn', name: 'Regional Institute of Cooperative Management (RICM), Gandhinagar', nameHi: 'क्षेत्रीय सहकारी प्रबंध संस्थान, गांधीनगर', type: 'RICM', city: 'Gandhinagar', state: 'Gujarat', director: 'Shri D. V. Patel', capacity: 250, contactEmail: 'ricm.gandhinagar@ncct.ac.in', contactPhone: '+91 79 2322 1144', activeCount: 218 },
    { id: 'inst-ricm-ptn', name: 'Regional Institute of Cooperative Management (RICM), Patna', nameHi: 'क्षेत्रीय सहकारी प्रबंध संस्थान, पटना', type: 'RICM', city: 'Patna', state: 'Bihar', director: 'Dr. A. K. Verma', capacity: 190, contactEmail: 'ricm.patna@ncct.ac.in', contactPhone: '+91 612 228 3344', activeCount: 155 },
    { id: 'inst-icm-bhopal', name: 'Institute of Cooperative Management (ICM), Bhopal', nameHi: 'सहकारी प्रबंध संस्थान, भोपाल', type: 'ICM', city: 'Bhopal', state: 'Madhya Pradesh', director: 'Shri V. P. Tiwari', capacity: 150, contactEmail: 'icm.bhopal@ncct.ac.in', contactPhone: '+91 755 277 8899', activeCount: 120 },
    { id: 'inst-icm-bbsr', name: 'Institute of Cooperative Management (ICM), Bhubaneswar', nameHi: 'सहकारी प्रबंध संस्थान, भुवनेश्वर', type: 'ICM', city: 'Bhubaneswar', state: 'Odisha', director: 'Dr. P. C. Mohanty', capacity: 160, contactEmail: 'icm.bhubaneswar@ncct.ac.in', contactPhone: '+91 674 256 1234', activeCount: 135 },
    { id: 'inst-icm-chn', name: 'Institute of Cooperative Management (ICM), Chennai', nameHi: 'सहकारी प्रबंध संस्थान, चेन्नई', type: 'ICM', city: 'Chennai', state: 'Tamil Nadu', director: 'Shri R. Subramanian', capacity: 180, contactEmail: 'icm.chennai@ncct.ac.in', contactPhone: '+91 44 2626 5432', activeCount: 148 },
    { id: 'inst-icm-ddn', name: 'Institute of Cooperative Management (ICM), Dehradun', nameHi: 'सहकारी प्रबंध संस्थान, देहरादून', type: 'ICM', city: 'Dehradun', state: 'Uttarakhand', director: 'Dr. N. S. Rawat', capacity: 140, contactEmail: 'icm.dehradun@ncct.ac.in', contactPhone: '+91 135 276 5432', activeCount: 112 },
    { id: 'inst-icm-ghy', name: 'Institute of Cooperative Management (ICM), Guwahati', nameHi: 'सहकारी प्रबंध संस्थान, गुवाहाटी', type: 'ICM', city: 'Guwahati', state: 'Assam', director: 'Shri B. K. Sarma', capacity: 150, contactEmail: 'icm.guwahati@ncct.ac.in', contactPhone: '+91 361 245 6789', activeCount: 124 },
    { id: 'inst-icm-hyd', name: 'Institute of Cooperative Management (ICM), Hyderabad', nameHi: 'सहकारी प्रबंध संस्थान, हैदराबाद', type: 'ICM', city: 'Hyderabad', state: 'Telangana', director: 'Dr. K. Srinivas Rao', capacity: 170, contactEmail: 'icm.hyderabad@ncct.ac.in', contactPhone: '+91 40 2401 2345', activeCount: 141 },
    { id: 'inst-icm-imp', name: 'Institute of Cooperative Management (ICM), Imphal', nameHi: 'सहकारी प्रबंध संस्थान, इंफाल', type: 'ICM', city: 'Imphal', state: 'Manipur', director: 'Shri L. Singh', capacity: 120, contactEmail: 'icm.imphal@ncct.ac.in', contactPhone: '+91 385 244 5678', activeCount: 88 },
    { id: 'inst-icm-jpr', name: 'Institute of Cooperative Management (ICM), Jaipur', nameHi: 'सहकारी प्रबंध संस्थान, जयपुर', type: 'ICM', city: 'Jaipur', state: 'Rajasthan', director: 'Dr. R. C. Meena', capacity: 175, contactEmail: 'icm.jaipur@ncct.ac.in', contactPhone: '+91 141 270 9876', activeCount: 152 },
    { id: 'inst-icm-knr', name: 'Institute of Cooperative Management (ICM), Kannur', nameHi: 'सहकारी प्रबंध संस्थान, कन्नूर', type: 'ICM', city: 'Kannur', state: 'Kerala', director: 'Dr. K. P. Sukumaran', capacity: 160, contactEmail: 'icm.kannur@ncct.ac.in', contactPhone: '+91 497 274 5678', activeCount: 130 },
    { id: 'inst-icm-lko', name: 'Institute of Cooperative Management (ICM), Lucknow', nameHi: 'सहकारी प्रबंध संस्थान, लखनऊ', type: 'ICM', city: 'Lucknow', state: 'Uttar Pradesh', director: 'Shri S. K. Awasthi', capacity: 190, contactEmail: 'icm.lucknow@ncct.ac.in', contactPhone: '+91 522 238 9012', activeCount: 168 },
    { id: 'inst-icm-mdu', name: 'Institute of Cooperative Management (ICM), Madurai', nameHi: 'सहकारी प्रबंध संस्थान, मदुरै', type: 'ICM', city: 'Madurai', state: 'Tamil Nadu', director: 'Dr. G. Natarajan', capacity: 160, contactEmail: 'icm.madurai@ncct.ac.in', contactPhone: '+91 452 269 1122', activeCount: 129 },
    { id: 'inst-icm-ngp', name: 'Institute of Cooperative Management (ICM), Nagpur', nameHi: 'सहकारी प्रबंध संस्थान, नागपुर', type: 'ICM', city: 'Nagpur', state: 'Maharashtra', director: 'Shri P. M. Deshmukh', capacity: 155, contactEmail: 'icm.nagpur@ncct.ac.in', contactPhone: '+91 712 254 7890', activeCount: 134 },
    { id: 'inst-icm-pune', name: 'Institute of Cooperative Management (ICM), Pune', nameHi: 'सहकारी प्रबंध संस्थान, पुणे', type: 'ICM', city: 'Pune', state: 'Maharashtra', director: 'Dr. S. B. Kulkarni', capacity: 170, contactEmail: 'icm.pune@ncct.ac.in', contactPhone: '+91 20 2687 4321', activeCount: 145 },
    { id: 'inst-icm-tvm', name: 'Institute of Cooperative Management (ICM), Thiruvananthapuram', nameHi: 'सहकारी प्रबंध संस्थान, तिरुवनंतपुरम', type: 'ICM', city: 'Thiruvananthapuram', state: 'Kerala', director: 'Dr. M. Ramanathan', capacity: 165, contactEmail: 'icm.tvm@ncct.ac.in', contactPhone: '+91 471 234 5678', activeCount: 139 },
  ];

  for (const inst of institutes) {
    await prisma.institute.upsert({ where: { id: inst.id }, update: inst, create: inst });
  }
  console.log('  ✓ 20 institutes');

  // ─── Users ─────────────────────────────────────────────────────────────────
  const users = [
    // Trainees (demo login: rameshwar.pacs@gmail.com / Demo@1234)
    { id: 'usr-trainee-1', name: 'Rameshwar Patil', nameHi: 'रामेश्वर पाटिल', email: 'rameshwar.pacs@gmail.com', employeeId: 'NCCT-TRN-2026-MH-44091', passwordHash: pwTrainee, phone: '+91 98234 11223', role: 'trainee', languagePreference: 'en', instituteId: 'inst-vamnicom', cooperativeAffiliation: 'Shri Datta PACS, Niphad, Nashik', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', aadhaarMock: 'XXXX-XXXX-4589', isKycVerified: true, status: 'active' },
    { id: 'usr-trainee-2', name: 'Sunita Devi', nameHi: 'सुनीता देवी', email: 'sunita.shg@yahoo.com', employeeId: 'NCCT-TRN-2026-UP-71234', passwordHash: pwTrainee, phone: '+91 94150 88776', role: 'trainee', languagePreference: 'hi', instituteId: 'inst-icm-lko', cooperativeAffiliation: 'Prerna Mahila SHG Federation, Barabanki', avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', aadhaarMock: 'XXXX-XXXX-7123', isKycVerified: true, status: 'active' },
    { id: 'usr-trainee-3', name: 'Ganesh Shinde', nameHi: 'गणेश शिंदे', email: 'ganesh.dairy@gmail.com', employeeId: 'NCCT-TRN-2026-MH-99012', passwordHash: pwTrainee, phone: '+91 98221 44556', role: 'trainee', languagePreference: 'mr', instituteId: 'inst-vamnicom', cooperativeAffiliation: 'Mahanand Dairy Cooperative Union, Kolhapur', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', aadhaarMock: 'XXXX-XXXX-9901', isKycVerified: true, status: 'active' },
    { id: 'usr-trainee-4', name: 'Anjali Sharma', nameHi: 'अंजलि शर्मा', email: 'anjali.coop@gmail.com', employeeId: 'NCCT-TRN-2026-RJ-33441', passwordHash: pwTrainee, phone: '+91 94140 33221', role: 'trainee', languagePreference: 'en', instituteId: 'inst-icm-jpr', cooperativeAffiliation: 'Kisan Seva Sahakari Samiti, Alwar', avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', aadhaarMock: 'XXXX-XXXX-3344', isKycVerified: true, status: 'active' },
    { id: 'usr-trainee-5', name: 'Manoj Kumar Nayak', nameHi: 'मनोज कुमार नायक', email: 'manoj.nayak@coop.in', employeeId: 'NCCT-TRN-2026-OD-66772', passwordHash: pwTrainee, phone: '+91 94370 12345', role: 'trainee', languagePreference: 'en', instituteId: 'inst-icm-bbsr', cooperativeAffiliation: 'Puri District Cooperative Central Bank', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', aadhaarMock: 'XXXX-XXXX-6677', isKycVerified: true, status: 'active' },
    { id: 'usr-trainee-6', name: 'Kavita Jadhav', nameHi: 'कविता जाधव', email: 'kavita.j@shg-mah.org', employeeId: 'NCCT-TRN-2026-MH-11223', passwordHash: pwTrainee, phone: '+91 98230 67890', role: 'trainee', languagePreference: 'mr', instituteId: 'inst-icm-pune', cooperativeAffiliation: 'Savitribai Phule Mahila Bachat Gat, Pune', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', aadhaarMock: 'XXXX-XXXX-1122', isKycVerified: true, status: 'active' },
    // Institute Admin (demo: admin.vamnicom@ncct.gov.in / Admin@1234)
    { id: 'usr-admin-vamnicom', name: 'Dr. Rajesh Deshmukh', nameHi: 'डॉ. राजेश देशमुख', email: 'admin.vamnicom@ncct.gov.in', employeeId: 'NCCT-ADM-2026-MH-001', passwordHash: pwAdmin, phone: '+91 20 2553 7970', role: 'institute_admin', languagePreference: 'en', instituteId: 'inst-vamnicom', avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80', isKycVerified: true, status: 'active' },
    // Super Admin (demo: superadmin@ncct.gov.in / Super@1234)
    { id: 'usr-superadmin', name: 'Shri Arvind Mehta', nameHi: 'श्री अरविंद मेहता', email: 'superadmin@ncct.gov.in', employeeId: 'NCCT-HQ-2026-DL-001', passwordHash: pwSuper, phone: '+91 11 2338 9900', role: 'super_admin', languagePreference: 'en', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', isKycVerified: true, status: 'active' },
    // Faculty (demo: faculty@ncct.gov.in / Faculty@1234)
    { id: 'usr-faculty-1', name: 'Prof. Meenakshi Sundaram', nameHi: 'प्रो. मीनाक्षी सुंदरम', email: 'faculty@ncct.gov.in', employeeId: 'NCCT-FAC-2026-MH-101', passwordHash: pwFaculty, phone: '+91 20 2553 7980', role: 'faculty', languagePreference: 'en', instituteId: 'inst-vamnicom', avatarUrl: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=150&auto=format&fit=crop&q=80', isKycVerified: true, status: 'active' },
    // Employer (demo: employer@ncct.gov.in / Employer@1234)
    { id: 'usr-employer-1', name: 'Shri Vikram Nair', nameHi: 'श्री विक्रम नायर', email: 'employer@ncct.gov.in', employeeId: 'NCCT-EMP-2026-KA-501', passwordHash: pwEmployer, phone: '+91 80 4567 8901', role: 'employer', languagePreference: 'en', avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80', isKycVerified: true, status: 'active' },
    // Device Operator (demo: device.demo@example.com or NCCT-DEV-2026-MH-001 / Demo@1234)
    { id: 'usr-device-operator', name: 'Karthik Hardware Operator', nameHi: 'कार्तिक हार्डवेयर ऑपरेटर', email: 'device.demo@example.com', employeeId: 'NCCT-DEV-2026-MH-001', passwordHash: pwDevice, phone: '+91 98200 77889', role: 'device_operator', languagePreference: 'en', instituteId: 'inst-vamnicom', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80', isKycVerified: true, status: 'active' },
    // Hostel Admin / Chief Warden (demo: hostel.warden@ncct.gov.in / Hostel@1234)
    { id: 'usr-warden-1', name: 'Shri Rajesh Kulkarni', nameHi: 'श्री राजेश कुलकर्णी', email: 'hostel.warden@ncct.gov.in', employeeId: 'NCCT-HST-2026-MH-001', passwordHash: pwHostel, phone: '+91 20 2553 7988', role: 'hostel_admin', languagePreference: 'en', instituteId: 'inst-vamnicom', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', isKycVerified: true, status: 'active' },
  ];

  for (const u of users) {
    await prisma.user.upsert({ where: { id: u.id }, update: u, create: u as any });
  }
  console.log('  ✓ 12 users (6 trainees + admin + superadmin + faculty + employer + device_operator + hostel_admin)');

  // ─── Courses with full module/quiz JSON ────────────────────────────────────
  const pacsModules = [
    {
      id: 'mod-pacs-1', courseId: 'crs-pacs-erp-101', order: 1,
      title: 'Introduction to PACS & Digitalization', titleHi: 'पैक्स और डिजिटलाइजेशन का परिचय', titleMr: 'PACS आणि डिजिटलायझेशनचा परिचय',
      lessons: [
        { id: 'les-pacs-1-1', moduleId: 'mod-pacs-1', order: 1, title: 'What is PACS?', titleHi: 'पैक्स क्या है?', titleMr: 'PACS म्हणजे काय?', durationMinutes: 20, contentType: 'text', contentByLanguage: { en: { text: 'Primary Agricultural Credit Societies (PACS) are the smallest unit of the short-term cooperative credit structure in India. They are the primary interface between the cooperative credit system and the rural population.', keyTakeaways: ['PACS are grassroots cooperative credit institutions', 'They provide short-term and medium-term credit to farmers', 'India has over 95,000 PACS across the country'] }, hi: { text: 'प्राथमिक कृषि ऋण सोसायटी (पैक्स) भारत में अल्पकालिक सहकारी ऋण संरचना की सबसे छोटी इकाई हैं।', keyTakeaways: ['पैक्स जमीनी स्तर की सहकारी ऋण संस्थाएं हैं', 'वे किसानों को अल्पकालिक और मध्यकालिक ऋण प्रदान करती हैं'] }, mr: { text: 'प्राथमिक कृषी पतसंस्था (PACS) ह्या भारतातील अल्पकालीन सहकारी पतरचनेच्या सर्वात लहान घटक आहेत.', keyTakeaways: ['PACS या गावपातळीवरील सहकारी पतसंस्था आहेत'] } } },
        { id: 'les-pacs-1-2', moduleId: 'mod-pacs-1', order: 2, title: 'Benefits of PACS Digitalization', titleHi: 'पैक्स डिजिटलाइजेशन के लाभ', titleMr: 'PACS डिजिटलायझेशनचे फायदे', durationMinutes: 25, contentType: 'text', contentByLanguage: { en: { text: 'Digitalization of PACS enables real-time transaction tracking, financial transparency, and integration with national banking systems like CBS (Core Banking Solution).', keyTakeaways: ['Real-time transaction visibility', 'Reduced fraud and errors', 'Integration with national banking infrastructure', 'Faster loan processing'] }, hi: { text: 'पैक्स का डिजिटलीकरण वास्तविक समय लेनदेन ट्रैकिंग सक्षम करता है।', keyTakeaways: ['वास्तविक समय लेनदेन दृश्यता', 'ऋण प्रसंस्करण में तेजी'] }, mr: { text: 'PACS चे डिजिटलीकरण रिअल-टाइम व्यवहार ट्रॅकिंग सक्षम करते.', keyTakeaways: ['रिअल-टाइम व्यवहार दृश्यमानता'] } } },
      ],
      quiz: {
        id: 'quiz-pacs-m1', moduleId: 'mod-pacs-1', title: 'PACS Basics Assessment', titleHi: 'पैक्स मूल्यांकन', titleMr: 'PACS मूल्यांकन', passThreshold: 75,
        questions: [
          { id: 'qq-p1-1', question: 'What does PACS stand for?', questionHi: 'PACS का पूर्ण रूप क्या है?', questionMr: 'PACS चे पूर्ण नाव काय आहे?', options: { en: ['Primary Agricultural Credit Society', 'Primary Agricultural Co-operative Service', 'Public Agricultural Credit Scheme', 'Primary Agricultural Credit Scheme'], hi: ['प्राथमिक कृषि ऋण सोसायटी', 'प्राथमिक कृषि सहकारी सेवा', 'सार्वजनिक कृषि ऋण योजना', 'प्राथमिक कृषि ऋण योजना'], mr: ['प्राथमिक कृषी पतसंस्था', 'प्राथमिक कृषी सहकारी सेवा', 'सार्वजनिक कृषी पत योजना', 'प्राथमिक कृषी पत योजना'] }, correctOptionIndex: 0, explanation: { en: 'PACS stands for Primary Agricultural Credit Society — the grassroots unit of rural cooperative credit.', hi: 'PACS का अर्थ है प्राथमिक कृषि ऋण सोसायटी।', mr: 'PACS म्हणजे प्राथमिक कृषी पतसंस्था.' } },
          { id: 'qq-p1-2', question: 'Which ministry oversees NCCT?', questionHi: 'NCCT किस मंत्रालय के अधीन है?', questionMr: 'NCCT कोणत्या मंत्रालयाच्या अंतर्गत आहे?', options: { en: ['Ministry of Agriculture', 'Ministry of Finance', 'Ministry of Cooperation', 'Ministry of Rural Development'], hi: ['कृषि मंत्रालय', 'वित्त मंत्रालय', 'सहकारिता मंत्रालय', 'ग्रामीण विकास मंत्रालय'], mr: ['कृषी मंत्रालय', 'वित्त मंत्रालय', 'सहकार मंत्रालय', 'ग्रामीण विकास मंत्रालय'] }, correctOptionIndex: 2, explanation: { en: 'NCCT is under the Ministry of Cooperation, established in 2021.', hi: 'NCCT सहकारिता मंत्रालय के अधीन है।', mr: 'NCCT सहकार मंत्रालयाच्या अंतर्गत आहे.' } },
          { id: 'qq-p1-3', question: 'What is the main benefit of PACS computerization?', questionHi: 'पैक्स कम्प्यूटरीकरण का मुख्य लाभ क्या है?', questionMr: 'PACS संगणकीकरणाचा मुख्य फायदा काय आहे?', options: { en: ['Reduces staff count only', 'Enables real-time transaction tracking and financial transparency', 'Moves PACS offices to cities', 'Increases loan interest rates'], hi: ['केवल कर्मचारियों की संख्या कम करता है', 'वास्तविक समय लेनदेन ट्रैकिंग और वित्तीय पारदर्शिता', 'पैक्स कार्यालयों को शहरों में स्थानांतरित करता है', 'ऋण ब्याज दरें बढ़ाता है'], mr: ['केवळ कर्मचारी संख्या कमी करते', 'रिअल-टाइम व्यवहार ट्रॅकिंग आणि आर्थिक पारदर्शकता', 'PACS कार्यालये शहरांत हलवते', 'कर्जाचे व्याज दर वाढवते'] }, correctOptionIndex: 1, explanation: { en: 'Digitalization enables real-time visibility of all transactions, reducing fraud and improving accountability.', hi: 'डिजिटलीकरण से सभी लेनदेन की वास्तविक समय दृश्यता मिलती है।', mr: 'डिजिटलीकरणामुळे सर्व व्यवहारांची रिअल-टाइम दृश्यमानता मिळते.' } },
          { id: 'qq-p1-4', question: 'What does KCC stand for?', questionHi: 'KCC का पूर्ण रूप क्या है?', questionMr: 'KCC चे पूर्ण नाव काय आहे?', options: { en: ['Kisan Credit Card', 'Karnataka Cooperative Corporation', 'Kerala Credit Committee', 'Kisan Cooperative Certificate'], hi: ['किसान क्रेडिट कार्ड', 'कर्नाटक सहकारी निगम', 'केरल ऋण समिति', 'किसान सहकारी प्रमाणपत्र'], mr: ['किसान क्रेडिट कार्ड', 'कर्नाटक सहकारी महामंडळ', 'केरळ पत समिती', 'किसान सहकारी प्रमाणपत्र'] }, correctOptionIndex: 0, explanation: { en: 'KCC (Kisan Credit Card) is a scheme providing short-term formal credit to farmers through cooperative banks.', hi: 'KCC (किसान क्रेडिट कार्ड) किसानों को अल्पकालिक ऋण प्रदान करती है।', mr: 'KCC (किसान क्रेडिट कार्ड) शेतकऱ्यांना अल्पकालीन कर्ज देते.' } },
          { id: 'qq-p1-5', question: 'Which technology enables biometric attendance at NCCT institutes?', questionHi: 'NCCT संस्थानों में बायोमेट्रिक उपस्थिति के लिए कौन सी तकनीक उपयोग की जाती है?', questionMr: 'NCCT संस्थांमध्ये बायोमेट्रिक उपस्थितीसाठी कोणते तंत्रज्ञान वापरले जाते?', options: { en: ['GPS tracking only', 'RFID cards only', 'Face recognition and QR codes', 'Fingerprint only'], hi: ['केवल GPS ट्रैकिंग', 'केवल RFID कार्ड', 'चेहरा पहचान और QR कोड', 'केवल फिंगरप्रिंट'], mr: ['केवळ GPS ट्रॅकिंग', 'केवळ RFID कार्ड', 'चेहरा ओळख आणि QR कोड', 'केवळ फिंगरप्रिंट'] }, correctOptionIndex: 2, explanation: { en: 'VikasSetu uses both Face Recognition (Raspberry Pi kiosk) and QR Code check-in for attendance.', hi: 'सहकार सेतु चेहरा पहचान और QR कोड दोनों का उपयोग करता है।', mr: 'सहकार सेतू चेहरा ओळख आणि QR कोड दोन्ही वापरते.' } },
        ],
      },
    },
    {
      id: 'mod-pacs-2', courseId: 'crs-pacs-erp-101', order: 2,
      title: 'ERP System Operations', titleHi: 'ERP सिस्टम संचालन', titleMr: 'ERP प्रणाली संचालन',
      lessons: [
        { id: 'les-pacs-2-1', moduleId: 'mod-pacs-2', order: 1, title: 'ERP Module Overview', titleHi: 'ERP मॉड्यूल अवलोकन', titleMr: 'ERP मॉड्यूल विहंगावलोकन', durationMinutes: 30, contentType: 'text', contentByLanguage: { en: { text: 'The PACS ERP system integrates Savings & Deposits, Loans & KCC, Procurement, and Analytics modules for unified cooperative management.', keyTakeaways: ['ERP integrates all PACS operations', 'Savings & Deposits module manages member accounts', 'KCC module handles Kisan Credit Card disbursement'] }, hi: { text: 'पैक्स ERP प्रणाली बचत और जमा, ऋण और KCC, खरीद और विश्लेषण मॉड्यूल को एकीकृत करती है।', keyTakeaways: ['ERP सभी PACS संचालन को एकीकृत करता है'] }, mr: { text: 'PACS ERP प्रणाली बचत आणि ठेवी, कर्ज आणि KCC, खरेदी आणि विश्लेषण मॉड्यूल एकत्रित करते.', keyTakeaways: ['ERP सर्व PACS कार्यांना एकत्र करते'] } } },
        { id: 'les-pacs-2-2', moduleId: 'mod-pacs-2', order: 2, title: 'Data Entry & Audit Workflow', titleHi: 'डेटा एंट्री और ऑडिट वर्कफ्लो', titleMr: 'डेटा एंट्री आणि ऑडिट वर्कफ्लो', durationMinutes: 35, contentType: 'text', contentByLanguage: { en: { text: 'Accurate data entry and regular audit workflows are mandatory for PACS compliance under the Multi-State Cooperative Societies Act.', keyTakeaways: ['Annual audit is mandatory for all PACS', 'AMCS handles automated management and control', 'Data entry must follow prescribed formats'] }, hi: { text: 'सटीक डेटा एंट्री और नियमित ऑडिट वर्कफ्लो PACS अनुपालन के लिए अनिवार्य है।', keyTakeaways: ['सभी PACS के लिए वार्षिक ऑडिट अनिवार्य है'] }, mr: { text: 'अचूक डेटा एंट्री आणि नियमित ऑडिट वर्कफ्लो PACS अनुपालनासाठी अनिवार्य आहे.', keyTakeaways: ['सर्व PACS साठी वार्षिक ऑडिट अनिवार्य आहे'] } } },
      ],
      quiz: {
        id: 'quiz-pacs-m2', moduleId: 'mod-pacs-2', title: 'ERP Operations Assessment', titleHi: 'ERP संचालन मूल्यांकन', titleMr: 'ERP संचालन मूल्यांकन', passThreshold: 75,
        questions: [
          { id: 'qq-p2-1', question: 'What does ERP stand for?', questionHi: 'ERP का पूर्ण रूप क्या है?', questionMr: 'ERP चे पूर्ण नाव काय आहे?', options: { en: ['Enterprise Resource Planning', 'Electronic Resource Processing', 'Enterprise Revenue Platform', 'Electronic Reporting Process'], hi: ['उद्यम संसाधन नियोजन', 'इलेक्ट्रॉनिक संसाधन प्रसंस्करण', 'उद्यम राजस्व मंच', 'इलेक्ट्रॉनिक रिपोर्टिंग प्रक्रिया'], mr: ['एंटरप्राइझ रिसोर्स प्लानिंग', 'इलेक्ट्रॉनिक रिसोर्स प्रोसेसिंग', 'एंटरप्राइझ रेव्हेन्यू प्लॅटफॉर्म', 'इलेक्ट्रॉनिक रिपोर्टिंग प्रोसेस'] }, correctOptionIndex: 0, explanation: { en: 'ERP stands for Enterprise Resource Planning — integrated management of core business processes.', hi: 'ERP का अर्थ है उद्यम संसाधन नियोजन।', mr: 'ERP म्हणजे एंटरप्राइझ रिसोर्स प्लानिंग.' } },
          { id: 'qq-p2-2', question: 'In PACS ERP, which module handles member savings accounts?', questionHi: 'PACS ERP में कौन सा मॉड्यूल सदस्य बचत खातों को संभालता है?', questionMr: 'PACS ERP मध्ये कोणता मॉड्यूल सदस्यांच्या बचत खात्यांची काळजी घेतो?', options: { en: ['Procurement Module', 'Savings & Deposits Module', 'Payroll Module', 'Analytics Module'], hi: ['खरीद मॉड्यूल', 'बचत और जमा मॉड्यूल', 'पेरोल मॉड्यूल', 'विश्लेषण मॉड्यूल'], mr: ['खरेदी मॉड्यूल', 'बचत आणि ठेवी मॉड्यूल', 'पेरोल मॉड्यूल', 'विश्लेषण मॉड्यूल'] }, correctOptionIndex: 1, explanation: { en: 'The Savings & Deposits module manages all member savings accounts and fixed deposits.', hi: 'बचत और जमा मॉड्यूल सभी सदस्य बचत खातों का प्रबंधन करता है।', mr: 'बचत आणि ठेवी मॉड्यूल सर्व सदस्य बचत खात्यांचे व्यवस्थापन करते.' } },
          { id: 'qq-p2-3', question: 'What is the standard audit period for PACS?', questionHi: 'PACS के लिए मानक ऑडिट अवधि क्या है?', questionMr: 'PACS साठी मानक ऑडिट कालावधी किती आहे?', options: { en: ['Every 5 years', 'Every 3 years', 'Annually', 'Every 2 years'], hi: ['हर 5 साल', 'हर 3 साल', 'वार्षिक', 'हर 2 साल'], mr: ['दर 5 वर्षांनी', 'दर 3 वर्षांनी', 'वार्षिक', 'दर 2 वर्षांनी'] }, correctOptionIndex: 2, explanation: { en: 'PACS must undergo annual statutory audit under cooperative law.', hi: 'PACS को सहकारी कानून के तहत वार्षिक वैधानिक ऑडिट करानी होती है।', mr: 'PACS ला सहकारी कायद्यानुसार वार्षिक वैधानिक ऑडिट करावी लागते.' } },
          { id: 'qq-p2-4', question: 'What does AMCS stand for in cooperative management?', questionHi: 'सहकारी प्रबंधन में AMCS का अर्थ क्या है?', questionMr: 'सहकारी व्यवस्थापनात AMCS म्हणजे काय?', options: { en: ['Annual Member Collection System', 'Automated Management & Control System', 'Agricultural Marketing Cooperative Society', 'Audit Management Central System'], hi: ['वार्षिक सदस्य संग्रह प्रणाली', 'स्वचालित प्रबंधन और नियंत्रण प्रणाली', 'कृषि विपणन सहकारी समिति', 'ऑडिट प्रबंधन केंद्रीय प्रणाली'], mr: ['वार्षिक सदस्य संकलन प्रणाली', 'ऑटोमेटेड व्यवस्थापन आणि नियंत्रण प्रणाली', 'कृषी विपणन सहकारी संस्था', 'ऑडिट व्यवस्थापन केंद्रीय प्रणाली'] }, correctOptionIndex: 1, explanation: { en: 'AMCS (Automated Management & Control System) is the integrated platform for PACS operations.', hi: 'AMCS (स्वचालित प्रबंधन और नियंत्रण प्रणाली) पैक्स संचालन के लिए एकीकृत मंच है।', mr: 'AMCS (ऑटोमेटेड व्यवस्थापन आणि नियंत्रण प्रणाली) PACS कार्यांसाठी एकात्मिक प्लॅटफॉर्म आहे.' } },
          { id: 'qq-p2-5', question: 'Which act governs Multi-State Cooperative Societies?', questionHi: 'बहु-राज्य सहकारी समितियों को कौन सा अधिनियम नियंत्रित करता है?', questionMr: 'बहु-राज्य सहकारी संस्थांना कोणता कायदा नियंत्रित करतो?', options: { en: ['Companies Act 2013', 'Multi-State Cooperative Societies Act 2002', 'Cooperative Societies Act 1912', 'Banking Regulation Act 1949'], hi: ['कंपनी अधिनियम 2013', 'बहु-राज्य सहकारी समिति अधिनियम 2002', 'सहकारी समिति अधिनियम 1912', 'बैंकिंग विनियमन अधिनियम 1949'], mr: ['कंपनी कायदा 2013', 'बहु-राज्य सहकारी संस्था कायदा 2002', 'सहकारी संस्था कायदा 1912', 'बँकिंग नियमन कायदा 1949'] }, correctOptionIndex: 1, explanation: { en: 'Multi-State Cooperative Societies Act 2002 (MSCS Act) governs cooperatives operating in more than one state.', hi: 'बहु-राज्य सहकारी समिति अधिनियम 2002 एक से अधिक राज्यों में कार्यरत सहकारी समितियों को नियंत्रित करता है।', mr: 'बहु-राज्य सहकारी संस्था कायदा 2002 एकापेक्षा जास्त राज्यांत कार्यरत सहकारी संस्थांना नियंत्रित करतो.' } },
        ],
      },
    },
  ];

  const dairyModules = [
    {
      id: 'mod-dairy-1', courseId: 'crs-dairy-101', order: 1,
      title: 'Dairy Cooperative Structure', titleHi: 'डेयरी सहकारी संरचना', titleMr: 'डेअरी सहकारी रचना',
      lessons: [
        { id: 'les-dairy-1-1', moduleId: 'mod-dairy-1', order: 1, title: 'The Amul Model', titleHi: 'अमूल मॉडल', titleMr: 'अमूल मॉडेल', durationMinutes: 25, contentType: 'text', contentByLanguage: { en: { text: 'The Amul model is a three-tier cooperative structure: Village Dairy Cooperative Societies → District Union → State Federation. It revolutionized milk procurement and processing in India.', keyTakeaways: ['Three-tier structure ensures member benefit', 'Amul model is replicated across India', 'Milk producers are the owners of the cooperative'] }, hi: { text: 'अमूल मॉडल तीन-स्तरीय सहकारी संरचना है।', keyTakeaways: ['तीन-स्तरीय संरचना सदस्य लाभ सुनिश्चित करती है'] }, mr: { text: 'अमूल मॉडेल तीन-स्तरीय सहकारी रचना आहे.', keyTakeaways: ['तीन-स्तरीय रचना सदस्यांचा फायदा सुनिश्चित करते'] } } },
        { id: 'les-dairy-1-2', moduleId: 'mod-dairy-1', order: 2, title: 'Milk Quality Testing', titleHi: 'दूध गुणवत्ता परीक्षण', titleMr: 'दूध गुणवत्ता चाचणी', durationMinutes: 30, contentType: 'text', contentByLanguage: { en: { text: 'Fat (FAT) and Solids Not Fat (SNF) are the two key parameters measured for milk quality and procurement pricing at village collection centers.', keyTakeaways: ['FAT and SNF determine milk price', 'Lactometers and milk analyzers are used', 'Quality testing ensures fair payment to farmers'] }, hi: { text: 'वसा (FAT) और वसा रहित ठोस (SNF) दूध गुणवत्ता के लिए दो प्रमुख मापदंड हैं।', keyTakeaways: ['FAT और SNF दूध की कीमत निर्धारित करते हैं'] }, mr: { text: 'फॅट (FAT) आणि सॉलिड्स नॉट फॅट (SNF) दूध गुणवत्तेचे दोन प्रमुख मापदंड आहेत.', keyTakeaways: ['FAT आणि SNF दुधाची किंमत ठरवतात'] } } },
      ],
      quiz: {
        id: 'quiz-dairy-m1', moduleId: 'mod-dairy-1', title: 'Dairy Cooperative Assessment', titleHi: 'डेयरी सहकारी मूल्यांकन', titleMr: 'डेअरी सहकारी मूल्यांकन', passThreshold: 75,
        questions: [
          { id: 'qq-d1-1', question: 'What is the primary function of a Dairy Cooperative Union?', questionHi: 'डेयरी सहकारी संघ का प्राथमिक कार्य क्या है?', questionMr: 'डेअरी सहकारी संघाचे प्राथमिक कार्य काय आहे?', options: { en: ['Selling fertilizers', 'Procuring, processing and marketing milk and dairy products', 'Managing housing for farmers', 'Providing crop insurance'], hi: ['उर्वरक बेचना', 'दूध और डेयरी उत्पादों की खरीद, प्रसंस्करण और विपणन', 'किसानों के लिए आवास प्रबंधन', 'फसल बीमा प्रदान करना'], mr: ['खते विकणे', 'दूध आणि दुग्धजन्य पदार्थांची खरेदी, प्रक्रिया आणि विपणन', 'शेतकऱ्यांसाठी घरांचे व्यवस्थापन', 'पीक विमा देणे'] }, correctOptionIndex: 1, explanation: { en: 'Dairy Cooperative Unions procure milk from village societies, process it, and market it under brands like Amul.', hi: 'डेयरी सहकारी संघ गांव समितियों से दूध की खरीद करता है।', mr: 'डेअरी सहकारी संघ गाव समित्यांकडून दूध खरेदी करतो.' } },
          { id: 'qq-d1-2', question: 'What does the Amul model represent?', questionHi: 'अमूल मॉडल क्या दर्शाता है?', questionMr: 'अमूल मॉडेल काय दर्शवतो?', options: { en: ['Government-owned dairy company', 'Three-tier cooperative structure for dairy', 'Foreign dairy investment model', 'Single-tier milk procurement'], hi: ['सरकारी स्वामित्व वाली डेयरी कंपनी', 'डेयरी के लिए तीन-स्तरीय सहकारी संरचना', 'विदेशी डेयरी निवेश मॉडल', 'एकल-स्तरीय दूध खरीद'], mr: ['सरकारी मालकीची डेअरी कंपनी', 'डेअरीसाठी तीन-स्तरीय सहकारी रचना', 'परदेशी डेअरी गुंतवणूक मॉडेल', 'एकल-स्तरीय दूध खरेदी'] }, correctOptionIndex: 1, explanation: { en: 'The Amul model is a three-tier structure: village societies → district union → state federation.', hi: 'अमूल मॉडल तीन-स्तरीय संरचना है।', mr: 'अमूल मॉडेल तीन-स्तरीय रचना आहे.' } },
          { id: 'qq-d1-3', question: 'What does SNF stand for in dairy quality testing?', questionHi: 'डेयरी गुणवत्ता परीक्षण में SNF का अर्थ क्या है?', questionMr: 'डेअरी गुणवत्ता चाचणीत SNF म्हणजे काय?', options: { en: ['Sodium Nitrite Factor', 'Solids Not Fat', 'Standardized Nutrition Formula', 'Supply Network Factor'], hi: ['सोडियम नाइट्राइट कारक', 'वसा रहित ठोस', 'मानकीकृत पोषण सूत्र', 'आपूर्ति नेटवर्क कारक'], mr: ['सोडियम नायट्राइट फॅक्टर', 'सॉलिड्स नॉट फॅट', 'स्टँडर्डाइझ्ड न्यूट्रिशन फॉर्म्युला', 'सप्लाय नेटवर्क फॅक्टर'] }, correctOptionIndex: 1, explanation: { en: 'SNF (Solids Not Fat) measures non-fat solid content in milk — a key quality parameter.', hi: 'SNF (वसा रहित ठोस) दूध में गैर-वसा ठोस सामग्री को मापता है।', mr: 'SNF (सॉलिड्स नॉट फॅट) दुधातील नॉन-फॅट घन सामग्री मोजते.' } },
          { id: 'qq-d1-4', question: 'Which scheme supports dairy development through cooperatives?', questionHi: 'कौन सी योजना सहकारी समितियों के माध्यम से डेयरी विकास का समर्थन करती है?', questionMr: 'कोणती योजना सहकारी संस्थांमार्फत डेअरी विकासाला समर्थन देते?', options: { en: ['PM Fasal Bima Yojana', 'National Dairy Development Programme', 'PM Awas Yojana', 'Kisan Samman Nidhi'], hi: ['पीएम फसल बीमा योजना', 'राष्ट्रीय डेयरी विकास कार्यक्रम', 'पीएम आवास योजना', 'किसान सम्मान निधि'], mr: ['PM फसल विमा योजना', 'राष्ट्रीय डेअरी विकास कार्यक्रम', 'PM आवास योजना', 'किसान सन्मान निधी'] }, correctOptionIndex: 1, explanation: { en: 'The National Dairy Development Programme (NDDP) supports dairy cooperative infrastructure development.', hi: 'राष्ट्रीय डेयरी विकास कार्यक्रम (NDDP) डेयरी सहकारी बुनियादी ढांचे का समर्थन करता है।', mr: 'राष्ट्रीय डेअरी विकास कार्यक्रम (NDDP) डेअरी सहकारी पायाभूत सुविधांना समर्थन देतो.' } },
          { id: 'qq-d1-5', question: 'What is a Bulk Milk Cooler (BMC) used for?', questionHi: 'बल्क मिल्क कूलर (BMC) का उपयोग किसके लिए किया जाता है?', questionMr: 'बल्क मिल्क कूलर (BMC) कशासाठी वापरले जाते?', options: { en: ['Heating milk for pasteurization', 'Chilling raw milk at collection point to prevent spoilage', 'Packaging milk in bottles', 'Testing milk fat content'], hi: ['पाश्चुरीकरण के लिए दूध गर्म करना', 'खराब होने से बचाने के लिए संग्रह बिंदु पर कच्चे दूध को ठंडा करना', 'बोतलों में दूध पैकेजिंग', 'दूध वसा सामग्री का परीक्षण'], mr: ['पाश्चरायझेशनसाठी दूध गरम करणे', 'खराब होण्यापासून रोखण्यासाठी संकलन बिंदूवर कच्चे दूध थंड करणे', 'बाटल्यांमध्ये दूध पॅकेजिंग', 'दूध फॅट सामग्री चाचणी'] }, correctOptionIndex: 1, explanation: { en: 'BMC chills raw milk immediately after collection to below 4°C to prevent bacterial growth during transport.', hi: 'BMC संग्रह के तुरंत बाद कच्चे दूध को ठंडा करता है।', mr: 'BMC संकलनानंतर लगेच कच्चे दूध थंड करते.' } },
        ],
      },
    },
  ];

  const shgModules = [
    {
      id: 'mod-shg-1', courseId: 'crs-shg-101', order: 1,
      title: 'SHG Basics & Governance', titleHi: 'SHG मूल बातें और शासन', titleMr: 'SHG मूलतत्त्वे आणि प्रशासन',
      lessons: [
        { id: 'les-shg-1-1', moduleId: 'mod-shg-1', order: 1, title: 'What is a Self-Help Group?', titleHi: 'स्वयं सहायता समूह क्या है?', titleMr: 'स्वयं-सहाय्यता गट म्हणजे काय?', durationMinutes: 20, contentType: 'text', contentByLanguage: { en: { text: 'A Self-Help Group (SHG) is a small voluntary association of 10-20 people, typically from the same socio-economic background, who pool savings and access microfinance.', keyTakeaways: ['SHGs have 10-20 members', 'Members pool savings regularly', 'SHGs promote financial inclusion for rural women'] }, hi: { text: 'स्वयं सहायता समूह (SHG) 10-20 लोगों का स्वैच्छिक संगठन है।', keyTakeaways: ['SHG में 10-20 सदस्य होते हैं'] }, mr: { text: 'स्वयं-सहाय्यता गट (SHG) 10-20 लोकांचा स्वैच्छिक संघटन आहे.', keyTakeaways: ['SHG मध्ये 10-20 सदस्य असतात'] } } },
        { id: 'les-shg-1-2', moduleId: 'mod-shg-1', order: 2, title: 'DAY-NRLM Linkage', titleHi: 'DAY-NRLM संबंध', titleMr: 'DAY-NRLM जोडणी', durationMinutes: 25, contentType: 'text', contentByLanguage: { en: { text: 'Deen Dayal Antyodaya Yojana - National Rural Livelihoods Mission (DAY-NRLM) is India\'s flagship programme linking SHGs to formal banking institutions.', keyTakeaways: ['DAY-NRLM links SHGs to banks', 'Credit Guarantee Fund provides security', 'Revolving fund supports SHG activities'] }, hi: { text: 'DAY-NRLM भारत का प्रमुख कार्यक्रम है जो SHG को बैंकों से जोड़ता है।', keyTakeaways: ['DAY-NRLM SHG को बैंकों से जोड़ता है'] }, mr: { text: 'DAY-NRLM हा भारताचा प्रमुख कार्यक्रम आहे जो SHG ला बँकांशी जोडतो.', keyTakeaways: ['DAY-NRLM SHG ला बँकांशी जोडतो'] } } },
      ],
      quiz: {
        id: 'quiz-shg-m1', moduleId: 'mod-shg-1', title: 'SHG Governance Assessment', titleHi: 'SHG शासन मूल्यांकन', titleMr: 'SHG प्रशासन मूल्यांकन', passThreshold: 75,
        questions: [
          { id: 'qq-s1-1', question: 'What does SHG stand for?', questionHi: 'SHG का पूर्ण रूप क्या है?', questionMr: 'SHG चे पूर्ण नाव काय आहे?', options: { en: ['Savings & Help Group', 'Self-Help Group', 'Society for Housing Growth', 'Sustainable Harvest Group'], hi: ['बचत और सहायता समूह', 'स्वयं सहायता समूह', 'आवास विकास समिति', 'सतत फसल समूह'], mr: ['बचत आणि सहाय्य गट', 'स्वयं-सहाय्यता गट', 'गृहनिर्माण विकास संस्था', 'शाश्वत कापणी गट'] }, correctOptionIndex: 1, explanation: { en: 'SHG stands for Self-Help Group — voluntary associations for mutual savings and microfinance.', hi: 'SHG का अर्थ है स्वयं सहायता समूह।', mr: 'SHG म्हणजे स्वयं-सहाय्यता गट.' } },
          { id: 'qq-s1-2', question: 'What is the typical size of a Self-Help Group?', questionHi: 'स्वयं सहायता समूह का सामान्य आकार क्या होता है?', questionMr: 'स्वयं-सहाय्यता गटाचा सामान्य आकार किती असतो?', options: { en: ['50-100 members', '10-20 members', '200-500 members', '2-5 members'], hi: ['50-100 सदस्य', '10-20 सदस्य', '200-500 सदस्य', '2-5 सदस्य'], mr: ['50-100 सदस्य', '10-20 सदस्य', '200-500 सदस्य', '2-5 सदस्य'] }, correctOptionIndex: 1, explanation: { en: 'A standard SHG has 10-20 members from similar socio-economic backgrounds.', hi: 'एक मानक SHG में 10-20 सदस्य होते हैं।', mr: 'एका मानक SHG मध्ये 10-20 सदस्य असतात.' } },
          { id: 'qq-s1-3', question: 'Which government programme links SHGs to banks?', questionHi: 'कौन सा सरकारी कार्यक्रम SHG को बैंकों से जोड़ता है?', questionMr: 'कोणता सरकारी कार्यक्रम SHG ला बँकांशी जोडतो?', options: { en: ['PM Mudra Yojana only', 'Deen Dayal Antyodaya Yojana (DAY-NRLM)', 'PM Kisan', 'MGNREGA'], hi: ['केवल पीएम मुद्रा योजना', 'दीन दयाल अंत्योदय योजना (DAY-NRLM)', 'पीएम किसान', 'मनरेगा'], mr: ['केवळ PM मुद्रा योजना', 'दीन दयाल अंत्योदय योजना (DAY-NRLM)', 'PM किसान', 'मनरेगा'] }, correctOptionIndex: 1, explanation: { en: 'DAY-NRLM (Deen Dayal Antyodaya Yojana - National Rural Livelihoods Mission) is India\'s flagship SHG-bank linkage program.', hi: 'DAY-NRLM भारत का प्रमुख SHG-बैंक संबंध कार्यक्रम है।', mr: 'DAY-NRLM हा भारताचा प्रमुख SHG-बँक जोडणी कार्यक्रम आहे.' } },
          { id: 'qq-s1-4', question: 'What is "thrift" in an SHG context?', questionHi: 'SHG संदर्भ में "बचत" क्या है?', questionMr: 'SHG संदर्भात "बचत" म्हणजे काय?', options: { en: ['Large bank loan', 'Regular small savings by members', 'Government subsidy', 'Insurance premium'], hi: ['बड़ा बैंक ऋण', 'सदस्यों द्वारा नियमित छोटी बचत', 'सरकारी सब्सिडी', 'बीमा प्रीमियम'], mr: ['मोठे बँक कर्ज', 'सदस्यांद्वारे नियमित लहान बचत', 'सरकारी अनुदान', 'विमा प्रीमियम'] }, correctOptionIndex: 1, explanation: { en: 'Thrift refers to the regular small savings pooled by SHG members — the foundation of group microfinance.', hi: 'बचत SHG सदस्यों द्वारा नियमित छोटी बचत को संदर्भित करती है।', mr: 'बचत म्हणजे SHG सदस्यांद्वारे केलेली नियमित लहान बचत.' } },
          { id: 'qq-s1-5', question: 'What is "group lending" in microfinance?', questionHi: 'माइक्रोफाइनेंस में "समूह ऋण" क्या है?', questionMr: 'मायक्रोफायनान्समध्ये "गट कर्ज" म्हणजे काय?', options: { en: ['Loans given only to group leaders', 'Individual loans with group guarantee for repayment', 'Government grants to groups', 'Corporate loans to SHGs'], hi: ['केवल समूह नेताओं को ऋण', 'समूह गारंटी के साथ व्यक्तिगत ऋण', 'समूहों को सरकारी अनुदान', 'SHG को कॉर्पोरेट ऋण'], mr: ['केवळ गट नेत्यांना कर्ज', 'गट हमीसह वैयक्तिक कर्ज', 'गटांना सरकारी अनुदान', 'SHG ला कॉर्पोरेट कर्ज'] }, correctOptionIndex: 1, explanation: { en: 'Group lending means individual members receive loans backed by peer group guarantee and accountability.', hi: 'समूह ऋण का अर्थ है सदस्यों को साथियों की गारंटी के साथ ऋण मिलता है।', mr: 'गट कर्ज म्हणजे सदस्यांना समूहाच्या हमीसह कर्ज मिळते.' } },
        ],
      },
    },
  ];

  const courses = [
    { id: 'crs-pacs-erp-101', title: 'PACS Computerization & ERP Operations', titleHi: 'पैक्स कम्प्यूटरीकरण और ERP संचालन', titleMr: 'PACS संगणकीकरण आणि ERP संचालन', description: 'Comprehensive training on computerizing Primary Agricultural Credit Societies and operating the integrated ERP system for efficient cooperative management.', descriptionHi: 'प्राथमिक कृषि ऋण समितियों के कम्प्यूटरीकरण और एकीकृत ERP प्रणाली के संचालन पर व्यापक प्रशिक्षण।', descriptionMr: 'प्राथमिक कृषी पतसंस्थांच्या संगणकीकरण आणि एकात्मिक ERP प्रणालीच्या संचालनावर सर्वसमावेशक प्रशिक्षण.', thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&auto=format&fit=crop&q=80', instituteId: 'inst-vamnicom', durationHours: 40, level: 'Intermediate', category: 'PACS Digitalization', modulesJson: pacsModules },
    { id: 'crs-dairy-101', title: 'Dairy & Livestock Cooperative Management', titleHi: 'डेयरी और पशुधन सहकारी प्रबंधन', titleMr: 'डेअरी आणि पशुधन सहकारी व्यवस्थापन', description: 'Covers the full value chain of dairy cooperatives — from milk procurement and quality testing to processing and marketing using the Amul cooperative model.', descriptionHi: 'डेयरी सहकारी समितियों की पूर्ण मूल्य श्रृंखला को कवर करता है।', descriptionMr: 'डेअरी सहकारी संस्थांची संपूर्ण मूल्य साखळी समाविष्ट करते.', thumbnail: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=400&auto=format&fit=crop&q=80', instituteId: 'inst-ricm-blr', durationHours: 32, level: 'Beginner', category: 'Dairy & Livestock', modulesJson: dairyModules },
    { id: 'crs-shg-101', title: 'SHG Governance & Microfinance', titleHi: 'SHG शासन और माइक्रोफाइनेंस', titleMr: 'SHG प्रशासन आणि मायक्रोफायनान्स', description: 'Training on Self-Help Group governance, group-bank linkage under DAY-NRLM, thrift management, and microfinance principles for rural financial inclusion.', descriptionHi: 'स्वयं सहायता समूह प्रशासन, DAY-NRLM के तहत समूह-बैंक संबंध पर प्रशिक्षण।', descriptionMr: 'स्वयं-सहाय्यता गट प्रशासन, DAY-NRLM अंतर्गत गट-बँक जोडणीवर प्रशिक्षण.', thumbnail: 'https://images.unsplash.com/photo-1573497491765-dccce02b29df?w=400&auto=format&fit=crop&q=80', instituteId: 'inst-icm-lko', durationHours: 28, level: 'Beginner', category: 'SHG Governance', modulesJson: shgModules },
  ];

  for (const c of courses) {
    await prisma.course.upsert({ where: { id: c.id }, update: c, create: c as any });
  }
  console.log('  ✓ 3 courses with module/quiz JSON');

  // ─── Session (active — for attendance QR demo) ─────────────────────────────
  const session = {
    id: 'sess-vam-001',
    programmeId: 'prog-pacs-2026',
    title: 'Lab Session: Live Day-Open, Ledger Reconciliation & KCC Posting',
    instructor: 'Prof. Meenakshi Sundaram',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '10:00 AM – 01:00 PM',
    room: 'Smart Computer Lab 2 (VAMNICOM Academic Block)',
    qrToken: 'QR-VAMNICOM-SESS-2026-001',
    active: true,
  };
  await prisma.session.upsert({ where: { id: session.id }, update: session, create: session });
  console.log('  ✓ 1 active session');

  // ─── Enrollments — all trainees across all courses ─────────────────────────
  // Each row: real progress, real status, real enrolled date.
  // Faculty Courses page derives enrolledCount, completionRate, quizPassRate
  // from these database rows — no frontend hardcoding needed.
  const enrollments = [
    // ── Rameshwar Patil (trainee-1) ──
    { id: 'enr-t1-pacs101',   userId: 'usr-trainee-1', courseId: 'crs-pacs-erp-101',   progressPercent: 100, completedLessonIds: ['les-pacs-1-1','les-pacs-1-2','les-pacs-2-1','les-pacs-2-2'], completedQuizIds: ['quiz-pacs-m1','quiz-pacs-m2'], status: 'completed',   enrolledDate: '2026-01-10' },
    { id: 'enr-t1-dairy101',  userId: 'usr-trainee-1', courseId: 'crs-dairy-101',       progressPercent: 100, completedLessonIds: ['les-dairy-1-1','les-dairy-1-2'], completedQuizIds: ['quiz-dairy-m1'], status: 'completed',   enrolledDate: '2026-01-15' },
    { id: 'enr-t1-shg101',    userId: 'usr-trainee-1', courseId: 'crs-shg-101',         progressPercent:  75, completedLessonIds: ['les-shg-1-1'], completedQuizIds: [], status: 'in_progress', enrolledDate: '2026-02-01' },
    { id: 'enr-t1-pacs101b',  userId: 'usr-trainee-1', courseId: 'crs-pacs-101',        progressPercent:  85, completedLessonIds: [], completedQuizIds: [], status: 'in_progress', enrolledDate: '2026-02-10' },
    { id: 'enr-t1-dairy201',  userId: 'usr-trainee-1', courseId: 'crs-dairy-mgmt-201',  progressPercent:  60, completedLessonIds: [], completedQuizIds: [], status: 'in_progress', enrolledDate: '2026-03-01' },
    { id: 'enr-t1-shg301',    userId: 'usr-trainee-1', courseId: 'crs-shg-gov-301',     progressPercent:  40, completedLessonIds: [], completedQuizIds: [], status: 'in_progress', enrolledDate: '2026-03-10' },

    // ── Sunita Devi (trainee-2) ──
    { id: 'enr-t2-shg101',    userId: 'usr-trainee-2', courseId: 'crs-shg-101',         progressPercent: 100, completedLessonIds: ['les-shg-1-1','les-shg-1-2'], completedQuizIds: ['quiz-shg-m1'], status: 'completed',   enrolledDate: '2026-01-20' },
    { id: 'enr-t2-shg301',    userId: 'usr-trainee-2', courseId: 'crs-shg-gov-301',     progressPercent: 100, completedLessonIds: [], completedQuizIds: [], status: 'completed',   enrolledDate: '2026-02-05' },
    { id: 'enr-t2-pacs101',   userId: 'usr-trainee-2', courseId: 'crs-pacs-erp-101',   progressPercent:  50, completedLessonIds: ['les-pacs-1-1'], completedQuizIds: [], status: 'in_progress', enrolledDate: '2026-02-20' },
    { id: 'enr-t2-dairy101',  userId: 'usr-trainee-2', courseId: 'crs-dairy-101',       progressPercent:  30, completedLessonIds: [], completedQuizIds: [], status: 'in_progress', enrolledDate: '2026-03-05' },

    // ── Ganesh Shinde (trainee-3) ──
    { id: 'enr-t3-dairy101',  userId: 'usr-trainee-3', courseId: 'crs-dairy-101',       progressPercent: 100, completedLessonIds: ['les-dairy-1-1','les-dairy-1-2'], completedQuizIds: ['quiz-dairy-m1'], status: 'completed',   enrolledDate: '2026-01-12' },
    { id: 'enr-t3-dairy201',  userId: 'usr-trainee-3', courseId: 'crs-dairy-mgmt-201',  progressPercent:  90, completedLessonIds: [], completedQuizIds: [], status: 'in_progress', enrolledDate: '2026-02-01' },
    { id: 'enr-t3-pacs101',   userId: 'usr-trainee-3', courseId: 'crs-pacs-erp-101',   progressPercent:  70, completedLessonIds: ['les-pacs-1-1','les-pacs-1-2'], completedQuizIds: ['quiz-pacs-m1'], status: 'in_progress', enrolledDate: '2026-02-15' },
    { id: 'enr-t3-shg101',    userId: 'usr-trainee-3', courseId: 'crs-shg-101',         progressPercent:  45, completedLessonIds: [], completedQuizIds: [], status: 'in_progress', enrolledDate: '2026-03-01' },

    // ── Anjali Sharma (trainee-4) ──
    { id: 'enr-t4-pacs101',   userId: 'usr-trainee-4', courseId: 'crs-pacs-erp-101',   progressPercent: 100, completedLessonIds: ['les-pacs-1-1','les-pacs-1-2','les-pacs-2-1','les-pacs-2-2'], completedQuizIds: ['quiz-pacs-m1','quiz-pacs-m2'], status: 'completed',   enrolledDate: '2026-01-18' },
    { id: 'enr-t4-shg101',    userId: 'usr-trainee-4', courseId: 'crs-shg-101',         progressPercent:  80, completedLessonIds: ['les-shg-1-1','les-shg-1-2'], completedQuizIds: ['quiz-shg-m1'], status: 'in_progress', enrolledDate: '2026-02-10' },
    { id: 'enr-t4-pacs101b',  userId: 'usr-trainee-4', courseId: 'crs-pacs-101',        progressPercent:  65, completedLessonIds: [], completedQuizIds: [], status: 'in_progress', enrolledDate: '2026-03-01' },
    { id: 'enr-t4-dairy101',  userId: 'usr-trainee-4', courseId: 'crs-dairy-101',       progressPercent:  55, completedLessonIds: [], completedQuizIds: [], status: 'in_progress', enrolledDate: '2026-03-15' },

    // ── Manoj Kumar Nayak (trainee-5) ──
    { id: 'enr-t5-pacs101',   userId: 'usr-trainee-5', courseId: 'crs-pacs-erp-101',   progressPercent:  85, completedLessonIds: ['les-pacs-1-1','les-pacs-1-2','les-pacs-2-1'], completedQuizIds: ['quiz-pacs-m1'], status: 'in_progress', enrolledDate: '2026-01-25' },
    { id: 'enr-t5-pacs101b',  userId: 'usr-trainee-5', courseId: 'crs-pacs-101',        progressPercent: 100, completedLessonIds: [], completedQuizIds: [], status: 'completed',   enrolledDate: '2026-02-05' },
    { id: 'enr-t5-dairy201',  userId: 'usr-trainee-5', courseId: 'crs-dairy-mgmt-201',  progressPercent:  35, completedLessonIds: [], completedQuizIds: [], status: 'in_progress', enrolledDate: '2026-03-01' },

    // ── Kavita Jadhav (trainee-6) ──
    { id: 'enr-t6-shg101',    userId: 'usr-trainee-6', courseId: 'crs-shg-101',         progressPercent: 100, completedLessonIds: ['les-shg-1-1','les-shg-1-2'], completedQuizIds: ['quiz-shg-m1'], status: 'completed',   enrolledDate: '2026-01-22' },
    { id: 'enr-t6-shg301',    userId: 'usr-trainee-6', courseId: 'crs-shg-gov-301',     progressPercent: 100, completedLessonIds: [], completedQuizIds: [], status: 'completed',   enrolledDate: '2026-02-08' },
    { id: 'enr-t6-pacs101',   userId: 'usr-trainee-6', courseId: 'crs-pacs-erp-101',   progressPercent:  60, completedLessonIds: ['les-pacs-1-1','les-pacs-1-2'], completedQuizIds: ['quiz-pacs-m1'], status: 'in_progress', enrolledDate: '2026-02-25' },
    { id: 'enr-t6-dairy101',  userId: 'usr-trainee-6', courseId: 'crs-dairy-101',       progressPercent:  20, completedLessonIds: [], completedQuizIds: [], status: 'in_progress', enrolledDate: '2026-03-10' },
  ];
  for (const e of enrollments) {
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: e.userId, courseId: e.courseId } },
      update: e,
      create: e as any,
    });
  }
  console.log(`  ✓ ${enrollments.length} enrollments (6 trainees × 6 courses)`);

  // ─── Quiz Attempts — real pass/fail records per trainee ────────────────────
  // These drive the Faculty Dashboard quizPassRate and per-course completionRate
  // moduleId: which module the quiz belongs to
  // enrollmentId: links to the enrollment row (userId_courseId)
  const quizAttempts = [
    // Rameshwar (t1) — PACS ERP 101
    { id: 'qa-t1-pacs-m1',    userId: 'usr-trainee-1', courseId: 'crs-pacs-erp-101',  quizId: 'quiz-pacs-m1',   moduleId: 'mod-pacs-1',  enrollmentId: 'enr-t1-pacs101',  totalQuestions: 5, correctAnswers: 5, score: 92, percentage: 92, passed: true,  attemptNumber: 1 },
    { id: 'qa-t1-pacs-m2',    userId: 'usr-trainee-1', courseId: 'crs-pacs-erp-101',  quizId: 'quiz-pacs-m2',   moduleId: 'mod-pacs-2',  enrollmentId: 'enr-t1-pacs101',  totalQuestions: 5, correctAnswers: 4, score: 88, percentage: 88, passed: true,  attemptNumber: 1 },
    { id: 'qa-t1-dairy-m1',   userId: 'usr-trainee-1', courseId: 'crs-dairy-101',      quizId: 'quiz-dairy-m1',  moduleId: 'mod-dairy-1', enrollmentId: 'enr-t1-dairy101', totalQuestions: 5, correctAnswers: 5, score: 96, percentage: 96, passed: true,  attemptNumber: 1 },

    // Sunita (t2) — SHG 101
    { id: 'qa-t2-shg-m1',     userId: 'usr-trainee-2', courseId: 'crs-shg-101',        quizId: 'quiz-shg-m1',    moduleId: 'mod-shg-1',   enrollmentId: 'enr-t2-shg101',   totalQuestions: 5, correctAnswers: 5, score: 95, percentage: 95, passed: true,  attemptNumber: 1 },
    { id: 'qa-t2-pacs-m1',    userId: 'usr-trainee-2', courseId: 'crs-pacs-erp-101',  quizId: 'quiz-pacs-m1',   moduleId: 'mod-pacs-1',  enrollmentId: 'enr-t2-pacs101',  totalQuestions: 5, correctAnswers: 3, score: 60, percentage: 60, passed: false, attemptNumber: 1 },

    // Ganesh (t3) — Dairy 101
    { id: 'qa-t3-dairy-m1',   userId: 'usr-trainee-3', courseId: 'crs-dairy-101',      quizId: 'quiz-dairy-m1',  moduleId: 'mod-dairy-1', enrollmentId: 'enr-t3-dairy101', totalQuestions: 5, correctAnswers: 5, score: 94, percentage: 94, passed: true,  attemptNumber: 1 },
    { id: 'qa-t3-pacs-m1',    userId: 'usr-trainee-3', courseId: 'crs-pacs-erp-101',  quizId: 'quiz-pacs-m1',   moduleId: 'mod-pacs-1',  enrollmentId: 'enr-t3-pacs101',  totalQuestions: 5, correctAnswers: 4, score: 80, percentage: 80, passed: true,  attemptNumber: 1 },

    // Anjali (t4) — PACS ERP 101 + SHG
    { id: 'qa-t4-pacs-m1',    userId: 'usr-trainee-4', courseId: 'crs-pacs-erp-101',  quizId: 'quiz-pacs-m1',   moduleId: 'mod-pacs-1',  enrollmentId: 'enr-t4-pacs101',  totalQuestions: 5, correctAnswers: 4, score: 88, percentage: 88, passed: true,  attemptNumber: 1 },
    { id: 'qa-t4-pacs-m2',    userId: 'usr-trainee-4', courseId: 'crs-pacs-erp-101',  quizId: 'quiz-pacs-m2',   moduleId: 'mod-pacs-2',  enrollmentId: 'enr-t4-pacs101',  totalQuestions: 5, correctAnswers: 4, score: 84, percentage: 84, passed: true,  attemptNumber: 1 },
    { id: 'qa-t4-shg-m1',     userId: 'usr-trainee-4', courseId: 'crs-shg-101',        quizId: 'quiz-shg-m1',    moduleId: 'mod-shg-1',   enrollmentId: 'enr-t4-shg101',   totalQuestions: 5, correctAnswers: 4, score: 88, percentage: 88, passed: true,  attemptNumber: 1 },

    // Manoj (t5) — PACS ERP 101 (failed then passed)
    { id: 'qa-t5-pacs-m1-f',  userId: 'usr-trainee-5', courseId: 'crs-pacs-erp-101',  quizId: 'quiz-pacs-m1',   moduleId: 'mod-pacs-1',  enrollmentId: 'enr-t5-pacs101',  totalQuestions: 5, correctAnswers: 3, score: 72, percentage: 72, passed: false, attemptNumber: 1 },
    { id: 'qa-t5-pacs-m1-p',  userId: 'usr-trainee-5', courseId: 'crs-pacs-erp-101',  quizId: 'quiz-pacs-m1',   moduleId: 'mod-pacs-1',  enrollmentId: 'enr-t5-pacs101',  totalQuestions: 5, correctAnswers: 4, score: 84, percentage: 84, passed: true,  attemptNumber: 2 },

    // Kavita (t6) — SHG + PACS ERP
    { id: 'qa-t6-shg-m1',     userId: 'usr-trainee-6', courseId: 'crs-shg-101',        quizId: 'quiz-shg-m1',    moduleId: 'mod-shg-1',   enrollmentId: 'enr-t6-shg101',   totalQuestions: 5, correctAnswers: 5, score: 90, percentage: 90, passed: true,  attemptNumber: 1 },
    { id: 'qa-t6-pacs-m1',    userId: 'usr-trainee-6', courseId: 'crs-pacs-erp-101',  quizId: 'quiz-pacs-m1',   moduleId: 'mod-pacs-1',  enrollmentId: 'enr-t6-pacs101',  totalQuestions: 5, correctAnswers: 4, score: 80, percentage: 80, passed: true,  attemptNumber: 1 },
  ];
  for (const qa of quizAttempts) {
    await prisma.quizAttempt.upsert({
      where: { id: qa.id },
      update: qa,
      create: qa as any,
    });
  }
  console.log(`  ✓ ${quizAttempts.length} quiz attempts (realistic pass/fail distribution)`);


  // ─── Certificate for Rameshwar (PACS completion) ──────────────────────────
  const cert = {
    id: 'NCCT-CERT-2026-VAM-0089',
    userId: 'usr-trainee-1',
    userName: 'Rameshwar Patil',
    userAadhaarMock: 'XXXX-XXXX-4589',
    courseId: 'crs-dairy-101',
    courseTitle: 'Dairy & Livestock Cooperative Management',
    courseTitleHi: 'डेयरी और पशुधन सहकारी प्रबंधन',
    instituteId: 'inst-vamnicom',
    instituteName: 'VAMNICOM (Vaikunth Mehta National Institute of Cooperative Management)',
    issuedDate: '2026-07-15',
    certificateHash: '0x3f8e2a1b9c4d7e6f0a5b2c8d1e4f7a3b6c9d2e5f8a1b4c7d0e3f6a9b2c5d8e1f4a7',
    grade: 'First Class',
  };
  await prisma.certificate.upsert({
    where: { userId_courseId: { userId: cert.userId, courseId: cert.courseId } },
    update: cert,
    create: cert,
  });
  console.log('  ✓ 1 certificate (Rameshwar — Dairy course)');

  // ─── Job postings ──────────────────────────────────────────────────────────
  const jobs = [
    {
      id: 'job-001',
      employerId: 'usr-employer-amul',
      employerName: 'Gujarat Cooperative Milk Marketing Federation (GCMMF / AMUL)',
      employerLogo: 'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?w=80&auto=format&fit=crop&q=80',
      title: 'Assistant Milk Procurement & AMCS Officer',
      description: 'Responsible for overseeing 15 village-level Automatic Milk Collection Stations (AMCS), maintaining FAT/SNF calibration standards, and ensuring clean cold chain logistics to district chilling centres.',
      requiredSkills: ['Dairy Cold Chain', 'AMCS Operations', 'FAT/SNF Testing', 'Milk Procurement'],
      preferredSkills: ['NDDB Standards', 'Dairy ERP'],
      requiredQualification: 'Graduation / Diploma (B.Com / B.Sc / Dairy Diploma)',
      minimumExperience: 0,
      requiredCertificates: ['Dairy Cooperative Management', 'Dairy & Livestock Cooperative Management'],
      location: 'Anand / Vadodara, Gujarat',
      salaryRange: '₹3.2 - ₹4.5 Lakh / annum',
      type: 'Full-time',
      postedDate: '2026-02-25',
      openingsCount: 12,
      status: 'ACTIVE',
    },
    {
      id: 'job-002',
      employerId: 'usr-employer-amul',
      employerName: 'Gujarat Cooperative Milk Marketing Federation (GCMMF / AMUL)',
      employerLogo: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=80&auto=format&fit=crop&q=80',
      title: 'PACS Digital Business Associate (CSC & Dairy Network)',
      description: 'Drive milk society ERP integration, supply chain digitization, and manage PACS-to-Dairy cooperative touchpoints across regional chilling units.',
      requiredSkills: ['PACS Digitalization', 'AMCS Operations', 'Dairy ERP', 'KCC Accounting'],
      preferredSkills: ['Double-Entry ERP', 'CSC Operations'],
      requiredQualification: 'Graduation / Diploma / B.Com / BCA',
      minimumExperience: 0,
      requiredCertificates: ['PACS Computerization & ERP Operations'],
      location: 'Anand / Surat, Gujarat',
      salaryRange: '₹2.8 - ₹3.8 Lakh / annum',
      type: 'Full-time',
      postedDate: '2026-02-28',
      openingsCount: 20,
      status: 'ACTIVE',
    },
    {
      id: 'job-003',
      employerId: 'usr-employer-amul',
      employerName: 'Gujarat Cooperative Milk Marketing Federation (GCMMF / AMUL)',
      employerLogo: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=80&auto=format&fit=crop&q=80',
      title: 'Cooperative Banking & PACS Credit Auditor Trainee',
      description: 'Assist in statutory inspection, KCC interest subvention reconciliation, and computerized ledger verification across DCCB branches and primary credit societies.',
      requiredSkills: ['KCC Management', 'Cooperative Audit', 'Double-Entry ERP', 'NABARD Guidelines'],
      preferredSkills: ['Statutory Inspection', 'Banking Regulations'],
      requiredQualification: 'B.Com / M.Com / Cooperative Diploma / CA Inter',
      minimumExperience: 1,
      requiredCertificates: ['Cooperative Banking & Audit'],
      location: 'Pune / Nashik, Maharashtra',
      salaryRange: '₹25,000 / month (Apprenticeship)',
      type: 'Apprenticeship',
      postedDate: '2026-03-01',
      openingsCount: 8,
      status: 'ACTIVE',
    },
  ];
  for (const j of jobs) {
    await prisma.jobPosting.upsert({ where: { id: j.id }, update: j, create: j as any });
  }
  console.log('  ✓ 3 job postings (GCMMF / AMUL & Banking)');

  // ─── Notifications for Rameshwar ──────────────────────────────────────────
  const notifications = [
    { id: 'notif-001', userId: 'usr-trainee-1', title: 'Certificate Issued! 🎓', message: 'Congratulations! Your certificate for "Dairy & Livestock Cooperative Management" has been issued by VAMNICOM.', timestamp: '2026-07-15T10:30:00.000Z', isRead: true, type: 'certificate', linkView: 'certificates' },
    { id: 'notif-002', userId: 'usr-trainee-1', title: 'New Job Posted 💼', message: 'PACS ERP Data Entry Operator opening at Karnataka Cooperative Milk Producers Federation (KMF). Apply now!', timestamp: '2026-09-01T09:00:00.000Z', isRead: false, type: 'job', linkView: 'jobs' },
    { id: 'notif-003', userId: 'usr-trainee-1', title: 'Session Tomorrow 📅', message: 'Reminder: "Lab Session: Live Day-Open, Ledger Reconciliation & KCC Posting" is scheduled tomorrow at 10:00 AM in Smart Computer Lab 2.', timestamp: '2026-09-06T18:00:00.000Z', isRead: false, type: 'attendance', linkView: 'attendance_kiosk' },
  ];
  for (const n of notifications) {
    await prisma.appNotification.upsert({ where: { id: n.id }, update: n, create: n });
  }
  console.log('  ✓ 3 notifications for Rameshwar');

  // ─── NCCT Digital Skill Card for Rameshwar (demo trainee) ─────────────────
  await prisma.traineePublicProfile.upsert({
    where: { userId: 'usr-trainee-1' },
    update: {
      publicToken: 'token-rameshwar-2026',
      registrationId: 'NCCT-TRN-2026-MH-44091',
      isActive: true,
    },
    create: {
      id: 'prof-rameshwar-001',
      userId: 'usr-trainee-1',
      publicToken: 'token-rameshwar-2026',
      registrationId: 'NCCT-TRN-2026-MH-44091',
      isActive: true,
    },
  });
  console.log('  ✓ 1 NCCT Digital Skill Card profile (Rameshwar Patil)');

  // ─── NCCT Programmes, Batches, Eligibility, TimeSlots & Vault ────────────
  await seedProgrammesAndVault();

  console.log('\n✅  Seed complete — all demo data loaded into Supabase.');
}

main()
  .catch(e => { console.error('❌  Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
