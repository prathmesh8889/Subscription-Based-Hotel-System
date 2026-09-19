import { Response } from 'express';
import { prisma } from '../config/database';

export async function getPlatformAnalytics(_req: any, res: Response) {
  try {
    const now = new Date();
    const start30 = new Date(Date.now() - 29 * 86400000);

    const [hotels, userCount, orderCount, paidAgg, planGroups, statusGroups, recentOrders] = await Promise.all([
      prisma.hotel.findMany({ select: { id: true, name: true, isActive: true, subscriptionEnd: true } }),
      prisma.user.count(),
      prisma.order.count(),
      prisma.order.aggregate({ where: { paymentStatus: 'PAID' }, _sum: { totalAmount: true } }),
      prisma.hotel.groupBy({ by: ['subscriptionPlan'], _count: { _all: true } }),
      prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.order.findMany({
        where: { createdAt: { gte: start30 } },
        select: { createdAt: true, totalAmount: true, paymentStatus: true, hotelId: true },
      }),
    ]);

    const days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(start30);
      d.setDate(start30.getDate() + i);
      return { date: d.toISOString().slice(0, 10), orders: 0, revenue: 0 };
    });
    const dayMap = new Map(days.map(d => [d.date, d]));

    const hotelStats = new Map<string, { hotelId: string; name: string; orders: number; revenue: number }>();
    for (const h of hotels) hotelStats.set(h.id, { hotelId: h.id, name: h.name, orders: 0, revenue: 0 });

    for (const order of recentOrders) {
      const day = dayMap.get(order.createdAt.toISOString().slice(0, 10));
      if (day) {
        day.orders += 1;
        if (order.paymentStatus === 'PAID') day.revenue += Number(order.totalAmount);
      }
      const stat = hotelStats.get(order.hotelId);
      if (stat) {
        stat.orders += 1;
        if (order.paymentStatus === 'PAID') stat.revenue += Number(order.totalAmount);
      }
    }

    const expired = hotels.filter(h => h.subscriptionEnd.getTime() < now.getTime()).length;
    const active = hotels.filter(h => h.isActive && h.subscriptionEnd.getTime() >= now.getTime()).length;

    res.json({
      success: true,
      data: {
        summary: {
          totalHotels: hotels.length,
          activeHotels: active,
          expiredHotels: expired,
          totalUsers: userCount,
          totalOrders: orderCount,
          paidRevenue: Number(paidAgg._sum.totalAmount || 0),
        },
        planDistribution: planGroups.map(g => ({ plan: g.subscriptionPlan, count: g._count._all })),
        orderStatusDistribution: statusGroups.map(g => ({ status: g.status, count: g._count._all })),
        daily: days,
        topHotels: [...hotelStats.values()].sort((a, b) => b.revenue - a.revenue || b.orders - a.orders).slice(0, 5),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to load platform analytics.' });
  }
}
