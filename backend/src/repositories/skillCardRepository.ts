import prisma from '../config/prisma';

export const skillCardRepository = {
  findByUserId: async (userId: string) => {
    return prisma.traineePublicProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            nameHi: true,
            avatarUrl: true,
            cooperativeAffiliation: true,
            instituteId: true,
            languagePreference: true,
            isKycVerified: true,
            status: true,
          },
        },
      },
    });
  },

  findByToken: async (publicToken: string) => {
    return prisma.traineePublicProfile.findUnique({
      where: { publicToken },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            nameHi: true,
            avatarUrl: true,
            cooperativeAffiliation: true,
            instituteId: true,
            languagePreference: true,
            isKycVerified: true,
            status: true,
          },
        },
      },
    });
  },

  createProfile: async (data: {
    userId: string;
    publicToken: string;
    registrationId?: string;
  }) => {
    return prisma.traineePublicProfile.create({
      data: {
        userId: data.userId,
        publicToken: data.publicToken,
        registrationId: data.registrationId || 'NCCT-TRN-2026-MH-44091',
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            nameHi: true,
            avatarUrl: true,
            cooperativeAffiliation: true,
            instituteId: true,
            languagePreference: true,
            isKycVerified: true,
            status: true,
          },
        },
      },
    });
  },

  updateToken: async (userId: string, newPublicToken: string) => {
    return prisma.traineePublicProfile.update({
      where: { userId },
      data: {
        publicToken: newPublicToken,
        isActive: true,
        updatedAt: new Date(),
      },
    });
  },

  upsertProfile: async (data: {
    userId: string;
    publicToken: string;
    registrationId?: string;
  }) => {
    return prisma.traineePublicProfile.upsert({
      where: { userId: data.userId },
      update: {
        publicToken: data.publicToken,
        registrationId: data.registrationId || undefined,
        isActive: true,
      },
      create: {
        userId: data.userId,
        publicToken: data.publicToken,
        registrationId: data.registrationId || 'NCCT-TRN-2026-MH-44091',
        isActive: true,
      },
    });
  },

  getTraineeLearningData: async (userId: string) => {
    const [enrollments, certificates, jobApplications] = await Promise.all([
      prisma.enrollment.findMany({
        where: { userId },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              titleHi: true,
              titleMr: true,
              durationHours: true,
              category: true,
              level: true,
              instituteId: true,
            },
          },
        },
      }),
      prisma.certificate.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              durationHours: true,
            },
          },
        },
      }),
      prisma.jobInterest.count({
        where: { userId },
      }),
    ]);

    return { enrollments, certificates, jobApplications };
  },

  createRecruiterNotification: async (data: {
    userId: string;
    recruiterName: string;
    organizationName: string;
    recruiterEmail: string;
    recruiterPhone?: string;
    jobRole?: string;
    message?: string;
  }) => {
    const title = `Recruiter Inquiry: ${data.organizationName}`;
    const formattedMessage = `${data.recruiterName} from ${data.organizationName} viewed your NCCT Digital Skill Card for the role of "${data.jobRole || 'Cooperative Professional'}". Message: "${data.message || 'We are interested in your verified cooperative skill profile.'}" Contact: ${data.recruiterEmail}${data.recruiterPhone ? ` / ${data.recruiterPhone}` : ''}`;

    return prisma.appNotification.create({
      data: {
        id: `notif-recruiter-${Date.now()}`,
        userId: data.userId,
        title,
        message: formattedMessage,
        timestamp: new Date().toISOString(),
        isRead: false,
        type: 'job',
        linkView: 'jobs',
      },
    });
  },
};
