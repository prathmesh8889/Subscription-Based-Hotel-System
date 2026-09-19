// ============================================================
// SOCKET CONTEXT - Mock Real-time Order Updates
// ============================================================
// Works without backend - uses local state
// For production, replace with real Socket.io connection
// ============================================================

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
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
  socket: null;
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
// SOCKET PROVIDER (Mock Implementation)
// ============================================================

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  // Mock connection - always "connected" in demo mode
  const isConnected = isAuthenticated;

  // ============================================================
  // PLACE ORDER (Mock)
  // ============================================================

  const placeOrder = useCallback(async (data: {
    tableId: string;
    tableNumber: number;
    items: OrderItem[];
    totalAmount: number;
    notes?: string;
  }): Promise<{ success: boolean; orderId?: string; error?: string }> => {
    if (!user?.hotelId) {
      return { success: false, error: 'Not authenticated' };
    }

    const newOrder: Order = {
      orderId: `order-${Date.now()}`,
      hotelId: user.hotelId,
      tableId: data.tableId,
      tableNumber: data.tableNumber,
      items: data.items,
      totalAmount: data.totalAmount,
      status: 'PENDING',
      paymentStatus: 'UNPAID',
      createdAt: new Date().toISOString(),
      notes: data.notes,
    };

    setOrders(prev => [newOrder, ...prev]);

    return { success: true, orderId: newOrder.orderId };
  }, [user]);

  // ============================================================
  // UPDATE ORDER STATUS (Mock)
  // ============================================================

  const updateOrderStatus = useCallback(async (
    orderId: string,
    status: Order['status']
  ): Promise<{ success: boolean; error?: string }> => {
    setOrders(prev =>
      prev.map(order =>
        order.orderId === orderId
          ? { ...order, status, updatedAt: new Date().toISOString(), handledBy: user?.id }
          : order
      )
    );

    return { success: true };
  }, [user]);

  // ============================================================
  // UPDATE PAYMENT STATUS (Mock)
  // ============================================================

  const updatePaymentStatus = useCallback(async (
    orderId: string,
    paymentMethod: 'CASH' | 'UPI' | 'CARD'
  ): Promise<{ success: boolean; error?: string }> => {
    setOrders(prev =>
      prev.map(order =>
        order.orderId === orderId
          ? { ...order, paymentStatus: 'PAID', paymentMethod, updatedAt: new Date().toISOString() }
          : order
      )
    );

    return { success: true };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket: null,
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
