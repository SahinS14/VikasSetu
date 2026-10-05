/**
 * backend/src/services/deviceService.ts
 *
 * Physical Classroom Device Registry & Heartbeat Management for VikasSetu.
 * Tracks hardware kiosks (Raspberry Pi / ESP32-CAM) deployed in NCCT classrooms.
 */

import prisma from '../config/prisma';
import { createError } from '../middleware/errorHandler';

const HEARTBEAT_TIMEOUT_MS = 90 * 1000; // 90 seconds timeout for ONLINE state

export const deviceService = {
  /**
   * List all registered devices for an institute.
   */
  listDevices: async (instituteId?: string) => {
    const where = instituteId ? { instituteId } : {};
    const devices = await prisma.attendanceDevice.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    const now = Date.now();
    // Compute real-time status based on heartbeat
    return devices.map(dev => {
      const isAlive = (now - new Date(dev.lastSeenAt).getTime()) < HEARTBEAT_TIMEOUT_MS;
      return {
        ...dev,
        status: isAlive ? 'ONLINE' : 'OFFLINE',
      };
    });
  },

  /**
   * Get device by code
   */
  getDeviceByCode: async (deviceCode: string) => {
    return prisma.attendanceDevice.findUnique({
      where: { deviceCode },
    });
  },

  /**
   * Register a new classroom device
   */
  registerDevice: async (data: {
    deviceCode: string;
    classroomId: string;
    name: string;
    instituteId?: string;
  }) => {
    const existing = await prisma.attendanceDevice.findUnique({
      where: { deviceCode: data.deviceCode },
    });
    if (existing) {
      throw createError(409, `Device with code "${data.deviceCode}" is already registered.`);
    }

    return prisma.attendanceDevice.create({
      data: {
        deviceCode: data.deviceCode.trim(),
        classroomId: data.classroomId.trim(),
        name: data.name.trim(),
        instituteId: data.instituteId || 'inst-vamnicom',
        status: 'ONLINE',
        lastSeenAt: new Date(),
      },
    });
  },

  /**
   * Record periodic heartbeat from edge device
   */
  heartbeat: async (deviceCode: string) => {
    const device = await prisma.attendanceDevice.findUnique({
      where: { deviceCode },
    });
    if (!device) {
      throw createError(404, `Device "${deviceCode}" not found in registry.`);
    }

    return prisma.attendanceDevice.update({
      where: { deviceCode },
      data: {
        lastSeenAt: new Date(),
        status: 'ONLINE',
      },
    });
  },
};
