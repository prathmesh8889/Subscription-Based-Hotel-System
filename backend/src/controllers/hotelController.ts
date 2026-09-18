// ============================================================
// HOTEL CONTROLLER
// ============================================================
// Handles hotel creation and management by Super Admin
// ============================================================

import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/auth';
import { SubscriptionPlan } from '@prisma/client';

// ============================================================
// VALIDATION SCHEMAS
// ============================================================

const createHotelSchema = z.object({
  name: z.string().min(2, 'Hotel name must be at least 2 characters'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional(),
  subscriptionPlan: z.enum(['TRIAL', 'STARTER', 'PRO', 'BUSINESS']),
  subscriptionDays: z.number().min(1).max(365).default(14),
  ownerEmail: z.string().email('Invalid owner email'),
  ownerPassword: z.string().min(8, 'Password must be at least 8 characters'),
  ownerName: z.string().min(2, 'Owner name must be at least 2 characters'),
});

// ============================================================
// CREATE HOTEL AND OWNER
// ============================================================

export const createHotelAndOwner = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Only Super Admin can create hotels.',
      });
      return;
    }

    const validationResult = createHotelSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
      return;
    }

    const {
      name,
      address,
      phone,
      email,
      subscriptionPlan,
      subscriptionDays,
      ownerEmail,
      ownerPassword,
      ownerName,
    } = validationResult.data;

    const existingOwner = await prisma.user.findUnique({
      where: { email: ownerEmail },
    });

    if (existingOwner) {
      res.status(409).json({
        success: false,
        error: 'Owner with this email already exists.',
      });
      return;
    }

    const subscriptionStart = new Date();
    const subscriptionEnd = new Date();
    subscriptionEnd.setDate(subscriptionEnd.getDate() + subscriptionDays);

    const planLimits = {
      TRIAL: { maxTables: 5, maxMenuItems: 20, maxStaff: 3 },
      STARTER: { maxTables: 10, maxMenuItems: 50, maxStaff: 5 },
      PRO: { maxTables: 25, maxMenuItems: 150, maxStaff: 15 },
      BUSINESS: { maxTables: 100, maxMenuItems: 500, maxStaff: 50 },
    };

    const limits = planLimits[subscriptionPlan as keyof typeof planLimits];

    const result = await prisma.$transaction(async (tx) => {
      const hotel = await tx.hotel.create({
        data: {
          name,
          address,
          phone,
          email,
          subscriptionPlan: subscriptionPlan as SubscriptionPlan,
          subscriptionStart,
          subscriptionEnd,
          isActive: true,
          maxTables: limits.maxTables,
          maxMenuItems: limits.maxMenuItems,
          maxStaff: limits.maxStaff,
        },
      });

      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');
      const hashedPassword = await bcrypt.hash(ownerPassword, saltRounds);

      const owner = await tx.user.create({
        data: {
          email: ownerEmail,
          password: hashedPassword,
          name: ownerName,
          role: 'OWNER',
          hotelId: hotel.id,
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          hotelId: true,
        },
      });

      return { hotel, owner };
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'HOTEL_CREATED',
        resource: 'Hotel',
        resourceId: result.hotel.id,
        metadata: {
          hotelName: result.hotel.name,
          ownerEmail: result.owner.email,
          subscriptionPlan: result.hotel.subscriptionPlan,
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Hotel and owner created successfully.',
      data: {
        hotel: {
          id: result.hotel.id,
          name: result.hotel.name,
          subscriptionPlan: result.hotel.subscriptionPlan,
          subscriptionEnd: result.hotel.subscriptionEnd,
        },
        owner: result.owner,
      },
    });
  } catch (error) {
    console.error('Create hotel error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create hotel.',
    });
  }
};

// ============================================================
// GET ALL HOTELS (Super Admin Only)
// ============================================================

export const getAllHotels = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Only Super Admin can view all hotels.',
      });
      return;
    }

    const hotels = await prisma.hotel.findMany({
      include: {
        _count: {
          select: {
            users: true,
            tables: true,
            menuItems: true,
            orders: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: hotels,
    });
  } catch (error) {
    console.error('Get all hotels error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch hotels.',
    });
  }
};
