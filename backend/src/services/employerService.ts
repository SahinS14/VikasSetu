import prisma from '../config/prisma';
import { createError } from '../middleware/errorHandler';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TalentPoolItem {
  label: string;
  badge: string;
  count: number;
  category: string;
}

export interface CandidateInterestItem {
  id: string;
  userId: string;
  jobPostingId: string;
  traineeName: string;
  traineeEmail: string;
  cooperativeAffiliation: string | null;
  jobTitle: string;
  matchScore: number;
  eligibilityStatus: string;
  status: string;
  timestamp: string;
  appliedAt: Date;
}

export interface EmployerDashboardData {
  employer: {
    id: string;
    name: string;
    email: string;
    cooperativeAffiliation: string | null;
  };
  summary: {
    activeJobPostings: number;
    totalCandidateInterests: number;
    certifiedTalentPool: number;
    candidatesContacted: number;
  };
  recentCandidateInterests: CandidateInterestItem[];
  activeJobs: {
    id: string;
    title: string;
    location: string;
    type: string;
    openingsCount: number;
    interestCount: number;
    postedDate: string;
    status: string;
  }[];
  talentPools: TalentPoolItem[];
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const employerService = {
  /**
   * Returns all dashboard data for an authenticated employer.
   * Every number is computed via real Prisma queries against PostgreSQL.
   */
  getDashboardData: async (userId: string): Promise<EmployerDashboardData> => {
    // 1. Verify employer user exists
    const employer = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, cooperativeAffiliation: true, role: true },
    });
    if (!employer) throw createError(404, 'Employer user not found');

    // 2. Employer's own job postings
    const employerJobs = await prisma.jobPosting.findMany({
      where: { employerId: userId },
      orderBy: { postedDate: 'desc' },
      include: {
        interests: {
          select: { id: true, status: true },
        },
      },
    });

    const employerJobIds = employerJobs.map(j => j.id);

    // 3. Active postings count
    const activeJobPostings = employerJobs.filter(j => j.status === 'ACTIVE').length;

    // 4. Total candidate interests across all employer's jobs
    const totalCandidateInterests = employerJobIds.length > 0
      ? await prisma.jobInterest.count({
          where: { jobPostingId: { in: employerJobIds } },
        })
      : 0;

    // 5. Certified talent pool — distinct users who hold at least one issued certificate
    const certifiedTalentPoolRows = await prisma.certificate.groupBy({
      by: ['userId'],
      where: { status: { in: ['ISSUED', 'VALID'] } },
    });
    const certifiedTalentPool = certifiedTalentPoolRows.length;

    // 6. Candidates contacted — job interests where employer moved candidate to interview/shortlisted/selected stage
    const candidatesContacted = employerJobIds.length > 0
      ? await prisma.jobInterest.count({
          where: {
            jobPostingId: { in: employerJobIds },
            status: { in: ['INTERVIEW', 'SHORTLISTED', 'SELECTED'] },
          },
        })
      : 0;

    // 7. Recent 5 candidate interests with trainee profile
    const recentInterestsRaw = employerJobIds.length > 0
      ? await prisma.jobInterest.findMany({
          where: { jobPostingId: { in: employerJobIds } },
          orderBy: { appliedAt: 'desc' },
          take: 5,
          include: {
            job: { select: { title: true } },
            user: { select: { cooperativeAffiliation: true } },
          },
        })
      : [];

    const recentCandidateInterests: CandidateInterestItem[] = recentInterestsRaw.map(i => ({
      id: i.id,
      userId: i.userId,
      jobPostingId: i.jobPostingId,
      traineeName: i.traineeName,
      traineeEmail: i.traineeEmail,
      cooperativeAffiliation: i.user?.cooperativeAffiliation ?? null,
      jobTitle: i.job?.title ?? 'Open Role',
      matchScore: i.matchScore,
      eligibilityStatus: i.eligibilityStatus,
      status: i.status,
      timestamp: i.timestamp,
      appliedAt: i.appliedAt,
    }));

    // 8. Active jobs with their per-job interest count (for "Manage Openings" quick stat)
    const activeJobs = employerJobs
      .filter(j => j.status === 'ACTIVE')
      .map(j => ({
        id: j.id,
        title: j.title,
        location: j.location,
        type: j.type,
        openingsCount: j.openingsCount,
        interestCount: j.interests.length,
        postedDate: j.postedDate,
        status: j.status,
      }));

    // 9. Dynamic talent pools — derived from Course categories + certificate counts
    const allCertificates = await prisma.certificate.findMany({
      where: { status: { in: ['ISSUED', 'VALID'] } },
      include: { course: { select: { category: true } } },
    });

    const pacsCount = allCertificates.filter(c =>
      c.course.category.toLowerCase().includes('erp') ||
      c.course.category.toLowerCase().includes('pacs') ||
      c.course.category.toLowerCase().includes('software')
    ).length;

    const dairyCount = allCertificates.filter(c =>
      c.course.category.toLowerCase().includes('dairy') ||
      c.course.category.toLowerCase().includes('amcs') ||
      c.course.category.toLowerCase().includes('cold')
    ).length;

    const bankingCount = allCertificates.filter(c =>
      c.course.category.toLowerCase().includes('bank') ||
      c.course.category.toLowerCase().includes('credit') ||
      c.course.category.toLowerCase().includes('finance') ||
      c.course.category.toLowerCase().includes('kcc')
    ).length;

    const talentPools: TalentPoolItem[] = [
      { label: 'PACS ERP Specialists', badge: 'Accredited', count: pacsCount, category: 'ERP / PACS' },
      { label: 'Dairy AMCS & Cold Chain', badge: 'NDDB Aligned', count: dairyCount, category: 'Dairy Management' },
      { label: 'KCC & Credit Auditors', badge: 'NABARD Aligned', count: bankingCount, category: 'Cooperative Banking' },
    ];

    return {
      employer: {
        id: employer.id,
        name: employer.name,
        email: employer.email,
        cooperativeAffiliation: employer.cooperativeAffiliation,
      },
      summary: {
        activeJobPostings,
        totalCandidateInterests,
        certifiedTalentPool,
        candidatesContacted,
      },
      recentCandidateInterests,
      activeJobs,
      talentPools,
    };
  },

  /**
   * Send recruiter outreach — creates an AppNotification for the trainee
   * and updates the JobInterest status to INTERVIEW in PostgreSQL.
   */
  contactCandidate: async (
    employerUserId: string,
    payload: { jobInterestId: string; candidateUserId: string; jobTitle: string }
  ) => {
    const { jobInterestId, candidateUserId, jobTitle } = payload;

    // Verify the job interest belongs to one of this employer's jobs
    const interest = await prisma.jobInterest.findUnique({
      where: { id: jobInterestId },
      include: { job: { select: { employerId: true, title: true } } },
    });
    if (!interest) throw createError(404, 'Application not found');
    if (interest.job.employerId !== employerUserId) {
      throw createError(403, 'You are not authorized to contact this candidate');
    }

    // Update interest status to INTERVIEW
    const updated = await prisma.jobInterest.update({
      where: { id: jobInterestId },
      data: { status: 'INTERVIEW' },
    });

    // Create in-app notification for the trainee
    await prisma.appNotification.create({
      data: {
        id: `notif-outreach-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: candidateUserId,
        title: 'Recruiter Interview Outreach',
        message: `You have been shortlisted for an interview for the role "${jobTitle}". Please check your registered email for further details.`,
        timestamp: new Date().toISOString(),
        type: 'job',
        linkView: 'my_applications',
      },
    });

    return { success: true, updatedInterest: updated };
  },

  /**
   * Create a new job posting owned by the authenticated employer.
   */
  createJob: async (
    employerUserId: string,
    data: {
      title: string;
      description: string;
      location: string;
      type: string;
      salaryRange: string;
      openingsCount: number;
      requiredSkills: string[];
      preferredSkills?: string[];
      requiredQualification?: string;
      minimumExperience?: number;
      requiredCertificates?: string[];
    }
  ) => {
    const employer = await prisma.user.findUnique({
      where: { id: employerUserId },
      select: { name: true, cooperativeAffiliation: true },
    });
    if (!employer) throw createError(404, 'Employer not found');

    return prisma.jobPosting.create({
      data: {
        id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        employerId: employerUserId,
        employerName: employer.cooperativeAffiliation ?? employer.name,
        title: data.title,
        description: data.description,
        location: data.location,
        type: data.type,
        salaryRange: data.salaryRange,
        openingsCount: data.openingsCount,
        requiredSkills: data.requiredSkills,
        preferredSkills: data.preferredSkills ?? [],
        requiredQualification: data.requiredQualification ?? 'Graduation / Diploma',
        minimumExperience: data.minimumExperience ?? 0,
        requiredCertificates: data.requiredCertificates ?? [],
        postedDate: new Date().toISOString().split('T')[0],
        status: 'ACTIVE',
      },
    });
  },

  /**
   * Update a job posting. Employer must own the posting.
   */
  updateJob: async (
    employerUserId: string,
    jobId: string,
    updates: Record<string, unknown>
  ) => {
    const job = await prisma.jobPosting.findUnique({ where: { id: jobId } });
    if (!job) throw createError(404, 'Job posting not found');
    if (job.employerId !== employerUserId) {
      throw createError(403, 'You are not authorized to edit this job posting');
    }
    return prisma.jobPosting.update({ where: { id: jobId }, data: updates });
  },

  /**
   * Soft-delete (close) a job posting. Employer must own it.
   */
  deleteJob: async (employerUserId: string, jobId: string) => {
    const job = await prisma.jobPosting.findUnique({ where: { id: jobId } });
    if (!job) throw createError(404, 'Job posting not found');
    if (job.employerId !== employerUserId) {
      throw createError(403, 'You are not authorized to delete this job posting');
    }
    // Soft-close to preserve application history
    return prisma.jobPosting.update({ where: { id: jobId }, data: { status: 'CLOSED' } });
  },

  /**
   * Toggle job status between ACTIVE and CLOSED.
   */
  toggleJobStatus: async (employerUserId: string, jobId: string) => {
    const job = await prisma.jobPosting.findUnique({ where: { id: jobId } });
    if (!job) throw createError(404, 'Job posting not found');
    if (job.employerId !== employerUserId) {
      throw createError(403, 'You are not authorized to modify this job posting');
    }
    const newStatus = job.status === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
    return prisma.jobPosting.update({ where: { id: jobId }, data: { status: newStatus } });
  },
};
