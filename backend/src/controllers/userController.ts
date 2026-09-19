// ============================================================
// USER CONTROLLER
// ============================================================
// Handles staff creation and management by Hotel Owners
// ============================================================

import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

// ============================================================
// VALIDATION SCHEMAS
// ============================================================

const createStaffSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['KITCHEN', 'WAITER']),
});

// ============================================================
// CREATE STAFF (Owner Only)
// ============================================================

export const createStaff = async (req: any, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'OWNER') {
      res.status(403).json({
        success: false,
        error: 'Only hotel owners can create staff.',
      });
      return;
    }

    const validationResult = createStaffSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
      return;
    }

    const { email, password, name, role } = validationResult.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'User with this email already exists.',
      });
      return;
    }

    const hotel = await prisma.hotel.findUnique({
      where: { id: req.user.hotelId! },
    });

    if (!hotel) {
      res.status(404).json({
        success: false,
        error: 'Hotel not found.',
      });
      return;
    }

    const staffCount = await prisma.user.count({
      where: { hotelId: req.user.hotelId! },
    });

    if (staffCount >= hotel.maxStaff) {
      res.status(402).json({
        success: false,
        error: `Staff limit reached. Maximum ${hotel.maxStaff} staff allowed.`,
      });
      return;
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const staff = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role as Role,
        hotelId: req.user.hotelId!,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        hotelId: true,
        isActive: true,
        createdAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'STAFF_CREATED',
        resource: 'User',
        resourceId: staff.id,
        hotelId: req.user.hotelId,
        metadata: {
          staffEmail: staff.email,
          staffRole: staff.role,
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Staff member created successfully.',
      data: staff,
    });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create staff member.',
    });
  }
};

// ============================================================
// GET HOTEL STAFF (Owner Only)
// ============================================================

export const getHotelStaff = async (req: any, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'OWNER') {
      res.status(403).json({
        success: false,
        error: 'Only hotel owners can view staff.',
      });
      return;
    }

    const staff = await prisma.user.findMany({
      where: { hotelId: req.user.hotelId! },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch staff.',
    });
  }
};

// ============================================================
// TOGGLE STAFF STATUS (Owner Only)
// ============================================================

export const toggleStaffStatus = async (req: any, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'OWNER') {
      res.status(403).json({
        success: false,
        error: 'Only hotel owners can modify staff.',
      });
      return;
    }

    const { staffId } = req.params;

    const staff = await prisma.user.findFirst({
      where: {
        id: staffId,
        hotelId: req.user.hotelId!,
      },
    });

    if (!staff) {
      res.status(404).json({
        success: false,
        error: 'Staff member not found.',
      });
      return;
    }

    const updatedStaff = await prisma.user.update({
      where: { id: staffId },
      data: { isActive: !staff.isActive },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    res.status(200).json({
      success: true,
      message: `Staff member ${updatedStaff.isActive ? 'activated' : 'deactivated'}.`,
      data: updatedStaff,
    });
  } catch (error) {
    console.error('Toggle staff status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update staff status.',
    });
  }
};
