// ============================================================
// SOCKET CONTEXT - Real-time Order Updates
// ============================================================

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

// ============================================================
// TYPES
// ============================================================

interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  orderId: string;
  hotelId: string;
  tableId?: string;
  tableNumber: number;
  items: OrderItem[];
  totalAmount: number;
  status: 'PENDING' | 'PREPARING' | 'READY' | 'SERVED';
  paymentStatus?: 'UNPAID' | 'PAID';
  paymentMethod?: 'CASH' | 'UPI' | 'CARD';
  createdAt: string;
  updatedAt?: string;
  handledBy?: string;
  notes?: string;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  orders: Order[];
  placeOrder: (data: {
    tableId: string;
    tableNumber: number;
    items: OrderItem[];
    totalAmount: number;
    notes?: string;
  }) => Promise<{ success: boolean; orderId?: string; error?: string }>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<{ success: boolean; error?: string }>;
  updatePaymentStatus: (orderId: string, paymentMethod: 'CASH' | 'UPI' | 'CARD') => Promise<{ success: boolean; error?: string }>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

// ============================================================
// SOCKET PROVIDER
// ============================================================

const SOCKET_URL = (import.meta as any).env?.VITE_SOCKET_URL || 'http://localhost:5000';

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);

  // ============================================================
  // CONNECT TO SOCKET
  // ============================================================

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    // Get token from cookie (we'll need to pass it to socket)
    // For now, we'll use a workaround - the backend will read from cookies
    const socketInstance = io(SOCKET_URL, {
      auth: {
        // We'll need to get the token somehow
        // For now, we'll use a placeholder - in production, get from cookie
        token: 'placeholder', // TODO: Get from cookie
      },
      withCredentials: true,
    });

    // ============================================================
    // CONNECTION EVENTS
    // ============================================================

    socketInstance.on('connect', () => {
      console.log('✅ Socket connected');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // ============================================================
    // ORDER EVENTS
    // ============================================================

    socketInstance.on('new_order', (order: Order) => {
      console.log('📦 New order received:', order);
      setOrders(prev => [order, ...prev]);
    });

    socketInstance.on('order_status_updated', (data: { orderId: string; status: Order['status']; handledBy?: string; updatedAt: string }) => {
      console.log('🔄 Order status updated:', data);
      setOrders(prev =>
        prev.map(order =>
          order.orderId === data.orderId
            ? { ...order, status: data.status, handledBy: data.handledBy, updatedAt: data.updatedAt }
            : order
        )
      );
    });

    socketInstance.on('payment_status_updated', (data: { orderId: string; paymentStatus: string; paymentMethod?: string }) => {
      console.log('💳 Payment status updated:', data);
      setOrders(prev =>
        prev.map(order =>
          order.orderId === data.orderId
            ? { ...order, paymentStatus: data.paymentStatus as any, paymentMethod: data.paymentMethod as any }
            : order
        )
      );
    });

    socketInstance.on('user_joined', (data: { userId: string; role: string }) => {
      console.log('👤 User joined:', data);
    });

    socketInstance.on('user_left', (data: { userId: string }) => {
      console.log('👋 User left:', data);
    });

    setSocket(socketInstance);

    // Cleanup
    return () => {
      socketInstance.disconnect();
    };
  }, [isAuthenticated, user]);

  // ============================================================
  // PLACE ORDER
  // ============================================================

  const placeOrder = async (data: {
    tableId: string;
    tableNumber: number;
    items: OrderItem[];
    totalAmount: number;
    notes?: string;
  }): Promise<{ success: boolean; orderId?: string; error?: string }> => {
    return new Promise((resolve) => {
      if (!socket || !user?.hotelId) {
        resolve({ success: false, error: 'Not connected' });
        return;
      }

      socket.emit(
        'new_order',
        {
          hotelId: user.hotelId,
          ...data,
        },
        (response: any) => {
          resolve(response);
        }
      );
    });
  };

  // ============================================================
  // UPDATE ORDER STATUS
  // ============================================================

  const updateOrderStatus = async (
    orderId: string,
    status: Order['status']
  ): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      if (!socket || !user?.hotelId) {
        resolve({ success: false, error: 'Not connected' });
        return;
      }

      socket.emit(
        'update_order_status',
        {
          orderId,
          hotelId: user.hotelId,
          status,
        },
        (response: any) => {
          resolve(response);
        }
      );
    });
  };

  // ============================================================
  // UPDATE PAYMENT STATUS
  // ============================================================

  const updatePaymentStatus = async (
    orderId: string,
    paymentMethod: 'CASH' | 'UPI' | 'CARD'
  ): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      if (!socket || !user?.hotelId) {
        resolve({ success: false, error: 'Not connected' });
        return;
      }

      socket.emit(
        'update_payment_status',
        {
          orderId,
          hotelId: user.hotelId,
          paymentMethod,
        },
        (response: any) => {
          resolve(response);
        }
      );
    });
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        orders,
        placeOrder,
        updateOrderStatus,
        updatePaymentStatus,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
}
