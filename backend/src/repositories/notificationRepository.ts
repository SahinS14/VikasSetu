import prisma from '../config/prisma';

export const notificationRepository = {
  findByUser: (userId: string) =>
    prisma.appNotification.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
    }),

  markAsRead: (id: string) =>
    prisma.appNotification.update({ where: { id }, data: { isRead: true } }),

  markAllAsRead: (userId: string) =>
    prisma.appNotification.updateMany({ where: { userId }, data: { isRead: true } }),

  create: (data: {
    id: string;
    userId: string;
    title: string;
    message: string;
    timestamp: string;
    type: string;
    linkView?: string;
    linkParams?: any;
  }) =>
    prisma.appNotification.create({ data }),
};
