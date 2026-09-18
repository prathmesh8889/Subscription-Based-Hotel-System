// ============================================================
// REAL-TIME ORDER FLOW - Socket.IO Setup
// ============================================================
//
// ARCHITECTURE:
// - Backend: Socket.IO server with room-based isolation per hotel
// - Frontend: Socket.IO client connects and joins hotel-specific rooms
// - Events: new_order, order_status_changed, order_ready
//
// SECURITY: Each socket connection is authenticated via JWT.
// Users can only join rooms for their own hotel.
// ============================================================

/*
// ============================================================
// BACKEND: Socket.IO Server Setup
// File: backend/socket/index.js
// ============================================================

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const setupSocketIO = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ['GET', 'POST'],
    },
  });

  // ============================================================
  // AUTHENTICATION MIDDLEWARE
  // ============================================================
  // Verifies JWT before allowing socket connection.
  
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  // ============================================================
  // CONNECTION HANDLER
  // ============================================================
  
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.userId} (${socket.user.role})`);

    // Join hotel-specific room
    // Room format: `hotel:{hotel_id}`
    // Kitchen staff and owners join their hotel's room
    if (socket.user.hotel_id) {
      const room = `hotel:${socket.user.hotel_id}`;
      socket.join(room);
      console.log(`User joined room: ${room}`);
    }

    // ============================================================
    // EVENT: new_order
    // ============================================================
    // Emitted when a customer places an order.
    // Sent to the hotel's room (kitchen + owner see it).

    socket.on('new_order', async (orderData) => {
      try {
        // Verify the order belongs to user's hotel
        if (orderData.hotel_id !== socket.user.hotel_id) {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }

        // Save order to database
        const order = await prisma.order.create({
          data: {
            hotel_id: orderData.hotel_id,
            table_id: orderData.table_id,
            items: orderData.items,
            total_amount: orderData.total_amount,
            status: 'PENDING',
            payment_status: 'UNPAID',
          }
        });

        // Broadcast to all users in the hotel room
        io.to(`hotel:${orderData.hotel_id}`).emit('new_order', {
          order_id: order.id,
          table_number: orderData.table_number,
          items: order.items,
          total_amount: order.total_amount,
          created_at: order.created_at,
        });

      } catch (error) {
        socket.emit('error', { message: 'Failed to create order' });
      }
    });

    // ============================================================
    // EVENT: update_order_status
    // ============================================================
    // Kitchen staff updates order status.
    // Broadcasted to all connected clients in the hotel room.

    socket.on('update_order_status', async ({ orderId, newStatus }) => {
      try {
        // Verify permissions (only KITCHEN, WAITER, OWNER)
        if (!['KITCHEN', 'WAITER', 'OWNER'].includes(socket.user.role)) {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }

        // Verify order belongs to user's hotel
        const order = await prisma.order.findFirst({
          where: { id: orderId, hotel_id: socket.user.hotel_id }
        });

        if (!order) {
          socket.emit('error', { message: 'Order not found' });
          return;
        }

        // Update order
        const updated = await prisma.order.update({
          where: { id: orderId },
          data: { 
            status: newStatus,
            updated_at: new Date()
          }
        });

        // Broadcast status change to hotel room
        io.to(`hotel:${socket.user.hotel_id}`).emit('order_status_changed', {
          order_id: orderId,
          new_status: newStatus,
          updated_at: updated.updated_at,
        });

      } catch (error) {
        socket.emit('error', { message: 'Failed to update order' });
      }
    });

    // ============================================================
    // DISCONNECT
    // ============================================================
    
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.userId}`);
    });
  });

  return io;
};

module.exports = { setupSocketIO };
*/

// ============================================================
// FRONTEND: Socket.IO Client Hook
// File: frontend/hooks/useSocket.js
// ============================================================

/*
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export function useSocket(hotelId) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [latestOrder, setLatestOrder] = useState(null);
  const [statusChanges, setStatusChanges] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    
    if (!token || !hotelId) return;

    // Connect to Socket.IO server
    const socket = io(process.env.REACT_APP_SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    });

    // Listen for new orders (Kitchen Dashboard)
    socket.on('new_order', (order) => {
      setLatestOrder(order);
      // Play notification sound
      playNotificationSound();
    });

    // Listen for status changes (All panels)
    socket.on('order_status_changed', (data) => {
      setStatusChanges(prev => [data, ...prev].slice(0, 50));
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Cleanup
    return () => {
      socket.disconnect();
    };
  }, [hotelId]);

  return {
    socket: socketRef.current,
    isConnected,
    latestOrder,
    statusChanges,
  };
}
*/

// ============================================================
// SOCKET.IO EVENT FLOW DIAGRAM:
// ============================================================
//
// Customer scans QR
//       |
//       v
// [Customer Page] --places order--> [Backend API]
//                                        |
//                                        v
//                              [Save to PostgreSQL]
//                                        |
//                                        v
//                            [Socket.IO: emit 'new_order']
//                                        |
//                       +----------------+----------------+
//                       |                |                |
//                       v                v                v
//              [Kitchen Display]  [Owner Dashboard]  [Waiter Panel]
//              (auto-updates)    (notification)     (auto-updates)
//                       |
//                       v
//              Kitchen marks "Preparing"
//                       |
//                       v
//              [Socket.IO: emit 'order_status_changed']
//                       |
//                       v
//              All panels update in real-time
//
// ============================================================

export {};
