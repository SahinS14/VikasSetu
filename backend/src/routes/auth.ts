import { Router } from 'express';
import { authController } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = Router();

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or Employee ID required').optional(),
  email: z.string().min(1, 'Email required').optional(),
  password: z.string().min(1, 'Password required'),
  rememberMe: z.boolean().optional(),
}).refine(data => Boolean(data.identifier || data.email), {
  message: 'Email address or Employee ID is required',
  path: ['identifier'],
});

const registerSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['TRAINEE', 'FACULTY', 'INSTITUTE_ADMIN', 'EMPLOYER', 'DEVICE_OPERATOR', 'trainee', 'faculty', 'institute_admin', 'employer', 'device_operator']),
  phone: z.string().optional(),
  profileDetails: z.record(z.any()).optional(),
  eKycStatus: z.enum(['VERIFIED', 'NOT_VERIFIED']).optional(),
});

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', requireAuth, authController.me);
router.post('/logout', requireAuth, authController.logout);

export default router;
