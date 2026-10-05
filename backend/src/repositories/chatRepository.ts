import prisma from '../config/prisma';

export const chatRepository = {
  saveMessage: (data: { userId: string; role: string; content: string }) =>
    prisma.chatMessage.create({ data }),

  getHistory: (userId: string, limit = 50) =>
    prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { timestamp: 'asc' },
      take: limit,
    }),
};
