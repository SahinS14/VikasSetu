import { Router, Request, Response, NextFunction } from 'express';
import { userController } from '../controllers/userController';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';
import prisma from '../config/prisma';
import bcrypt from 'bcrypt';

const router = Router();

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  languagePreference: z.enum(['en', 'hi', 'mr']).optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  cooperativeAffiliation: z.string().optional(),
}).strict();

const kycSchema = z.object({
  aadhaarNumber: z.string().min(4, 'At least 4 digits required'),
});

router.patch('/me', requireAuth, validate(updateSchema), userController.updateMe);
router.post('/me/kyc', requireAuth, validate(kycSchema), userController.verifyKyc);

// ─── Super Admin User Management Endpoints ────────────────────────────────────

const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Forbidden: Super Admin access required' });
  }
  next();
};

/**
 * GET /api/users
 * Returns list of users from PostgreSQL (Super Admin only).
 */
router.get('/', requireAuth, requireSuperAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
        phone: true,
        role: true,
        status: true,
        instituteId: true,
        cooperativeAffiliation: true,
        avatarUrl: true,
        isKycVerified: true,
      },
      orderBy: { id: 'asc' },
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/users
 * Creates a new user record in PostgreSQL (Super Admin only).
 */
router.post('/', requireAuth, requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, role, instituteId, cooperativeAffiliation, password } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ message: 'Name, email, and role are required' });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existing) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    const rawPassword = password || 'password123';
    const passwordHash = await bcrypt.hash(rawPassword, 10);
    const userId = `usr-${Date.now()}`;

    const newUser = await prisma.user.create({
      data: {
        id: userId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim() || '+91 98220 54321',
        passwordHash,
        role,
        instituteId: (role === 'institute_admin' || role === 'faculty') ? instituteId : null,
        cooperativeAffiliation: role === 'trainee' ? (cooperativeAffiliation || 'Primary Agricultural Cooperative Society') : null,
        status: 'active',
        isKycVerified: true,
        languagePreference: 'en',
      },
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
        phone: true,
        role: true,
        status: true,
        instituteId: true,
        cooperativeAffiliation: true,
        avatarUrl: true,
        isKycVerified: true,
      },
    });

    res.status(201).json(newUser);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/users/:id/status
 * Updates user active/suspended status in PostgreSQL (Super Admin only).
 */
router.patch('/:id/status', requireAuth, requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'suspended'].includes(status)) {
      return res.status(400).json({ message: "Valid status ('active' or 'suspended') is required" });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/users/:id/role
 * Updates user role in PostgreSQL (Super Admin only).
 */
router.patch('/:id/role', requireAuth, requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ message: 'Role is required' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
