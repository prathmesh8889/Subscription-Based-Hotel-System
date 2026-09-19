import { Response } from 'express';
import { prisma } from '../config/database';

export async function getClients(_req: any, res: Response) {
  try {
    const clients = await prisma.user.findMany({
      where: { role: 'OWNER' },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        hotel: {
          select: {
            id: true,
            name: true,
            subscriptionPlan: true,
            subscriptionStart: true,
            subscriptionEnd: true,
            isActive: true,
            maxTables: true,
            maxMenuItems: true,
            maxStaff: true,
            _count: {
              select: {
                users: true,
                tables: true,
                menuItems: true,
                orders: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: clients });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ success: false, error: 'Failed to load clients.' });
  }
}
