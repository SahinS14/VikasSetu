import { Router } from 'express';
import { hostelController } from '../controllers/hostelController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Dashboard & Analytics
router.get('/dashboard', requireAuth, hostelController.getDashboardMetrics);

// Blocks & Rooms Inventory
router.get('/blocks', requireAuth, hostelController.getBlocks);
router.get('/rooms', requireAuth, hostelController.getRooms);
router.patch('/beds/:bedId/status', requireAuth, hostelController.updateBedStatus);

// Requests
router.get('/requests', requireAuth, hostelController.getRequests);
router.post('/requests', requireAuth, hostelController.submitRequest);
router.patch('/requests/:requestId', requireAuth, hostelController.updateRequestStatus);

// Allocations & Operations
router.get('/allocations', requireAuth, hostelController.getAllocations);
router.post('/allocations', requireAuth, hostelController.allocateBed);
router.post('/check-in', requireAuth, hostelController.checkIn);
router.post('/check-out', requireAuth, hostelController.checkOut);

// Complaints Desk
router.get('/complaints', requireAuth, hostelController.getComplaints);
router.post('/complaints', requireAuth, hostelController.submitComplaint);
router.patch('/complaints/:complaintId', requireAuth, hostelController.updateComplaint);

// Trainee Personal Status & Eligibility (Authenticated JWT-only)
router.get('/resident-status', requireAuth, hostelController.getResidentStatus);
router.get('/trainee/status', requireAuth, hostelController.getResidentStatus);
router.get('/my-status', requireAuth, hostelController.getTraineeHostelStatus);
router.get('/trainee/my-status', requireAuth, hostelController.getTraineeHostelStatus);

export default router;
