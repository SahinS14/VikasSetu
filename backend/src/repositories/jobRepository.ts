import prisma from '../config/prisma';

export const jobRepository = {
  findAll: () =>
    prisma.jobPosting.findMany({ orderBy: { postedDate: 'desc' } }),

  findById: (id: string) =>
    prisma.jobPosting.findUnique({ where: { id } }),

  findInterestByUserAndJob: (userId: string, jobPostingId: string) =>
    prisma.jobInterest.findUnique({
      where: { jobPostingId_userId: { jobPostingId, userId } },
    }),

  createInterest: (data: {
    id: string;
    jobPostingId: string;
    userId: string;
    traineeName: string;
    traineeEmail: string;
    traineeSkills: string[];
    matchedSkills: string[];
    missingSkills: string[];
    matchScore: number;
    eligibilityStatus: string;
    ineligibilityReasons: string[];
    timestamp: string;
    appliedAt: Date;
    status: string;
  }) =>
    prisma.jobInterest.create({ data }),

  findInterestsByUser: (userId: string) =>
    prisma.jobInterest.findMany({
      where: { userId },
      include: { job: true },
      orderBy: { appliedAt: 'desc' },
    }),

  findInterestsByJob: (jobPostingId: string) =>
    prisma.jobInterest.findMany({
      where: { jobPostingId },
      include: {
        job: true,
        user: {
          include: {
            publicProfile: true,
            certificates: true,
          },
        },
      },
      orderBy: [
        { eligibilityStatus: 'asc' }, // 'ELIGIBLE' comes before 'NOT_ELIGIBLE' alphabetically
        { matchScore: 'desc' },
      ],
    }),

  findInterestsByEmployer: async (employerId?: string) => {
    // If specific employer is passed, filter by employer's jobs or return all for cooperative recruiters
    const whereClause: any = {};
    if (employerId && !employerId.includes('admin')) {
      whereClause.job = {
        OR: [
          { employerId },
          { employerId: 'usr-employer-amul' },
          { employerName: { contains: 'AMUL' } },
          { employerName: { contains: 'GCMMF' } },
        ],
      };
    }

    const interests = await prisma.jobInterest.findMany({
      where: whereClause,
      include: {
        job: true,
        user: {
          include: {
            publicProfile: true,
            certificates: true,
          },
        },
      },
    });

    // Custom sort: ELIGIBLE first, then matchScore descending
    return interests.sort((a, b) => {
      if (a.eligibilityStatus === 'ELIGIBLE' && b.eligibilityStatus !== 'ELIGIBLE') return -1;
      if (a.eligibilityStatus !== 'ELIGIBLE' && b.eligibilityStatus === 'ELIGIBLE') return 1;
      return b.matchScore - a.matchScore;
    });
  },

  updateInterestStatus: (id: string, status: string) =>
    prisma.jobInterest.update({
      where: { id },
      data: { status },
      include: { job: true },
    }),
};
