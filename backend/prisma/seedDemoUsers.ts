import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();
const SALT = 10;

async function run() {
  try {
    console.log('Upserting test database users...');

    const [pwTrainee, pwAdmin, pwSuper, pwFaculty, pwEmployer] = await Promise.all([
      bcrypt.hash('Demo@1234', SALT),
      bcrypt.hash('Admin@1234', SALT),
      bcrypt.hash('Super@1234', SALT),
      bcrypt.hash('Faculty@1234', SALT),
      bcrypt.hash('Employer@1234', SALT),
    ]);

    const usersToUpsert = [
      // Trainee
      {
        id: 'usr-trainee-1',
        email: 'rameshwar.pacs@gmail.com',
        employeeId: 'NCCT-TRN-2026-MH-44091',
        passwordHash: pwTrainee,
        name: 'Rameshwar Patil',
        nameHi: 'रामेश्वर पाटिल',
        phone: '+91 98234 11223',
        role: 'trainee',
        languagePreference: 'en',
        instituteId: 'inst-vamnicom',
        cooperativeAffiliation: 'Shri Datta PACS, Niphad, Nashik',
        isKycVerified: true,
        status: 'active',
      },
      // Faculty primary + demo alias
      {
        id: 'usr-faculty-1',
        email: 'faculty@ncct.gov.in',
        employeeId: 'NCCT-FAC-2026-MH-101',
        passwordHash: pwFaculty,
        name: 'Prof. Meenakshi Sundaram',
        nameHi: 'प्रो. मीनाक्षी सुंदरम',
        phone: '+91 20 2553 7980',
        role: 'faculty',
        languagePreference: 'en',
        instituteId: 'inst-vamnicom',
        isKycVerified: true,
        status: 'active',
      },
      {
        id: 'usr-faculty-demo',
        email: 'faculty.demo@example.com',
        employeeId: 'NCCT-FAC-DEMO-001',
        passwordHash: pwFaculty,
        name: 'Prof. Meenakshi Sundaram (Demo)',
        phone: '+91 20 2553 7980',
        role: 'faculty',
        languagePreference: 'en',
        instituteId: 'inst-vamnicom',
        isKycVerified: true,
        status: 'active',
      },
      // Institute Admin primary + demo alias
      {
        id: 'usr-admin-vamnicom',
        email: 'admin.vamnicom@ncct.gov.in',
        employeeId: 'NCCT-ADM-2026-MH-001',
        passwordHash: pwAdmin,
        name: 'Dr. Rajesh Deshmukh',
        nameHi: 'डॉ. राजेश देशमुख',
        phone: '+91 20 2553 7970',
        role: 'institute_admin',
        languagePreference: 'en',
        instituteId: 'inst-vamnicom',
        isKycVerified: true,
        status: 'active',
      },
      {
        id: 'usr-admin-demo',
        email: 'admin.demo@example.com',
        employeeId: 'NCCT-ADM-DEMO-001',
        passwordHash: pwAdmin,
        name: 'Dr. Rajesh Deshmukh (Demo)',
        phone: '+91 20 2553 7970',
        role: 'institute_admin',
        languagePreference: 'en',
        instituteId: 'inst-vamnicom',
        isKycVerified: true,
        status: 'active',
      },
      // Super Admin primary + demo alias
      {
        id: 'usr-superadmin',
        email: 'superadmin@ncct.gov.in',
        employeeId: 'NCCT-HQ-2026-DL-001',
        passwordHash: pwSuper,
        name: 'Shri Arvind Mehta',
        nameHi: 'श्री अरविंद मेहता',
        phone: '+91 11 2338 9900',
        role: 'super_admin',
        languagePreference: 'en',
        isKycVerified: true,
        status: 'active',
      },
      {
        id: 'usr-superadmin-demo',
        email: 'superadmin.demo@example.com',
        employeeId: 'NCCT-HQ-DEMO-001',
        passwordHash: pwSuper,
        name: 'Shri Arvind Mehta (Demo)',
        phone: '+91 11 2338 9900',
        role: 'super_admin',
        languagePreference: 'en',
        isKycVerified: true,
        status: 'active',
      },
      // Employer primary + demo alias
      {
        id: 'usr-employer-1',
        email: 'employer@ncct.gov.in',
        employeeId: 'NCCT-EMP-2026-KA-501',
        passwordHash: pwEmployer,
        name: 'Shri Vikram Nair',
        nameHi: 'श्री विक्रम नायर',
        phone: '+91 80 4567 8901',
        role: 'employer',
        languagePreference: 'en',
        isKycVerified: true,
        status: 'active',
      },
      {
        id: 'usr-employer-demo',
        email: 'employer.demo@example.com',
        employeeId: 'NCCT-EMP-DEMO-001',
        passwordHash: pwEmployer,
        name: 'Shri Vikram Nair (Demo)',
        phone: '+91 80 4567 8901',
        role: 'employer',
        languagePreference: 'en',
        isKycVerified: true,
        status: 'active',
      },
      // Hostel Admin / Chief Warden
      {
        id: 'usr-warden-1',
        email: 'hostel.warden@ncct.gov.in',
        employeeId: 'NCCT-HST-2026-MH-001',
        passwordHash: await bcrypt.hash('Hostel@1234', SALT),
        name: 'Shri Rajesh Kulkarni',
        nameHi: 'श्री राजेश कुलकर्णी',
        phone: '+91 20 2553 7988',
        role: 'hostel_admin',
        languagePreference: 'en',
        instituteId: 'inst-vamnicom',
        isKycVerified: true,
        status: 'active',
      },
    ];

    for (const u of usersToUpsert) {
      await prisma.user.upsert({
        where: { email: u.email },
        update: {
          passwordHash: u.passwordHash,
          role: u.role,
          employeeId: u.employeeId,
          status: u.status,
          name: u.name,
        },
        create: u as any,
      });
      console.log(`  ✓ ${u.role}: ${u.email} [${u.employeeId}]`);
    }

    console.log('All test database users ready.');
  } catch (err) {
    console.error('Error seeding test users:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
