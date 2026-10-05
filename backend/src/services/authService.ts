import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/prisma';
import { userRepository } from '../repositories/userRepository';
import { comparePassword, hashPassword } from '../utils/hashPassword';
import { createError } from '../middleware/errorHandler';

const JWT_SECRET = () => process.env.JWT_SECRET!;
const JWT_EXPIRES = '7d';

/** Strip passwordHash before returning user to client */
const sanitizeUser = (user: any) => {
  const { passwordHash, ...rest } = user;
  return rest;
};

export const authService = {
  register: async (data: {
    fullName: string;
    email: string;
    password: string;
    role: string;
    phone?: string;
    profileDetails?: Record<string, any>;
    eKycStatus?: string;
  }) => {
    const email = (data.email || '').toLowerCase().trim();
    if (!email) throw createError(400, 'Email address is required.');
    if (!data.fullName || !data.fullName.trim()) throw createError(400, 'Full name is required.');
    if (!data.password || data.password.length < 6) {
      throw createError(400, 'Password must be at least 6 characters.');
    }

    const rawRole = (data.role || 'TRAINEE').toUpperCase().trim();
    const roleMapping: Record<string, string> = {
      'TRAINEE': 'trainee',
      'LEARNER': 'trainee',
      'FACULTY': 'faculty',
      'INSTITUTE_ADMIN': 'institute_admin',
      'INSTITUTE': 'institute_admin',
      'EMPLOYER': 'employer',
      'PARTNER': 'employer',
      'DEVICE_OPERATOR': 'device_operator',
      'DEVICE': 'device_operator',
      'device_operator': 'device_operator',
    };

    const role = roleMapping[rawRole];
    if (!role || role === 'super_admin') {
      throw createError(400, 'Invalid registration role selected.');
    }

    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw createError(409, 'An account with this email address already exists.');
    }

    // Generate unique NCCT Registration / Employee ID
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    let employeeId = '';
    if (role === 'trainee') {
      employeeId = `NCCT-TRN-2026-MH-${randomDigits}`;
    } else if (role === 'faculty') {
      employeeId = data.profileDetails?.employeeId || `NCCT-FAC-2026-MH-${Math.floor(100 + Math.random() * 900)}`;
    } else if (role === 'institute_admin') {
      employeeId = `NCCT-INS-2026-MH-${Math.floor(100 + Math.random() * 900)}`;
    } else if (role === 'employer') {
      employeeId = `NCCT-EMP-2026-KA-${Math.floor(100 + Math.random() * 900)}`;
    } else if (role === 'device_operator') {
      employeeId = `NCCT-DEV-2026-MH-${Math.floor(100 + Math.random() * 900)}`;
    }

    const passwordHash = await hashPassword(data.password);
    const userId = `usr-${role.replace('_', '-')}-${Date.now().toString(36)}`;
    const eKycStatus = data.eKycStatus === 'VERIFIED' ? 'VERIFIED' : 'NOT_VERIFIED';

    const affiliation =
      data.profileDetails?.cooperativeAffiliation ||
      data.profileDetails?.organizationName ||
      data.profileDetails?.instituteName ||
      null;

    const user = await prisma.user.create({
      data: {
        id: userId,
        name: data.fullName.trim(),
        email,
        employeeId,
        passwordHash,
        phone: (data.phone || data.profileDetails?.mobile || '').trim(),
        role,
        languagePreference: data.profileDetails?.preferredLanguage || 'en',
        instituteId: data.profileDetails?.instituteId || (role === 'faculty' ? 'inst-vamnicom' : null),
        cooperativeAffiliation: affiliation,
        isKycVerified: eKycStatus === 'VERIFIED',
        status: 'active',
        eKycStatus,
      },
    });

    if (role === 'trainee') {
      const publicToken = crypto.randomBytes(16).toString('hex');
      await prisma.traineePublicProfile.create({
        data: {
          userId: user.id,
          publicToken,
          registrationId: employeeId,
          isActive: true,
        },
      }).catch(() => { /* ignore if already exists */ });
    }

    return {
      user: sanitizeUser(user),
      registrationId: employeeId,
      message: 'Account created successfully',
    };
  },
  login: async (identifier: string, password: string, rememberMe = false) => {
    const user = await userRepository.findByIdentifier(identifier);
    if (!user) {
      throw createError(401, 'Invalid email/employee ID or password.');
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      throw createError(401, 'Invalid email/employee ID or password.');
    }

    // Account status validation
    const status = (user.status || 'active').toLowerCase().trim();
    if (status === 'suspended') {
      throw createError(403, 'Your account has been temporarily suspended. Please contact support.');
    }
    if (status === 'pending') {
      throw createError(403, 'Your account is pending verification.');
    }
    if (status === 'disabled' || status === 'deactivated') {
      throw createError(403, 'Your account is currently disabled.');
    }

    const expiresIn = rememberMe ? '30d' : '1d';

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET(),
      { expiresIn }
    );

    return { token, user: sanitizeUser(user) };
  },

  getMe: async (userId: string) => {
    const user = await userRepository.findById(userId);
    if (!user) throw createError(404, 'User not found');
    return sanitizeUser(user);
  },
};
