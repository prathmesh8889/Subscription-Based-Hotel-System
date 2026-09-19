import { Response } from 'express';
import { prisma } from '../config/database';
import { getIO } from '../socket';

const serializeOrder = (order: any) => ({
  ...order,
  totalAmount: Number(order.totalAmount),
  tableNumber: order.table?.tableNumber,
});

export const getOrders = async (req: any, res: Response) => {
  const hotelId = req.user?.hotelId;
  if (!hotelId) {
    res.status(403).json({ success: false, error: 'No hotel assigned.' });
    return;
  }

  const where: any = { hotelId };
  if (req.query.status) where.status = req.query.status;
  if (req.query.paymentStatus) where.paymentStatus = req.query.paymentStatus;

  const orders = await prisma.order.findMany({
    where,
    include: { table: { select: { tableNumber: true } } },
    orderBy: { createdAt: 'desc' },
    take: 250,
  });

  res.json({ success: true, data: orders.map(serializeOrder) });
};

export const updateOrderStatus = async (req: any, res: Response) => {
  const hotelId = req.user?.hotelId;
  const status = req.body.status;

  const order = await prisma.order.findFirst({
    where: { id: req.params.id, hotelId },
  });

  if (!order || !['PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'].includes(status)) {
    res.status(400).json({ success: false, error: 'Invalid order/status.' });
    return;
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status,
      handledBy: req.user.userId,
    },
    include: { table: { select: { tableNumber: true } } },
  });

  if (status === 'SERVED' || status === 'CANCELLED') {
    await prisma.table.update({
      where: { id: order.tableId },
      data: { status: 'AVAILABLE' },
    });
  }

  const payload = {
    orderId: updated.id,
    status: updated.status,
    paymentStatus: updated.paymentStatus,
    paymentMethod: updated.paymentMethod,
    updatedAt: updated.updatedAt,
  };

  getIO()?.to('hotel:' + hotelId).emit('order_status_updated', payload);
  getIO()?.of('/customer').to('customer-order:' + updated.id).emit('order_updated', payload);

  res.json({ success: true, data: serializeOrder(updated) });
};
