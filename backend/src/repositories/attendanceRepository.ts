import prisma from '../config/prisma';

export const attendanceRepository = {
  findBySessionAndUser: (sessionId: string, userId: string) =>
    prisma.attendanceRecord.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
    }),

  create: (data: {
    id: string;
    sessionId: string;
    userId: string;
    traineeName: string;
    traineeCoop: string;
    method: string;
    timestamp: string;
    confidenceScore?: number;
    deviceLocation?: string;
  }) =>
    prisma.attendanceRecord.create({ data }),

  findActiveSessions: () =>
    prisma.session.findMany({ where: { active: true } }),

  findSessionByQrToken: (qrToken: string) =>
    prisma.session.findUnique({ where: { qrToken } }),

  findSessionById: (id: string) =>
    prisma.session.findUnique({ where: { id } }),

  findByUser: (userId: string) =>
    prisma.attendanceRecord.findMany({ where: { userId }, orderBy: { timestamp: 'desc' } }),
};
