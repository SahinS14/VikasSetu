import prisma from '../config/prisma';

export const certificateRepository = {
  findByUser: (userId: string) =>
    prisma.certificate.findMany({ where: { userId }, orderBy: { issuedDate: 'desc' } }),

  findById: (id: string) =>
    prisma.certificate.findUnique({ where: { id } }),

  findByUserAndCourse: (userId: string, courseId: string) =>
    prisma.certificate.findUnique({
      where: { userId_courseId: { userId, courseId } },
    }),

  create: (data: {
    id: string;
    userId: string;
    userName: string;
    userAadhaarMock?: string;
    courseId: string;
    courseTitle: string;
    courseTitleHi?: string;
    instituteId: string;
    instituteName: string;
    issuedDate: string;
    certificateHash: string;
    grade: string;
    certificateNumber?: string;
    verificationToken?: string;
    qrCodeData?: string;
    status?: string;
    issueDate?: string;
    completionDate?: string;
    enrollmentId?: string;
  }) =>
    prisma.certificate.create({ data }),
};
