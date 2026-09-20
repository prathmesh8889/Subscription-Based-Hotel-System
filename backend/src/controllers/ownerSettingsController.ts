import { Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';

const profileSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  hotelName: z.string().min(2).max(150),
  address: z.string().max(300).optional().default(''),
  phone: z.string().max(30).optional().default(''),
  businessEmail: z.union([z.string().email(), z.literal('')]).optional().default(''),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(10, 'New password must be at least 10 characters'),
});

export async function getOwnerSettings(req: any, res: Response) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        lastLoginAt: true,
        hotel: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            email: true,
            subscriptionPlan: true,
            subscriptionStart: true,
            subscriptionEnd: true,
            maxTables: true,
            maxMenuItems: true,
            maxStaff: true,
            isActive: true,
          },
        },
      },
    });

    if (!user || user.role !== 'OWNER' || !user.hotel) {
      res.status(404).json({ success: false, error: 'Owner account or hotel not found.' });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Owner settings error:', error);
    res.status(500).json({ success: false, error: 'Failed to load owner settings.' });
  }
}

export async function updateOwnerSettings(req: any, res: Response) {
  try {
    const parsed = profileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message || 'Invalid settings.',
      });
      return;
    }

    const hotelId = req.user.hotelId;
    if (!hotelId) {
      res.status(403).json({ success: false, error: 'No hotel assigned.' });
      return;
    }

    const email = parsed.data.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== req.user.userId) {
      res.status(409).json({ success: false, error: 'This login email is already in use.' });
      return;
    }

    const [user, hotel] = await prisma.$transaction([
      prisma.user.update({
        where: { id: req.user.userId },
        data: {
          name: parsed.data.name.trim(),
          email,
        },
        select: { id: true, name: true, email: true },
      }),
      prisma.hotel.update({
        where: { id: hotelId },
        data: {
          name: parsed.data.hotelName.trim(),
          address: parsed.data.address.trim() || null,
          phone: parsed.data.phone.trim() || null,
          email: parsed.data.businessEmail.trim() || null,
        },
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
          email: true,
          subscriptionPlan: true,
          subscriptionEnd: true,
        },
      }),
    ]);

    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'OWNER_SETTINGS_UPDATED',
        resource: 'Hotel',
        resourceId: hotelId,
        hotelId,
        metadata: { ownerEmail: user.email, hotelName: hotel.name },
      },
    });

    res.json({ success: true, message: 'Settings updated successfully.', data: { user, hotel } });
  } catch (error) {
    console.error('Update owner settings error:', error);
    res.status(500).json({ success: false, error: 'Failed to update settings.' });
  }
}

export async function changeOwnerPassword(req: any, res: Response) {
  try {
    const parsed = passwordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message || 'Invalid password.',
      });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user || user.role !== 'OWNER') {
      res.status(404).json({ success: false, error: 'Owner account not found.' });
      return;
    }

    const valid = await bcrypt.compare(parsed.data.currentPassword, user.password);
    if (!valid) {
      res.status(400).json({ success: false, error: 'Current password is incorrect.' });
      return;
    }

    const same = await bcrypt.compare(parsed.data.newPassword, user.password);
    if (same) {
      res.status(400).json({ success: false, error: 'New password must be different.' });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(parsed.data.newPassword, 12) },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'OWNER_PASSWORD_CHANGED',
        resource: 'User',
        resourceId: user.id,
        hotelId: user.hotelId,
      },
    });

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Owner password change error:', error);
    res.status(500).json({ success: false, error: 'Failed to change password.' });
  }
}
