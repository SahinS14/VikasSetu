import { Request, Response, NextFunction } from 'express';
import { notificationRepository } from '../repositories/notificationRepository';

export const notificationController = {
  getMyNotifications: async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await notificationRepository.findByUser(req.user!.userId)); }
    catch (err) { next(err); }
  },

  markAsRead: async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await notificationRepository.markAsRead(req.params.id)); }
    catch (err) { next(err); }
  },

  markAllAsRead: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await notificationRepository.markAllAsRead(req.user!.userId);
      res.json({ message: 'All notifications marked as read' });
    } catch (err) { next(err); }
  },
};
