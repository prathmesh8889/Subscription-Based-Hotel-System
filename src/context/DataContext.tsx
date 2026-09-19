// ============================================================
// Data Context - Simulates Database Operations with Multi-Tenancy
// ============================================================

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Hotel, MenuItem, Order, OrderStatus, PaymentMethod, PaymentStatus, Table, TableStatus, CartItem } from '../types';
import { mockHotels, mockMenuItems, mockOrders, mockTables } from '../data/mockData';
import { useAuth } from './AuthContext';

interface DataContextType {
  // Hotels
  hotels: Hotel[];
  getHotel: (id: string) => Hotel | undefined;
  getCurrentHotel: () => Hotel | undefined;
  updateHotel: (id: string, data: Partial<Hotel>) => void;
  
  // Tables
  tables: Table[];
  getHotelTables: (hotelId: string) => Table[];
  addTable: (hotelId: string, table: Omit<Table, 'id'>) => { success: boolean; error?: string };
  updateTableStatus: (tableId: string, status: TableStatus) => void;
  
  // Menu
  menuItems: MenuItem[];
  getHotelMenu: (hotelId: string) => MenuItem[];
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (id: string, data: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;
  
  // Orders
  orders: Order[];
  getHotelOrders: (hotelId: string) => Order[];
  createOrder: (hotelId: string, tableId: string, items: CartItem[]) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updatePaymentStatus: (orderId: string, status: PaymentStatus, method?: PaymentMethod) => void;
  
  // Listeners for real-time simulation
  orderListeners: ((order: Order) => void)[];
  addOrderListener: (listener: (order: Order) => void) => () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  const [hotels, setHotels] = useState<Hotel[]>(mockHotels);
  const [tables, setTables] = useState<Table[]>(mockTables);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(mockMenuItems);
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [orderListeners, setOrderListeners] = useState<((order: Order) => void)[]>([]);

  // ============================================================
  // Hotel Operations
  // ============================================================
  const getHotel = useCallback((id: string) => hotels.find(h => h.id === id), [hotels]);
  
  const getCurrentHotel = useCallback(() => {
    if (!user?.hotelId) return undefined;
    return hotels.find(h => h.id === user.hotelId);
  }, [user, hotels]);

  const updateHotel = useCallback((id: string, data: Partial<Hotel>) => {
    setHotels(prev => prev.map(h => h.id === id ? { ...h, ...data } : h));
  }, []);

  // ============================================================
  // Table Operations (with hotel_id enforcement)
  // ============================================================
  const getHotelTables = useCallback(
    (hotelId: string) => tables.filter(t => t.hotel_id === hotelId),
    [tables]
  );

  const addTable = useCallback(
    (hotelId: string, tableData: Omit<Table, 'id'>) => {
      const hotel = hotels.find(h => h.id === hotelId);
      if (!hotel) return { success: false, error: 'Hotel not found' };
      
      // Enforce plan limits
      const currentCount = tables.filter(t => t.hotel_id === hotelId).length;
      if (currentCount >= hotel.max_tables) {
        return { success: false, error: `Maximum ${hotel.max_tables} tables allowed in your plan` };
      }
      
      const newTable: Table = {
        ...tableData,
        id: `table-${Date.now()}`,
      };
      setTables(prev => [...prev, newTable]);
      return { success: true };
    },
    [hotels, tables]
  );

  const updateTableStatus = useCallback((tableId: string, status: TableStatus) => {
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, status } : t));
  }, []);

  // ============================================================
  // Menu Operations (with hotel_id enforcement)
  // ============================================================
  const getHotelMenu = useCallback(
    (hotelId: string) => menuItems.filter(m => m.hotel_id === hotelId),
    [menuItems]
  );

  const addMenuItem = useCallback((item: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = { ...item, id: `mi-${Date.now()}` };
    setMenuItems(prev => [...prev, newItem]);
  }, []);

  const updateMenuItem = useCallback((id: string, data: Partial<MenuItem>) => {
    setMenuItems(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
  }, []);

  const deleteMenuItem = useCallback((id: string) => {
    setMenuItems(prev => prev.filter(m => m.id !== id));
  }, []);

  // ============================================================
  // Order Operations (with hotel_id enforcement)
  // ============================================================
  const getHotelOrders = useCallback(
    (hotelId: string) => orders.filter(o => o.hotel_id === hotelId),
    [orders]
  );

  const createOrder = useCallback(
    (hotelId: string, tableId: string, items: CartItem[]): Order => {
      const table = tables.find(t => t.id === tableId);
      const now = new Date().toISOString();
      
      const orderItems = items.map(ci => ({
        menu_item_id: ci.menu_item.id,
        name: ci.menu_item.name,
        price: ci.menu_item.price,
        quantity: ci.quantity,
        notes: ci.notes,
      }));
      
      const totalAmount = items.reduce(
        (sum, ci) => sum + ci.menu_item.price * ci.quantity,
        0
      );

      const newOrder: Order = {
        id: `order-${Date.now()}`,
        hotel_id: hotelId,
        table_id: tableId,
        table_number: table?.table_number || 0,
        items: orderItems,
        total_amount: totalAmount,
        status: 'PENDING',
        payment_status: 'UNPAID',
        created_at: now,
        updated_at: now,
      };

      setOrders(prev => [...prev, newOrder]);
      
      // Update table status to OCCUPIED
      if (table) {
        setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: 'OCCUPIED' as TableStatus } : t));
      }

      // Notify listeners (simulates Socket.IO emit)
      orderListeners.forEach(listener => listener(newOrder));

      return newOrder;
    },
    [tables, orderListeners]
  );

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    setOrders(prev =>
      prev.map(o =>
        o.id === orderId ? { ...o, status, updated_at: new Date().toISOString() } : o
      )
    );
  }, []);

  const updatePaymentStatus = useCallback(
    (orderId: string, status: PaymentStatus, method?: PaymentMethod) => {
      setOrders(prev =>
        prev.map(o =>
          o.id === orderId
            ? { ...o, payment_status: status, payment_method: method, updated_at: new Date().toISOString() }
            : o
        )
      );
    },
    []
  );

  const addOrderListener = useCallback((listener: (order: Order) => void) => {
    setOrderListeners(prev => [...prev, listener]);
    return () => {
      setOrderListeners(prev => prev.filter(l => l !== listener));
    };
  }, []);

  return (
    <DataContext.Provider
      value={{
        hotels,
        getHotel,
        getCurrentHotel,
        updateHotel,
        tables,
        getHotelTables,
        addTable,
        updateTableStatus,
        menuItems,
        getHotelMenu,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        orders,
        getHotelOrders,
        createOrder,
        updateOrderStatus,
        updatePaymentStatus,
        orderListeners,
        addOrderListener,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
}
