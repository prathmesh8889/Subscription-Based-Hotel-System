import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { getIO } from '../socket';

const orderSchema = z.object({
  hotelId: z.string(),
  tableId: z.string(),
  token: z.string().min(20),
  items: z.array(z.object({
    menuItemId: z.string(),
    quantity: z.number().int().min(1).max(20),
  })).min(1),
});

async function getAccess(hotelId: string, tableId: string, token: string) {
  const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
  if (!hotel || !hotel.isActive || hotel.subscriptionEnd.getTime() < Date.now()) return null;

  const table = await prisma.table.findFirst({
    where: { id: tableId, hotelId, qrToken: token },
  });
  return table ? { hotel, table } : null;
}

function serializeOrder(order: any) {
  return {
    id: order.id,
    orderId: order.id,
    hotelId: order.hotelId,
    tableId: order.tableId,
    tableNumber: order.table?.tableNumber,
    hotel: order.hotel ? {
      id: order.hotel.id,
      name: order.hotel.name,
      address: order.hotel.address,
      phone: order.hotel.phone,
    } : undefined,
    items: order.items,
    totalAmount: Number(order.totalAmount),
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    notes: order.notes,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export const getPublicMenu = async (req: Request, res: Response) => {
  const access = await getAccess(
    req.params.hotelId,
    String(req.query.tableId || ''),
    String(req.query.token || '')
  );

  if (!access) {
    res.status(403).json({ success: false, error: 'Invalid table QR code.' });
    return;
  }

  const menuItems = await prisma.menuItem.findMany({
    where: { hotelId: req.params.hotelId, isAvailable: true },
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
  });

  res.json({
    success: true,
    data: {
      hotel: { id: access.hotel.id, name: access.hotel.name },
      table: { id: access.table.id, tableNumber: access.table.tableNumber },
      menuItems: menuItems.map(item => ({ ...item, price: Number(item.price) })),
    },
  });
};

export const getPublicOrder = async (req: Request, res: Response) => {
  const hotelId = String(req.query.hotelId || '');
  const tableId = String(req.query.tableId || '');
  const token = String(req.query.token || '');

  const access = await getAccess(hotelId, tableId, token);
  if (!access) {
    res.status(403).json({ success: false, error: 'Invalid table QR code.' });
    return;
  }

  const order = await prisma.order.findFirst({
    where: {
      id: req.params.orderId,
      hotelId,
      tableId,
    },
    include: {
      table: { select: { tableNumber: true } },
      hotel: { select: { id: true, name: true, address: true, phone: true } },
    },
  });

  if (!order) {
    res.status(404).json({ success: false, error: 'Order not found.' });
    return;
  }

  res.json({ success: true, data: serializeOrder(order) });
};

export const createPublicOrder = async (req: Request, res: Response) => {
  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Invalid order.' });
    return;
  }

  const data = parsed.data;
  const access = await getAccess(data.hotelId, data.tableId, data.token);
  if (!access) {
    res.status(403).json({ success: false, error: 'Invalid table QR code.' });
    return;
  }

  const ids = [...new Set(data.items.map(item => item.menuItemId))];
  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: { in: ids },
      hotelId: data.hotelId,
      isAvailable: true,
    },
  });

  if (menuItems.length !== ids.length) {
    res.status(400).json({ success: false, error: 'Unavailable menu item.' });
    return;
  }

  const itemMap = new Map(menuItems.map(item => [item.id, item]));
  const items = data.items.map(item => {
    const menuItem = itemMap.get(item.menuItemId)!;
    return {
      menuItemId: menuItem.id,
      name: menuItem.name,
      price: Number(menuItem.price),
      quantity: item.quantity,
    };
  });

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const order = await prisma.order.create({
    data: {
      hotelId: data.hotelId,
      tableId: data.tableId,
      items,
      totalAmount,
      createdBy: null,
    },
    include: {
      table: { select: { tableNumber: true } },
      hotel: { select: { id: true, name: true, address: true, phone: true } },
    },
  });

  await prisma.table.update({
    where: { id: data.tableId },
    data: { status: 'OCCUPIED' },
  });

  const payload = serializeOrder(order);
  getIO()?.to('hotel:' + data.hotelId).emit('new_order', payload);

  res.status(201).json({
    success: true,
    data: payload,
  });
};
