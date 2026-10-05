import { Request, Response, NextFunction } from 'express';
import { hostelService } from '../services/hostelService';

export const hostelController = {
  getDashboardMetrics: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await hostelService.getDashboardMetrics();
      res.json(data);
    } catch (err) {
      next(err);
    }
  },

  getBlocks: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await hostelService.getBlocks();
      res.json(data);
    } catch (err) {
      next(err);
    }
  },

  getRooms: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { blockId, status } = req.query;
      const data = await hostelService.getRooms({
        blockId: blockId as string,
        status: status as string,
      });
      res.json(data);
    } catch (err) {
      next(err);
    }
  },

  updateBedStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { bedId } = req.params;
      const { status, traineeId, traineeName } = req.body;
      const data = await hostelService.updateBedStatus(bedId, status, { traineeId, traineeName });
      res.json(data);
    } catch (err) {
      next(err);
    }
  },

  getRequests: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = req.query;
      const data = await hostelService.getRequests({ status: status as string });
      res.json(data);
    } catch (err) {
      next(err);
    }
  },

  submitRequest: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const traineeId = req.user?.userId || req.body.traineeId;
      const data = await hostelService.submitRequest(traineeId, req.body);
      res.status(201).json(data);
    } catch (err) {
      next(err);
    }
  },

  updateRequestStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { requestId } = req.params;
      const { status, notes } = req.body;
      const data = await hostelService.updateRequestStatus(requestId, status, notes);
      res.json(data);
    } catch (err) {
      next(err);
    }
  },

  allocateBed: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await hostelService.allocateBed(req.body);
      res.status(201).json(data);
    } catch (err) {
      next(err);
    }
  },

  getAllocations: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = req.query;
      const data = await hostelService.getAllocations({ status: status as string });
      res.json(data);
    } catch (err) {
      next(err);
    }
  },

  checkIn: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { allocationId, verificationMethod } = req.body;
      const verifier = (req.user as any)?.name || req.user?.userId || 'Hostel Warden Office';
      const data = await hostelService.checkIn(allocationId, verificationMethod, verifier);
      res.json(data);
    } catch (err) {
      next(err);
    }
  },

  checkOut: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { allocationId, notes } = req.body;
      const data = await hostelService.checkOut(allocationId, notes);
      res.json(data);
    } catch (err) {
      next(err);
    }
  },

  getComplaints: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, category } = req.query;
      const data = await hostelService.getComplaints({
        status: status as string,
        category: category as string,
      });
      res.json(data);
    } catch (err) {
      next(err);
    }
  },

  submitComplaint: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const traineeId = req.user?.userId;
      if (!traineeId) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      const data = await hostelService.submitComplaint(traineeId, req.body);
      res.status(201).json(data);
    } catch (err) {
      next(err);
    }
  },

  updateComplaint: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { complaintId } = req.params;
      const data = await hostelService.updateComplaint(complaintId, req.body);
      res.json(data);
    } catch (err) {
      next(err);
    }
  },

  getResidentStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const traineeId = req.user?.userId;
      if (!traineeId) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      const data = await hostelService.isCurrentlyHostelResident(traineeId);
      res.json(data);
    } catch (err) {
      next(err);
    }
  },

  getTraineeHostelStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const traineeId = req.user?.userId;
      if (!traineeId) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      const data = await hostelService.getTraineeHostelStatus(traineeId);
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
};
