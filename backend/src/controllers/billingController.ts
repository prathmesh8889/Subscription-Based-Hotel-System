// ============================================================
// BILLING CONTROLLER
// ============================================================
// Handles invoice generation, GST calculation, and payment processing
// ============================================================

import { Request, Response } from 'express';
import { prisma } from '../config/database';

// ============================================================
// GST CONFIGURATION
// ============================================================
// Restaurant GST in India: 5% (2.5% CGST + 2.5% SGST)
const GST_RATE = 0.05; // 5%

// ============================================================
// GENERATE BILL NUMBER
// ============================================================
// Format: BILL-YYYYMMDD-XXXXXX (6-digit random)

const generateBillNumber = (): string => {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `BILL-${dateStr}-${random}`;
};

// ============================================================
// GET UNPAID ORDERS
// ============================================================

export const getUnpaidOrders = async (req: any, res: Response): Promise<void> => {
  try {
    const { hotelId } = req.query;

    if (!hotelId || typeof hotelId !== 'string') {
      res.status(400).json({
        success: false,
        error: 'hotelId is required',
      });
      return;
    }

    // Validate user has access to this hotel
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.hotelId !== hotelId) {
      res.status(403).json({
        success: false,
        error: 'Unauthorized: Cannot access orders from different hotel',
      });
      return;
    }

    // Fetch unpaid orders
    const orders = await prisma.order.findMany({
      where: {
        hotelId,
        paymentStatus: 'UNPAID',
        status: 'SERVED', // Only show served orders for billing
      },
      include: {
        table: {
          select: {
            tableNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate totals
    const totalAmount = orders.reduce((sum, order) => {
      return sum + Number(order.totalAmount);
    }, 0);

    res.status(200).json({
      success: true,
      data: {
        orders,
        totalAmount,
        count: orders.length,
      },
    });
  } catch (error) {
    console.error('Get unpaid orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unpaid orders',
    });
  }
};

// ============================================================
// GENERATE INVOICE
// ============================================================

export const generateInvoice = async (req: any, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      res.status(400).json({
        success: false,
        error: 'orderId is required',
      });
      return;
    }

    // Fetch order with all details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        table: {
          select: {
            tableNumber: true,
          },
        },
        hotel: {
          select: {
            name: true,
            address: true,
            phone: true,
            email: true,
          },
        },
        creator: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found',
      });
      return;
    }

    // Validate user has access
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.hotelId !== order.hotelId) {
      res.status(403).json({
        success: false,
        error: 'Unauthorized: Cannot access order from different hotel',
      });
      return;
    }

    // Calculate GST
    const subtotal = Number(order.totalAmount);
    const cgst = subtotal * (GST_RATE / 2); // 2.5%
    const sgst = subtotal * (GST_RATE / 2); // 2.5%
    const totalGST = cgst + sgst;
    const grandTotal = subtotal + totalGST;

    // Generate bill number
    const billNumber = generateBillNumber();

    // Prepare invoice data
    const invoice = {
      billNumber,
      order: {
        id: order.id,
        tableNumber: order.table.tableNumber,
        items: order.items as any[],
        subtotal,
        cgst: Math.round(cgst * 100) / 100,
        sgst: Math.round(sgst * 100) / 100,
        totalGST: Math.round(totalGST * 100) / 100,
        grandTotal: Math.round(grandTotal * 100) / 100,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
      },
      hotel: {
        name: order.hotel.name,
        address: order.hotel.address,
        phone: order.hotel.phone,
        email: order.hotel.email,
      },
      waiter: order.creator?.name || 'N/A',
      generatedAt: new Date().toISOString(),
    };

    // Log to audit
    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'INVOICE_GENERATED',
        resource: 'Order',
        resourceId: order.id,
        hotelId: order.hotelId,
        metadata: {
          billNumber,
          grandTotal: invoice.order.grandTotal,
        },
      },
    });

    res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error('Generate invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate invoice',
    });
  }
};

// ============================================================
// PROCESS PAYMENT
// ============================================================

export const processPayment = async (req: any, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { paymentMethod } = req.body;

    if (!orderId) {
      res.status(400).json({
        success: false,
        error: 'orderId is required',
      });
      return;
    }

    if (!paymentMethod || !['CASH', 'UPI', 'CARD'].includes(paymentMethod)) {
      res.status(400).json({
        success: false,
        error: 'Valid paymentMethod is required (CASH, UPI, or CARD)',
      });
      return;
    }

    // Validate user role (WAITER or OWNER only)
    if (!['WAITER', 'OWNER', 'SUPER_ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({
        success: false,
        error: 'Unauthorized: Only waiters and owners can process payments',
      });
      return;
    }

    // Fetch order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found',
      });
      return;
    }

    // Validate user has access
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.hotelId !== order.hotelId) {
      res.status(403).json({
        success: false,
        error: 'Unauthorized: Cannot access order from different hotel',
      });
      return;
    }

    // Check if already paid
    if (order.paymentStatus === 'PAID') {
      res.status(400).json({
        success: false,
        error: 'Order is already paid',
      });
      return;
    }

    // Update payment status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'PAID',
        paymentMethod: paymentMethod as any,
      },
    });

    // Log to audit
    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'PAYMENT_PROCESSED',
        resource: 'Order',
        resourceId: order.id,
        hotelId: order.hotelId,
        metadata: {
          paymentMethod,
          amount: Number(order.totalAmount),
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        orderId: updatedOrder.id,
        paymentStatus: updatedOrder.paymentStatus,
        paymentMethod: updatedOrder.paymentMethod,
      },
    });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process payment',
    });
  }
};

// ============================================================
// GET BILLING SUMMARY
// ============================================================

export const getBillingSummary = async (req: any, res: Response): Promise<void> => {
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
        error: 'Unauthorized: Cannot access billing from different hotel',
      });
      return;
    }

    // Build date filter
    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    // Fetch paid orders
    const paidOrders = await prisma.order.findMany({
      where: {
        hotelId,
        paymentStatus: 'PAID',
        ...dateFilter,
      },
    });

    // Calculate totals
    const totalRevenue = paidOrders.reduce((sum, order) => {
      return sum + Number(order.totalAmount);
    }, 0);

    const totalGST = totalRevenue * GST_RATE;
    const netRevenue = totalRevenue;

    // Payment method breakdown
    const paymentBreakdown = {
      CASH: paidOrders.filter(o => o.paymentMethod === 'CASH').reduce((sum, o) => sum + Number(o.totalAmount), 0),
      UPI: paidOrders.filter(o => o.paymentMethod === 'UPI').reduce((sum, o) => sum + Number(o.totalAmount), 0),
      CARD: paidOrders.filter(o => o.paymentMethod === 'CARD').reduce((sum, o) => sum + Number(o.totalAmount), 0),
    };

    // Unpaid orders
    const unpaidOrders = await prisma.order.findMany({
      where: {
        hotelId,
        paymentStatus: 'UNPAID',
        status: 'SERVED',
      },
    });

    const pendingAmount = unpaidOrders.reduce((sum, order) => {
      return sum + Number(order.totalAmount);
    }, 0);

    res.status(200).json({
      success: true,
      data: {
        totalOrders: paidOrders.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalGST: Math.round(totalGST * 100) / 100,
        netRevenue: Math.round(netRevenue * 100) / 100,
        paymentBreakdown: {
          CASH: Math.round(paymentBreakdown.CASH * 100) / 100,
          UPI: Math.round(paymentBreakdown.UPI * 100) / 100,
          CARD: Math.round(paymentBreakdown.CARD * 100) / 100,
        },
        pendingOrders: unpaidOrders.length,
        pendingAmount: Math.round(pendingAmount * 100) / 100,
        gstRate: GST_RATE * 100, // 5%
      },
    });
  } catch (error) {
    console.error('Get billing summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch billing summary',
    });
  }
};
