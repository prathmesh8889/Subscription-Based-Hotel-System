import { Response } from 'express';
import { prisma } from '../config/database';

export async function getNotifications(_req: any, res: Response) {
  try {
    const hotels = await prisma.hotel.findMany({
      select: { id: true, name: true, subscriptionPlan: true, subscriptionEnd: true, isActive: true, createdAt: true },
      orderBy: { subscriptionEnd: 'asc' },
    });
    const now = Date.now();
    const notifications: any[] = [];
    for (const h of hotels) {
      const days = Math.ceil((h.subscriptionEnd.getTime() - now) / 86400000);
      if (!h.isActive) notifications.push({ id: 'inactive-' + h.id, type: 'warning', title: h.name + ' is inactive', message: 'Activate this hotel from Subscriptions when service should resume.', hotelId: h.id });
      else if (days < 0) notifications.push({ id: 'expired-' + h.id, type: 'critical', title: h.name + ' subscription expired', message: 'Expired ' + Math.abs(days) + ' day(s) ago. Renew to restore access.', hotelId: h.id });
      else if (days <= 7) notifications.push({ id: 'expiring-' + h.id, type: 'warning', title: h.name + ' expires soon', message: days + ' day(s) remaining on ' + h.subscriptionPlan + '.', hotelId: h.id });
      if (now - h.createdAt.getTime() < 86400000) notifications.push({ id: 'new-' + h.id, type: 'info', title: 'New hotel added', message: h.name + ' was created within the last 24 hours.', hotelId: h.id });
    }
    res.json({ success: true, data: { unreadCount: notifications.length, notifications: notifications.slice(0, 20) } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to load notifications.' });
  }
}
