import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';

export const PLAN_LIMITS = {
  TRIAL: { maxTables: 5, maxMenuItems: 20, maxStaff: 3, price: 0 },
  STARTER: { maxTables: 10, maxMenuItems: 50, maxStaff: 5, price: 499 },
  PRO: { maxTables: 25, maxMenuItems: 150, maxStaff: 15, price: 999 },
  BUSINESS: { maxTables: 100, maxMenuItems: 500, maxStaff: 50, price: 1999 },
} as const;

const schema = z.object({
  plan: z.enum(['TRIAL', 'STARTER', 'PRO', 'BUSINESS']).optional(),
  extendDays: z.number().int().min(0).max(365).optional(),
  isActive: z.boolean().optional(),
});

export async function getSubscriptions(_req: any, res: Response) {
  try {
    const hotels = await prisma.hotel.findMany({
      include: {
        users: { where: { role: 'OWNER' }, select: { name: true, email: true }, take: 1 },
        _count: { select: { users: true, tables: true, menuItems: true, orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const now = Date.now();
    res.json({
      success: true,
      data: hotels.map(h => {
        const daysRemaining = Math.ceil((h.subscriptionEnd.getTime() - now) / 86400000);
        return {
          ...h,
          owner: h.users[0] || null,
          users: undefined,
          daysRemaining,
          subscriptionStatus: !h.isActive ? 'INACTIVE' : daysRemaining < 0 ? 'EXPIRED' : 'ACTIVE',
          planPrice: PLAN_LIMITS[h.subscriptionPlan].price,
        };
      }),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to load subscriptions.' });
  }
}

export async function updateSubscription(req: any, res: Response) {
  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid subscription update.' });
      return;
    }
    const hotel = await prisma.hotel.findUnique({ where: { id: req.params.id } });
    if (!hotel) {
      res.status(404).json({ success: false, error: 'Hotel not found.' });
      return;
    }
    const data: any = {};
    if (parsed.data.plan) {
      const limits = PLAN_LIMITS[parsed.data.plan];
      Object.assign(data, {
        subscriptionPlan: parsed.data.plan,
        maxTables: limits.maxTables,
        maxMenuItems: limits.maxMenuItems,
        maxStaff: limits.maxStaff,
      });
    }
    if (parsed.data.extendDays && parsed.data.extendDays > 0) {
      const base = hotel.subscriptionEnd.getTime() > Date.now() ? hotel.subscriptionEnd : new Date();
      const nextEnd = new Date(base);
      nextEnd.setDate(nextEnd.getDate() + parsed.data.extendDays);
      data.subscriptionEnd = nextEnd;
      data.isActive = true;
    }
    if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;
    const updated = await prisma.hotel.update({ where: { id: hotel.id }, data });
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'SUBSCRIPTION_UPDATED',
        resource: 'Hotel',
        resourceId: hotel.id,
        hotelId: hotel.id,
        metadata: parsed.data,
      },
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to update subscription.' });
  }
}
