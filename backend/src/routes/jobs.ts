import { Router } from 'express';
import { jobController } from '../controllers/jobController';
import { requireAuth, optionalAuth } from '../middleware/auth';

const router = Router();

// Public / Personalized listing
router.get('/', optionalAuth, jobController.getAll);

// Trainee: view own submitted applications
router.get('/applications/me', requireAuth, jobController.getMyApplications);

// Recruiter: view all candidate applicants (sorted by eligible first, match score descending)
router.get('/recruiter/candidates', requireAuth, jobController.getRecruiterCandidates);
router.get('/candidates', requireAuth, jobController.getRecruiterCandidates);

// Recruiter: update application review status
router.patch('/applications/:id/status', requireAuth, jobController.updateStatus);

// Job Match Breakdown for "Express Interest" modal
router.get('/:id/match', requireAuth, jobController.getMatchDetails);

// Job Details
router.get('/:id', optionalAuth, jobController.getById);

// Submit Application / Express Interest
router.post('/:id/apply', requireAuth, jobController.apply);

export default router;
