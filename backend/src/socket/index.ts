// ============================================================
// SOCKET.IO SERVER SETUP
// ============================================================
// Real-time order updates with room-based isolation
// ============================================================

import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';

// ============================================================
// TYPES
// ============================================================

interface AuthenticatedSocket extends Socket {
  userId?: string;
  hotelId?: string;
  role?: string;
}

interface NewOrderData {
  hotelId: string;
  tableId: string;
  tableNumber: number;
  items: Array<{
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
  notes?: string;
}

interface OrderStatusUpdate {
  orderId: string;
  hotelId: string;
  status: 'PENDING' | 'PREPARING' | 'READY' | 'SERVED';
}

// ============================================================
// SOCKET AUTHENTICATION MIDDLEWARE
// ============================================================

export const authenticateSocket = async (
  socket: AuthenticatedSocket,
  next: (err?: Error) => void
) => {
  try {
    // Get token from handshake auth
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify JWT
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    const decoded = jwt.verify(token, jwtSecret) as any;

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        role: true,
        hotelId: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return next(new Error('Authentication error: Invalid user'));
    }

    // Attach user data to socket
    socket.userId = user.id;
    socket.hotelId = user.hotelId || undefined;
    socket.role = user.role;

    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication error: Invalid token'));
  }
};

// ============================================================
// SOCKET EVENT HANDLERS
// ============================================================

export const setupSocketHandlers = (io: SocketServer) => {
  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`✅ Socket connected: ${socket.userId} (${socket.role})`);

    // ============================================================
    // JOIN HOTEL ROOM
    // ============================================================
    // Each hotel has its own room for real-time updates
    
    if (socket.hotelId) {
      const roomName = `hotel:${socket.hotelId}`;
      socket.join(roomName);
      console.log(`📍 User ${socket.userId} joined room: ${roomName}`);

      // Notify room that user joined
      socket.to(roomName).emit('user_joined', {
        userId: socket.userId,
        role: socket.role,
        timestamp: new Date().toISOString(),
      });
    }

    // ============================================================
    // EVENT: new_order
    // ============================================================
    // Customer places order via QR code
    
    socket.on('new_order', async (data: NewOrderData, callback: (response: any) => void) => {
      try {
        console.log(`📦 New order received from ${socket.userId}`);

        // Validate hotelId matches socket's hotelId
        if (data.hotelId !== socket.hotelId) {
          return callback({
            success: false,
            error: 'Unauthorized: Cannot create order for different hotel',
          });
        }

        // Validate table exists and belongs to hotel
        const table = await prisma.table.findFirst({
          where: {
            id: data.tableId,
            hotelId: socket.hotelId,
          },
        });

        if (!table) {
          return callback({
            success: false,
            error: 'Table not found or does not belong to your hotel',
          });
        }

        // Check for duplicate orders (prevent double-submission)
        const recentOrder = await prisma.order.findFirst({
          where: {
            hotelId: socket.hotelId,
            tableId: data.tableId,
            status: 'PENDING',
            createdAt: {
              gte: new Date(Date.now() - 60000), // Last 60 seconds
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        if (recentOrder) {
          // Check if items are same
          const existingItems = JSON.stringify(recentOrder.items);
          const newItems = JSON.stringify(data.items);
          
          if (existingItems === newItems) {
            return callback({
              success: false,
              error: 'Duplicate order detected. Please wait before placing another order.',
              duplicate: true,
            });
          }
        }

        // Create order in database
        const order = await prisma.order.create({
          data: {
            hotelId: socket.hotelId,
            tableId: data.tableId,
            items: data.items,
            totalAmount: data.totalAmount,
            status: 'PENDING',
            paymentStatus: 'UNPAID',
            createdBy: socket.userId!,
            notes: data.notes,
          },
        });

        // Update table status to OCCUPIED
        await prisma.table.update({
          where: { id: data.tableId },
          data: { status: 'OCCUPIED' },
        });

        // Emit to all users in hotel room
        io.to(`hotel:${socket.hotelId}`).emit('new_order', {
          orderId: order.id,
          hotelId: order.hotelId,
          tableId: order.tableId,
          tableNumber: table.tableNumber,
          items: order.items,
          totalAmount: order.totalAmount,
          status: order.status,
          createdAt: order.createdAt,
        });

        // Log to audit
        await prisma.auditLog.create({
          data: {
            userId: socket.userId,
            action: 'ORDER_CREATED',
            resource: 'Order',
            resourceId: order.id,
            hotelId: socket.hotelId,
            metadata: {
              tableId: data.tableId,
              totalAmount: data.totalAmount,
              itemCount: data.items.length,
            },
          },
        });

        callback({
          success: true,
          orderId: order.id,
        });

      } catch (error) {
        console.error('Error creating order:', error);
        callback({
          success: false,
          error: 'Failed to create order',
        });
      }
    });

    // ============================================================
    // EVENT: update_order_status
    // ============================================================
    // Kitchen/Waiter updates order status
    
    socket.on('update_order_status', async (data: OrderStatusUpdate, callback: (response: any) => void) => {
      try {
        console.log(`🔄 Order status update from ${socket.userId}: ${data.orderId} -> ${data.status}`);

        // Validate hotelId matches
        if (data.hotelId !== socket.hotelId) {
          return callback({
            success: false,
            error: 'Unauthorized: Cannot update order from different hotel',
          });
        }

        // Validate user has permission (KITCHEN or WAITER or OWNER)
        if (!['KITCHEN', 'WAITER', 'OWNER'].includes(socket.role!)) {
          return callback({
            success: false,
            error: 'Unauthorized: Insufficient permissions',
          });
        }

        // Fetch order
        const order = await prisma.order.findFirst({
          where: {
            id: data.orderId,
            hotelId: socket.hotelId,
          },
        });

        if (!order) {
          return callback({
            success: false,
            error: 'Order not found',
          });
        }

        // Update order status
        const updatedOrder = await prisma.order.update({
          where: { id: data.orderId },
          data: {
            status: data.status,
            handledBy: socket.userId,
          },
        });

        // If order is SERVED, update table status to AVAILABLE
        if (data.status === 'SERVED') {
          await prisma.table.update({
            where: { id: order.tableId },
            data: { status: 'AVAILABLE' },
          });
        }

        // Emit to all users in hotel room
        io.to(`hotel:${socket.hotelId}`).emit('order_status_updated', {
          orderId: updatedOrder.id,
          hotelId: updatedOrder.hotelId,
          status: updatedOrder.status,
          handledBy: socket.userId,
          updatedAt: updatedOrder.updatedAt,
        });

        // Log to audit
        await prisma.auditLog.create({
          data: {
            userId: socket.userId,
            action: 'ORDER_STATUS_UPDATED',
            resource: 'Order',
            resourceId: data.orderId,
            hotelId: socket.hotelId,
            metadata: {
              oldStatus: order.status,
              newStatus: data.status,
            },
          },
        });

        callback({
          success: true,
          orderId: updatedOrder.id,
          status: updatedOrder.status,
        });

      } catch (error) {
        console.error('Error updating order status:', error);
        callback({
          success: false,
          error: 'Failed to update order status',
        });
      }
    });

    // ============================================================
    // EVENT: update_payment_status
    // ============================================================
    // Waiter marks order as paid
    
    socket.on('update_payment_status', async (data: { orderId: string; hotelId: string; paymentMethod: 'CASH' | 'UPI' | 'CARD' }, callback: (response: any) => void) => {
      try {
        console.log(`💳 Payment status update from ${socket.userId}: ${data.orderId}`);

        // Validate hotelId
        if (data.hotelId !== socket.hotelId) {
          return callback({
            success: false,
            error: 'Unauthorized: Cannot update payment for different hotel',
          });
        }

        // Validate user has permission (WAITER or OWNER)
        if (!['WAITER', 'OWNER'].includes(socket.role!)) {
          return callback({
            success: false,
            error: 'Unauthorized: Insufficient permissions',
          });
        }

        // Update payment status
        const updatedOrder = await prisma.order.update({
          where: {
            id: data.orderId,
            hotelId: socket.hotelId,
          },
          data: {
            paymentStatus: 'PAID',
            paymentMethod: data.paymentMethod,
          },
        });

        // Emit to hotel room
        io.to(`hotel:${socket.hotelId}`).emit('payment_status_updated', {
          orderId: updatedOrder.id,
          hotelId: updatedOrder.hotelId,
          paymentStatus: updatedOrder.paymentStatus,
          paymentMethod: updatedOrder.paymentMethod,
        });

        callback({
          success: true,
          orderId: updatedOrder.id,
        });

      } catch (error) {
        console.error('Error updating payment status:', error);
        callback({
          success: false,
          error: 'Failed to update payment status',
        });
      }
    });

    // ============================================================
    // DISCONNECT
    // ============================================================
    
    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.userId}`);
      
      if (socket.hotelId) {
        socket.to(`hotel:${socket.hotelId}`).emit('user_left', {
          userId: socket.userId,
          timestamp: new Date().toISOString(),
        });
      }
    });
  });
};

// ============================================================
// INITIALIZE SOCKET.IO
// ============================================================

export const initializeSocket = (httpServer: HttpServer): SocketServer => {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Apply authentication middleware
  io.use(authenticateSocket);

  // Setup event handlers
  setupSocketHandlers(io);

  console.log('🔌 Socket.io initialized');

  return io;
};
