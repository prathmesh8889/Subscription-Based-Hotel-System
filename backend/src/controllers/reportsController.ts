// ============================================================
// REPORTS CONTROLLER
// ============================================================
// Handles revenue reports, order analytics, and business insights
// ============================================================

import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

// ============================================================
// GET REVENUE REPORT
// ============================================================

export const getRevenueReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { hotelId, startDate, endDate, groupBy = 'day' } = req.query;

    if (!hotelId || typeof hotelId !== 'string') {
      res.status(400).json({
        success: false,
        error: 'hotelId is required',
      });
      return;
    }

    // Validate user has access
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.hotelId !== hotelId) {
      res.status(403).json({
        success: false,
        error: 'Unauthorized: Cannot access reports from different hotel',
      });
      return;
    }

    // Build date filter
    const dateFilter: any = {
      paymentStatus: 'PAID',
      hotelId,
    };

    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    } else {
      // Default to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter.createdAt = {
        gte: thirtyDaysAgo,
      };
    }

    // Fetch paid orders
    const orders = await prisma.order.findMany({
      where: dateFilter,
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by time period
    const groupedData = new Map<string, { revenue: number; orders: number; gst: number }>();

    orders.forEach(order => {
      const date = new Date(order.createdAt);
      let key: string;

      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else if (groupBy === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        key = date.toISOString().split('T')[0];
      }

      const existing = groupedData.get(key) || { revenue: 0, orders: 0, gst: 0 };
      const amount = Number(order.totalAmount);
      const gst = amount * 0.05;

      groupedData.set(key, {
        revenue: existing.revenue + amount,
        orders: existing.orders + 1,
        gst: existing.gst + gst,
      });
    });

    // Convert to array and sort
    const reportData = Array.from(groupedData.entries())
      .map(([period, data]) => ({
        period,
        revenue: Math.round(data.revenue * 100) / 100,
        orders: data.orders,
        gst: Math.round(data.gst * 100) / 100,
        netRevenue: Math.round((data.revenue - data.gst) * 100) / 100,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    // Calculate totals
    const totalRevenue = reportData.reduce((sum, item) => sum + item.revenue, 0);
    const totalOrders = reportData.reduce((sum, item) => sum + item.orders, 0);
    const totalGST = reportData.reduce((sum, item) => sum + item.gst, 0);

    res.status(200).json({
      success: true,
      data: {
        reportData,
        summary: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalOrders,
          totalGST: Math.round(totalGST * 100) / 100,
          netRevenue: Math.round((totalRevenue - totalGST) * 100) / 100,
          averageOrderValue: totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0,
        },
        period: {
          startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: endDate || new Date().toISOString(),
          groupBy,
        },
      },
    });
  } catch (error) {
    console.error('Get revenue report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate revenue report',
    });
  }
};

// ============================================================
// GET ORDER ANALYTICS
// ============================================================

export const getOrderAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { hotelId, startDate, endDate } = req.query;

    if (!hotelId || typeof hotelId !== 'string') {
      res.status(400).json({
        success: false,
        error: 'hotelId is required',
      });
      return;
    }

    // Validate user has access
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.hotelId !== hotelId) {
      res.status(403).json({
        success: false,
        error: 'Unauthorized: Cannot access analytics from different hotel',
      });
      return;
    }

    // Build date filter
    const dateFilter: any = { hotelId };
    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    } else {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter.createdAt = {
        gte: thirtyDaysAgo,
      };
    }

    // Fetch all orders
    const orders = await prisma.order.findMany({
      where: dateFilter,
    });

    // Status breakdown
    const statusBreakdown = {
      PENDING: orders.filter(o => o.status === 'PENDING').length,
      PREPARING: orders.filter(o => o.status === 'PREPARING').length,
      READY: orders.filter(o => o.status === 'READY').length,
      SERVED: orders.filter(o => o.status === 'SERVED').length,
      CANCELLED: orders.filter(o => o.status === 'CANCELLED').length,
    };

    // Payment status breakdown
    const paymentStatusBreakdown = {
      PAID: orders.filter(o => o.paymentStatus === 'PAID').length,
      UNPAID: orders.filter(o => o.paymentStatus === 'UNPAID').length,
      REFUNDED: orders.filter(o => o.paymentStatus === 'REFUNDED').length,
    };

    // Hourly distribution
    const hourlyDistribution = new Array(24).fill(0);
    orders.forEach(order => {
      const hour = new Date(order.createdAt).getHours();
      hourlyDistribution[hour]++;
    });

    // Average preparation time (from PENDING to READY)
    const preparationTimes: number[] = [];
    orders.forEach(order => {
      if (order.status === 'READY' || order.status === 'SERVED') {
        // We'd need to track status change timestamps for accurate prep time
        // For now, we'll use a placeholder
        preparationTimes.push(15); // placeholder: 15 minutes average
      }
    });

    const avgPrepTime = preparationTimes.length > 0
      ? Math.round(preparationTimes.reduce((sum, time) => sum + time, 0) / preparationTimes.length)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        totalOrders: orders.length,
        statusBreakdown,
        paymentStatusBreakdown,
        hourlyDistribution,
        averagePreparationTime: avgPrepTime,
        completionRate: orders.length > 0
          ? Math.round((statusBreakdown.SERVED / orders.length) * 100)
          : 0,
      },
    });
  } catch (error) {
    console.error('Get order analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate order analytics',
    });
  }
};

// ============================================================
// GET TOP SELLING ITEMS
// ============================================================

export const getTopSellingItems = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { hotelId, startDate, endDate, limit = 10 } = req.query;

    if (!hotelId || typeof hotelId !== 'string') {
      res.status(400).json({
        success: false,
        error: 'hotelId is required',
      });
      return;
    }

    // Validate user has access
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.hotelId !== hotelId) {
      res.status(403).json({
        success: false,
        error: 'Unauthorized: Cannot access data from different hotel',
      });
      return;
    }

    // Build date filter
    const dateFilter: any = {
      hotelId,
      paymentStatus: 'PAID',
    };

    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    } else {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter.createdAt = {
        gte: thirtyDaysAgo,
      };
    }

    // Fetch paid orders
    const orders = await prisma.order.findMany({
      where: dateFilter,
    });

    // Aggregate items
    const itemMap = new Map<string, {
      menuItemId: string;
      name: string;
      quantity: number;
      revenue: number;
      orderCount: number;
    }>();

    orders.forEach(order => {
      const items = order.items as any[];
      items.forEach(item => {
        const existing = itemMap.get(item.menuItemId) || {
          menuItemId: item.menuItemId,
          name: item.name,
          quantity: 0,
          revenue: 0,
          orderCount: 0,
        };

        itemMap.set(item.menuItemId, {
          ...existing,
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + (item.price * item.quantity),
          orderCount: existing.orderCount + 1,
        });
      });
    });

    // Convert to array and sort by quantity
    const topItems = Array.from(itemMap.values())
      .map(item => ({
        ...item,
        revenue: Math.round(item.revenue * 100) / 100,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, Number(limit));

    res.status(200).json({
      success: true,
      data: {
        topItems,
        totalItemsSold: topItems.reduce((sum, item) => sum + item.quantity, 0),
        totalRevenue: Math.round(topItems.reduce((sum, item) => sum + item.revenue, 0) * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Get top selling items error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top selling items',
    });
  }
};

// ============================================================
// GET PAYMENT METHOD BREAKDOWN
// ============================================================

export const getPaymentBreakdown = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { hotelId, startDate, endDate } = req.query;

    if (!hotelId || typeof hotelId !== 'string') {
      res.status(400).json({
        success: false,
        error: 'hotelId is required',
      });
      return;
    }

    // Validate user has access
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.hotelId !== hotelId) {
      res.status(403).json({
        success: false,
        error: 'Unauthorized: Cannot access data from different hotel',
      });
      return;
    }

    // Build date filter
    const dateFilter: any = {
      hotelId,
      paymentStatus: 'PAID',
    };

    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    } else {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter.createdAt = {
        gte: thirtyDaysAgo,
      };
    }

    // Fetch paid orders
    const orders = await prisma.order.findMany({
      where: dateFilter,
    });

    // Calculate breakdown by payment method
    const breakdown = {
      CASH: {
        count: 0,
        amount: 0,
        percentage: 0,
      },
      UPI: {
        count: 0,
        amount: 0,
        percentage: 0,
      },
      CARD: {
        count: 0,
        amount: 0,
        percentage: 0,
      },
    };

    orders.forEach(order => {
      if (order.paymentMethod && breakdown[order.paymentMethod]) {
        breakdown[order.paymentMethod].count++;
        breakdown[order.paymentMethod].amount += Number(order.totalAmount);
      }
    });

    // Calculate percentages
    const totalAmount = Object.values(breakdown).reduce((sum, method) => sum + method.amount, 0);

    Object.keys(breakdown).forEach(method => {
      const key = method as keyof typeof breakdown;
      breakdown[key].amount = Math.round(breakdown[key].amount * 100) / 100;
      breakdown[key].percentage = totalAmount > 0
        ? Math.round((breakdown[key].amount / totalAmount) * 100)
        : 0;
    });

    res.status(200).json({
      success: true,
      data: {
        breakdown,
        totalTransactions: orders.length,
        totalAmount: Math.round(totalAmount * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Get payment breakdown error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment breakdown',
    });
  }
};

// ============================================================
// GET TABLE UTILIZATION
// ============================================================

export const getTableUtilization = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { hotelId, startDate, endDate } = req.query;

    if (!hotelId || typeof hotelId !== 'string') {
      res.status(400).json({
        success: false,
        error: 'hotelId is required',
      });
      return;
    }

    // Validate user has access
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.hotelId !== hotelId) {
      res.status(403).json({
        success: false,
        error: 'Unauthorized: Cannot access data from different hotel',
      });
      return;
    }

    // Fetch all tables
    const tables = await prisma.table.findMany({
      where: { hotelId },
      include: {
        orders: {
          where: startDate && endDate ? {
            createdAt: {
              gte: new Date(startDate as string),
              lte: new Date(endDate as string),
            },
          } : {},
        },
      },
    });

    // Calculate utilization for each table
    const tableStats = tables.map(table => {
      const orderCount = table.orders.length;
      const totalRevenue = table.orders.reduce((sum, order) => {
        return sum + Number(order.totalAmount);
      }, 0);

      return {
        tableId: table.id,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        orderCount,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        averageOrderValue: orderCount > 0
          ? Math.round((totalRevenue / orderCount) * 100) / 100
          : 0,
      };
    });

    // Sort by order count
    tableStats.sort((a, b) => b.orderCount - a.orderCount);

    // Calculate overall stats
    const totalOrders = tableStats.reduce((sum, table) => sum + table.orderCount, 0);
    const totalRevenue = tableStats.reduce((sum, table) => sum + table.totalRevenue, 0);

    res.status(200).json({
      success: true,
      data: {
        tables: tableStats,
        summary: {
          totalTables: tables.length,
          totalOrders,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          averageOrdersPerTable: tables.length > 0
            ? Math.round((totalOrders / tables.length) * 100) / 100
            : 0,
        },
      },
    });
  } catch (error) {
    console.error('Get table utilization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch table utilization',
    });
  }
};
