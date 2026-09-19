import { Server as IOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';

interface StaffSocket extends Socket {
  hotelId?: string;
  userId?: string;
  role?: string;
}

interface CustomerSocket extends Socket {
  customerHotelId?: string;
  customerTableId?: string;
}

let IO: IOServer | null = null;
export const getIO = () => IO;

const cookieValue = (header: string | undefined, name: string) => {
  if (!header) return null;
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    if (part.slice(0, index).trim() === name) {
      return decodeURIComponent(part.slice(index + 1));
    }
  }
  return null;
};

export const initializeSocket = (httpServer: HTTPServer) => {
  const origins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(value => value.trim())
    : ['http://localhost:3000', 'http://localhost:5173'];

  const io = new IOServer(httpServer, {
    cors: {
      origin: origins,
      credentials: true,
    },
  });

  IO = io;

  io.use(async (socket: StaffSocket, next) => {
    try {
      if (!process.env.JWT_SECRET) return next(new Error('JWT config missing'));

      const token = cookieValue(socket.handshake.headers.cookie, 'auth_token');
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { hotel: true },
      });

      if (
        !user ||
        !user.isActive ||
        (
          user.role !== 'SUPER_ADMIN' &&
          (!user.hotel || !user.hotel.isActive || user.hotel.subscriptionEnd.getTime() < Date.now())
        )
      ) {
        return next(new Error('Invalid account'));
      }

      socket.hotelId = user.hotelId || undefined;
      socket.userId = user.id;
      socket.role = user.role;
      next();
    } catch {
      next(new Error('Invalid session'));
    }
  });

  io.on('connection', (socket: StaffSocket) => {
    if (socket.hotelId) socket.join('hotel:' + socket.hotelId);
    socket.emit('connection_ready', {
      hotelId: socket.hotelId,
      role: socket.role,
    });
  });

  const customerNamespace = io.of('/customer');

  customerNamespace.use(async (socket: CustomerSocket, next) => {
    try {
      const { hotelId, tableId, token } = socket.handshake.auth || {};
      if (!hotelId || !tableId || !token) return next(new Error('QR authentication required'));

      const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
      if (!hotel || !hotel.isActive || hotel.subscriptionEnd.getTime() < Date.now()) {
        return next(new Error('Hotel unavailable'));
      }

      const table = await prisma.table.findFirst({
        where: { id: tableId, hotelId, qrToken: token },
      });
      if (!table) return next(new Error('Invalid table QR code'));

      socket.customerHotelId = hotelId;
      socket.customerTableId = tableId;
      next();
    } catch {
      next(new Error('Customer socket authentication failed'));
    }
  });

  customerNamespace.on('connection', (socket: CustomerSocket) => {
    socket.emit('customer_connection_ready', {
      hotelId: socket.customerHotelId,
      tableId: socket.customerTableId,
    });

    socket.on('watch_order', async (payload: any) => {
      const orderId = String(payload?.orderId || '');
      if (!orderId || !socket.customerHotelId || !socket.customerTableId) return;

      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          hotelId: socket.customerHotelId,
          tableId: socket.customerTableId,
        },
        include: {
          table: { select: { tableNumber: true } },
          hotel: { select: { id: true, name: true, address: true, phone: true } },
        },
      });

      if (!order) {
        socket.emit('order_watch_error', { orderId, error: 'Order not found.' });
        return;
      }

      socket.join('customer-order:' + orderId);
      socket.emit('order_snapshot', {
        id: order.id,
        orderId: order.id,
        hotelId: order.hotelId,
        tableId: order.tableId,
        tableNumber: order.table.tableNumber,
        hotel: order.hotel,
        items: order.items,
        totalAmount: Number(order.totalAmount),
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        notes: order.notes,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      });
    });
  });

  return io;
};
