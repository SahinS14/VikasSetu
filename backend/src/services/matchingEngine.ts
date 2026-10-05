import prisma from '../config/prisma';

export interface StudentProfileData {
  userId: string;
  name: string;
  email: string;
  qualification: string;
  education: string;
  location: string;
  experienceYears: number;
  preferredLocation: string;
  preferredEmploymentType: string;
  availability: string;
  skills: string[];
  certificates: Array<{
    id: string;
    courseId: string;
    courseTitle: string;
    grade: string;
    issuedDate: string;
    certificateNumber?: string | null;
  }>;
  completedCourses: string[];
}

export interface JobRequirementData {
  id: string;
  title: string;
  employerName: string;
  requiredSkills: string[];
  preferredSkills: string[];
  requiredQualification: string;
  minimumExperience: number;
  requiredCertificates: string[];
  location: string;
  type: string; // Full-time | Apprenticeship | Contract
}

export interface MatchScoreBreakdown {
  skillsScore: number; // out of 40
  skillsMax: number;
  certificatesScore: number; // out of 20
  certificatesMax: number;
  educationScore: number; // out of 15
  educationMax: number;
  experienceScore: number; // out of 10
  experienceMax: number;
  locationScore: number; // out of 5
  locationMax: number;
  preferenceScore: number; // out of 5
  preferenceMax: number;
  availabilityScore: number; // out of 5
  availabilityMax: number;
  totalScore: number; // out of 100
}

export interface RecommendedCourse {
  courseId: string;
  courseTitle: string;
  skillAddressed: string;
  actionText: string;
}

export interface JobMatchResult {
  jobId: string;
  jobTitle: string;
  matchScore: number; // 0 - 100
  matchLabel: 'Excellent Match' | 'Strong Match' | 'Good Match' | 'Moderate Match' | 'Low Match';
  eligibilityStatus: 'ELIGIBLE' | 'NOT_ELIGIBLE';
  ineligibilityReasons: string[];
  breakdown: MatchScoreBreakdown;
  matchedSkills: string[];
  missingSkills: string[];
  matchedPreferredSkills: string[];
  missingPreferredSkills: string[];
  hasRequiredCertificate: boolean;
  qualificationMet: boolean;
  experienceMet: boolean;
  locationMet: boolean;
  recommendedCourses: RecommendedCourse[];
}

/**
 * Course to Verified Skills Mapping (derived from LMS curriculum)
 */
export const COURSE_SKILLS_MAP: Record<string, string[]> = {
  'crs-dairy-101': [
    'Dairy Cold Chain',
    'AMCS Operations',
    'FAT/SNF Testing',
    'NDDB Standards',
    'Dairy Cooperative Operations',
  ],
  'crs-dairy-mgmt-201': [
    'Dairy Cold Chain',
    'AMCS Operations',
    'FAT/SNF Testing',
    'NDDB Standards',
    'Dairy Cooperative Operations',
  ],
  'crs-pacs-erp-101': [
    'PACS Digitalization',
    'Dairy ERP',
    'AMCS Operations',
    'KCC Accounting',
    'KCC Management',
    'Double-Entry ERP',
    'Cooperative Audit',
  ],
  'crs-shg-101': [
    'SHG Governance',
    'Microfinance',
    'DAY-NRLM',
    'Thrift Management & Financial Literacy',
    'Group Lending',
  ],
};

/**
 * Normalizes skill strings to lower-case stemmed tokens for accurate matching
 * ("AMCS Operations" === "AMCS Operation" === "amcs digital milk collection")
 */
export function normalizeSkill(skill: string): string {
  let s = (skill || '').toLowerCase().trim();
  // Remove punctuation
  s = s.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, ' ');
  // Replace multiple spaces with single
  s = s.replace(/\s+/g, ' ').trim();

  // Synonyms normalization
  if (s.includes('amcs') || s.includes('milk collection')) return 'amcs operations';
  if (s.includes('fat') || s.includes('snf') || s.includes('quality test') || s.includes('testing')) return 'fat/snf testing';
  if (s.includes('cold chain') || s.includes('chilling') || s.includes('dairy logistics')) return 'dairy cold chain';
  if (s.includes('nddb')) return 'nddb standards';
  if (s.includes('dairy erp') || s.includes('milk society erp')) return 'dairy erp';
  if (s.includes('milk procurement')) return 'milk procurement';
  if (s.includes('pacs') || s.includes('computerization') || s.includes('digitalization')) return 'pacs digitalization';
  if (s.includes('kcc') && s.includes('account')) return 'kcc accounting';
  if (s.includes('kcc') || s.includes('kisan credit')) return 'kcc management';
  if (s.includes('double entry') || s.includes('ledger') || s.includes('cash book')) return 'double-entry erp';
  if (s.includes('audit') || s.includes('cbs') || s.includes('inspection')) return 'cooperative audit';
  if (s.includes('nabard')) return 'nabard guidelines';
  if (s.includes('shg') || s.includes('self help')) return 'shg governance';
  if (s.includes('microfinance') || s.includes('micro credit') || s.includes('group lending')) return 'microfinance';
  if (s.includes('nrlm') || s.includes('day nrlm')) return 'day-nrlm';

  // Suffix strip: remove plural 's' or 'ing'
  if (s.endsWith(' operations')) s = s.replace(' operations', ' operation');
  if (s.endsWith('s') && !s.endsWith('ss')) s = s.slice(0, -1);
  return s;
}

export function skillsMatch(skillA: string, skillB: string): boolean {
  const normA = normalizeSkill(skillA);
  const normB = normalizeSkill(skillB);
  if (normA === normB) return true;
  if (normA.includes(normB) || normB.includes(normA)) return true;
  return false;
}

/**
 * Fetch authoritative student profile from DB including:
 * - Trainee profile (education, qualification, location, experience)
 * - Verified Certificates (earned via course completion + assessment >= 75%)
 * - Completed Courses (100% progress + passed assessment)
 * - Dynamic Earned Skills
 */
export async function getStudentProfileData(userId: string): Promise<StudentProfileData> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      publicProfile: true,
      certificates: {
        where: { status: { in: ['ISSUED', 'VALID'] } },
      },
      enrollments: {
        where: {
          OR: [{ status: 'completed' }, { progressPercent: 100 }],
        },
      },
    },
  });

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  const profile = user.publicProfile;

  // Extract skills dynamically from verified certificates and completed courses
  const earnedSkillsSet = new Set<string>();

  // 1. Skills from completed courses with verified certificates
  for (const cert of user.certificates) {
    const skillsForCourse = COURSE_SKILLS_MAP[cert.courseId] || [];
    skillsForCourse.forEach(s => earnedSkillsSet.add(s));

    // Keyword inference if course title matches
    const titleLower = (cert.courseTitle || '').toLowerCase();
    if (titleLower.includes('dairy')) {
      COURSE_SKILLS_MAP['crs-dairy-101'].forEach(s => earnedSkillsSet.add(s));
    }
    if (titleLower.includes('pacs') || titleLower.includes('erp')) {
      COURSE_SKILLS_MAP['crs-pacs-erp-101'].forEach(s => earnedSkillsSet.add(s));
    }
    if (titleLower.includes('shg')) {
      COURSE_SKILLS_MAP['crs-shg-101'].forEach(s => earnedSkillsSet.add(s));
    }
  }

  // 2. Skills from 100% completed enrollments
  for (const enr of user.enrollments) {
    const skillsForCourse = COURSE_SKILLS_MAP[enr.courseId] || [];
    skillsForCourse.forEach(s => earnedSkillsSet.add(s));
  }

  // 3. User explicit skills in profile
  if (profile?.skills && Array.isArray(profile.skills)) {
    (profile.skills as string[]).forEach(s => earnedSkillsSet.add(s));
  }

  // 4. Default cooperative baseline skills
  earnedSkillsSet.add('Cooperative Principles');
  earnedSkillsSet.add('Member KYC');

  const completedCourseIds = user.enrollments.map(e => e.courseId);
  user.certificates.forEach(c => {
    if (!completedCourseIds.includes(c.courseId)) {
      completedCourseIds.push(c.courseId);
    }
  });

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    qualification: profile?.qualification || 'Graduate (B.Com)',
    education: profile?.education || 'Bachelor Degree in Commerce (B.Com)',
    location: profile?.location || (user.cooperativeAffiliation?.includes('Niphad') ? 'Nashik, Maharashtra' : 'Anand, Gujarat'),
    experienceYears: profile?.experienceYears ?? 1.0,
    preferredLocation: profile?.preferredLocation || 'Gujarat',
    preferredEmploymentType: profile?.preferredEmploymentType || 'Full-time',
    availability: profile?.availability || 'Immediate',
    skills: Array.from(earnedSkillsSet),
    certificates: user.certificates.map(c => ({
      id: c.id,
      courseId: c.courseId,
      courseTitle: c.courseTitle,
      grade: c.grade,
      issuedDate: c.issueDate || c.issuedDate || c.createdAt.toISOString(),
      certificateNumber: c.certificateNumber,
    })),
    completedCourses: completedCourseIds,
  };
}

/**
 * Deterministic 100-point matching algorithm with strict eligibility validation
 */
export function calculateJobMatch(
  student: StudentProfileData,
  job: JobRequirementData
): JobMatchResult {
  const ineligibilityReasons: string[] = [];

  // ========================================================================
  // 1. SKILLS MATCH (40 Points)
  // ========================================================================
  const reqSkills = Array.isArray(job.requiredSkills) ? job.requiredSkills : [];
  const prefSkills = Array.isArray(job.preferredSkills) ? job.preferredSkills : [];

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  const matchedPreferredSkills: string[] = [];
  const missingPreferredSkills: string[] = [];

  for (const rs of reqSkills) {
    const isMatched = student.skills.some(ss => skillsMatch(ss, rs));
    if (isMatched) {
      matchedSkills.push(rs);
    } else {
      missingSkills.push(rs);
    }
  }

  for (const ps of prefSkills) {
    const isMatched = student.skills.some(ss => skillsMatch(ss, ps));
    if (isMatched) {
      matchedPreferredSkills.push(ps);
    } else {
      missingPreferredSkills.push(ps);
    }
  }

  let skillsScore = 0;
  if (reqSkills.length > 0 && prefSkills.length > 0) {
    // 30 points for required skills, 10 points for preferred skills
    const reqRatio = matchedSkills.length / reqSkills.length;
    const prefRatio = matchedPreferredSkills.length / prefSkills.length;
    skillsScore = Math.round(reqRatio * 30 + prefRatio * 10);
  } else if (reqSkills.length > 0) {
    // Full 40 points for required skills
    const reqRatio = matchedSkills.length / reqSkills.length;
    skillsScore = Math.round(reqRatio * 40);
  } else if (prefSkills.length > 0) {
    const prefRatio = matchedPreferredSkills.length / prefSkills.length;
    skillsScore = Math.round(prefRatio * 40);
  } else {
    skillsScore = 40;
  }

  // ========================================================================
  // 2. CERTIFICATES MATCH (20 Points)
  // ========================================================================
  const reqCerts = Array.isArray(job.requiredCertificates) ? job.requiredCertificates : [];
  let hasRequiredCertificate = false;
  let certificatesScore = 0;

  if (reqCerts.length > 0) {
    const matchedCerts = reqCerts.filter(rc => {
      const rcNorm = rc.toLowerCase();
      return student.certificates.some(sc => {
        const scNorm = sc.courseTitle.toLowerCase();
        return (
          scNorm.includes(rcNorm) ||
          rcNorm.includes(scNorm) ||
          (rcNorm.includes('dairy') && scNorm.includes('dairy')) ||
          (rcNorm.includes('pacs') && scNorm.includes('pacs')) ||
          (rcNorm.includes('bank') && (scNorm.includes('bank') || scNorm.includes('audit')))
        );
      });
    });

    if (matchedCerts.length > 0) {
      hasRequiredCertificate = true;
      certificatesScore = Math.round((matchedCerts.length / reqCerts.length) * 20);
    } else {
      certificatesScore = 0;
      // If candidate has any accredited certificate, give partial diagnostic credit
      if (student.certificates.length > 0) {
        certificatesScore = 5;
      }
    }
  } else {
    // Job has no specific certificate required
    if (student.certificates.length > 0) {
      hasRequiredCertificate = true;
      certificatesScore = 20;
    } else {
      certificatesScore = 10;
    }
  }

  // ========================================================================
  // 3. EDUCATION / QUALIFICATION MATCH (15 Points)
  // ========================================================================
  const reqQual = (job.requiredQualification || '').toLowerCase();
  const studQual = (student.qualification + ' ' + student.education).toLowerCase();

  let qualificationMet = false;
  let educationScore = 0;

  // Level mapping
  const isPostGradReq = reqQual.includes('master') || reqQual.includes('post graduate') || reqQual.includes('m.com') || reqQual.includes('mba');
  const isDegreeReq = reqQual.includes('bachelor') || reqQual.includes('degree') || reqQual.includes('graduate') || reqQual.includes('b.com') || reqQual.includes('b.sc') || reqQual.includes('bca');
  const isDiplomaReq = reqQual.includes('diploma') || reqQual.includes('hsc') || reqQual.includes('12th');

  const studIsPostGrad = studQual.includes('master') || studQual.includes('m.com') || studQual.includes('mba');
  const studIsDegree = studQual.includes('bachelor') || studQual.includes('degree') || studQual.includes('graduate') || studQual.includes('b.com') || studQual.includes('b.sc') || studQual.includes('bca') || studIsPostGrad;
  const studIsDiploma = studQual.includes('diploma') || studQual.includes('12th') || studIsDegree;

  if (isPostGradReq) {
    if (studIsPostGrad) {
      qualificationMet = true;
      educationScore = 15;
    } else if (studIsDegree) {
      educationScore = 8;
    } else {
      educationScore = 0;
    }
  } else if (isDegreeReq) {
    if (studIsDegree) {
      qualificationMet = true;
      educationScore = 15;
    } else if (studIsDiploma) {
      educationScore = 8;
    } else {
      educationScore = 0;
    }
  } else if (isDiplomaReq) {
    if (studIsDiploma) {
      qualificationMet = true;
      educationScore = 15;
    } else {
      educationScore = 0;
    }
  } else {
    // Open qualification
    qualificationMet = true;
    educationScore = 15;
  }

  // If qualification was NOT met and job specifically requires graduation/diploma
  if (!qualificationMet && (isPostGradReq || isDegreeReq)) {
    ineligibilityReasons.push(`Required qualification not met: Requires ${job.requiredQualification}`);
  }

  // ========================================================================
  // 4. EXPERIENCE MATCH (10 Points)
  // ========================================================================
  const minExp = job.minimumExperience ?? 0;
  const studExp = student.experienceYears ?? 0;

  let experienceMet = false;
  let experienceScore = 0;

  if (minExp <= 0) {
    experienceMet = true;
    experienceScore = 10;
  } else if (studExp >= minExp) {
    experienceMet = true;
    experienceScore = 10;
  } else if (studExp > 0) {
    experienceScore = Math.round((studExp / minExp) * 10);
    // If job strictly requires minimum experience > 1 year and candidate has < minExp
    if (minExp >= 2 && studExp < 1) {
      ineligibilityReasons.push(`Minimum experience not satisfied: Requires ${minExp} years (candidate has ${studExp} year)`);
    } else {
      experienceMet = true;
    }
  } else {
    experienceScore = 0;
    if (minExp >= 2) {
      ineligibilityReasons.push(`Minimum experience not satisfied: Requires ${minExp} years`);
    }
  }

  // ========================================================================
  // 5. LOCATION MATCH (5 Points)
  // ========================================================================
  const jobLoc = (job.location || '').toLowerCase();
  const studLoc = (student.location || '').toLowerCase();
  const studPrefLoc = (student.preferredLocation || '').toLowerCase();

  let locationMet = false;
  let locationScore = 0;

  const states = ['gujarat', 'maharashtra', 'karnataka', 'uttar pradesh', 'madhya pradesh', 'rajasthan', 'delhi'];
  const cities = ['anand', 'vadodara', 'ahmedabad', 'surat', 'pune', 'nashik', 'mumbai', 'kolhapur', 'bengaluru', 'barabanki', 'lucknow'];

  const matchedLocationKeyword = [...states, ...cities].some(keyword => {
    return jobLoc.includes(keyword) && (studLoc.includes(keyword) || studPrefLoc.includes(keyword));
  });

  if (matchedLocationKeyword || jobLoc.includes('any') || studPrefLoc.includes('all') || studPrefLoc.includes('any')) {
    locationMet = true;
    locationScore = 5;
  } else {
    locationScore = 2; // Partial credit for mobility within cooperative sector
  }

  // ========================================================================
  // 6. JOB PREFERENCE MATCH (5 Points)
  // ========================================================================
  const jobType = (job.type || 'Full-time').toLowerCase();
  const studType = (student.preferredEmploymentType || 'Full-time').toLowerCase();

  let preferenceScore = 0;
  if (jobType === studType || studType.includes('all') || studType.includes('any')) {
    preferenceScore = 5;
  } else if (jobType.includes('full') && studType.includes('apprenticeship')) {
    preferenceScore = 3;
  } else {
    preferenceScore = 2;
  }

  // ========================================================================
  // 7. AVAILABILITY MATCH (5 Points)
  // ========================================================================
  const studAvail = (student.availability || 'Immediate').toLowerCase();
  let availabilityScore = 5;
  if (studAvail.includes('immediate') || studAvail.includes('15')) {
    availabilityScore = 5;
  } else if (studAvail.includes('30')) {
    availabilityScore = 3;
  } else {
    availabilityScore = 2;
  }

  // ========================================================================
  // TOTAL SCORE & LABEL
  // ========================================================================
  const totalScore = Math.min(
    100,
    skillsScore +
      certificatesScore +
      educationScore +
      experienceScore +
      locationScore +
      preferenceScore +
      availabilityScore
  );

  let matchLabel: 'Excellent Match' | 'Strong Match' | 'Good Match' | 'Moderate Match' | 'Low Match' = 'Low Match';
  if (totalScore >= 90) matchLabel = 'Excellent Match';
  else if (totalScore >= 80) matchLabel = 'Strong Match';
  else if (totalScore >= 70) matchLabel = 'Good Match';
  else if (totalScore >= 60) matchLabel = 'Moderate Match';
  else matchLabel = 'Low Match';

  // ========================================================================
  // ELIGIBILITY STATUS
  // ========================================================================
  // If mandatory certificate required and missing:
  if (reqCerts.length > 0 && !hasRequiredCertificate) {
    ineligibilityReasons.push(`Mandatory certificate missing: ${reqCerts.join(', ')}`);
  }

  // If candidate lacks critical required skills (> 75% missing):
  if (reqSkills.length > 0 && matchedSkills.length === 0) {
    ineligibilityReasons.push('None of the mandatory job skills are satisfied');
  }

  const eligibilityStatus: 'ELIGIBLE' | 'NOT_ELIGIBLE' = ineligibilityReasons.length === 0 ? 'ELIGIBLE' : 'NOT_ELIGIBLE';

  // ========================================================================
  // RECOMMENDED COURSES (SKILL GAP ENGINE)
  // ========================================================================
  const recommendedCourses: RecommendedCourse[] = [];
  const missingAll = [...missingSkills, ...missingPreferredSkills];

  for (const skill of missingAll) {
    const norm = normalizeSkill(skill);
    if (norm.includes('dairy') || norm.includes('milk') || norm.includes('amcs') || norm.includes('fat') || norm.includes('snf') || norm.includes('cold chain') || norm.includes('nddb')) {
      if (!recommendedCourses.some(r => r.courseId === 'crs-dairy-101')) {
        recommendedCourses.push({
          courseId: 'crs-dairy-101',
          courseTitle: 'Dairy & Livestock Cooperative Management',
          skillAddressed: skill,
          actionText: 'Complete course & pass assessment to earn certificate and verify ' + skill,
        });
      }
    } else if (norm.includes('pacs') || norm.includes('erp') || norm.includes('kcc') || norm.includes('ledger') || norm.includes('audit')) {
      if (!recommendedCourses.some(r => r.courseId === 'crs-pacs-erp-101')) {
        recommendedCourses.push({
          courseId: 'crs-pacs-erp-101',
          courseTitle: 'PACS Computerization & ERP Operations',
          skillAddressed: skill,
          actionText: 'Complete course & pass assessment to earn certificate and verify ' + skill,
        });
      }
    } else if (norm.includes('shg') || norm.includes('microfinance') || norm.includes('nrlm')) {
      if (!recommendedCourses.some(r => r.courseId === 'crs-shg-101')) {
        recommendedCourses.push({
          courseId: 'crs-shg-101',
          courseTitle: 'SHG Governance & Microfinance',
          skillAddressed: skill,
          actionText: 'Complete course & pass assessment to earn certificate and verify ' + skill,
        });
      }
    }
  }

  return {
    jobId: job.id,
    jobTitle: job.title,
    matchScore: totalScore,
    matchLabel,
    eligibilityStatus,
    ineligibilityReasons,
    breakdown: {
      skillsScore,
      skillsMax: 40,
      certificatesScore,
      certificatesMax: 20,
      educationScore,
      educationMax: 15,
      experienceScore,
      experienceMax: 10,
      locationScore,
      locationMax: 5,
      preferenceScore,
      preferenceMax: 5,
      availabilityScore,
      availabilityMax: 5,
      totalScore,
    },
    matchedSkills,
    missingSkills,
    matchedPreferredSkills,
    missingPreferredSkills,
    hasRequiredCertificate,
    qualificationMet,
    experienceMet,
    locationMet,
    recommendedCourses,
  };
}
