// ============================================================
// Socket.IO Simulation Service - Real-Time Order Flow
// ============================================================
// Simulates Socket.IO behavior with rooms, events, and
// authenticated connections. In production, this would be
// the actual socket.io-client connecting to the backend.
// ============================================================

import { Order } from '../types';

// ============================================================
// Types
// ============================================================
export type SocketEvent = 
  | 'new_order'
  | 'order_status_changed'
  | 'order_ready'
  | 'connection_status'
  | 'notification';

export interface SocketEventData {
  type: SocketEvent;
  payload: any;
  timestamp: number;
  roomId: string;
}

export type SocketListener = (data: SocketEventData) => void;

export interface SocketRoom {
  id: string;
  members: string[];
}

// ============================================================
// Socket.IO Simulation Class
// ============================================================
// Mimics the socket.io-client API with room-based isolation.

class SocketService {
  private listeners: Map<SocketEvent, SocketListener[]> = new Map();
  private rooms: Map<string, SocketRoom> = new Map();
  private currentRoom: string | null = null;
  private currentUserId: string | null = null;
  private connected: boolean = false;
  private eventLog: SocketEventData[] = [];
  private maxLogSize = 100;

  // ============================================================
  // CONNECTION
  // ============================================================
  
  connect(userId: string, hotelId: string): void {
    this.currentUserId = userId;
    // Simulate connection delay
    setTimeout(() => {
      this.connected = true;
      this.currentRoom = `hotel:${hotelId}`;
      
      // Create room if not exists
      if (!this.rooms.has(this.currentRoom)) {
        this.rooms.set(this.currentRoom, {
          id: this.currentRoom,
          members: [],
        });
      }
      
      // Join room
      const room = this.rooms.get(this.currentRoom)!;
      if (!room.members.includes(userId)) {
        room.members.push(userId);
      }

      const connectionData: SocketEventData = {
        type: 'connection_status',
        payload: {
          status: 'connected',
          room: this.currentRoom,
          userId,
          message: `Connected to ${this.currentRoom}`,
        },
        timestamp: Date.now(),
        roomId: this.currentRoom,
      };

      this.logEvent('connection_status', connectionData.payload);
      
      // Notify listeners of connection
      const listeners = this.listeners.get('connection_status');
      if (listeners) {
        listeners.forEach(listener => listener(connectionData));
      }
    }, 300);
  }

  disconnect(): void {
    this.connected = false;
    if (this.currentRoom && this.currentUserId) {
      const room = this.rooms.get(this.currentRoom);
      if (room) {
        // Remove current user from room members
        room.members = room.members.filter(m => m !== this.currentUserId);
      }
    }
    this.currentRoom = null;
    this.currentUserId = null;
    this.logEvent('connection_status', { status: 'disconnected' });
  }

  isConnected(): boolean {
    return this.connected;
  }

  getCurrentRoom(): string | null {
    return this.currentRoom;
  }

  // ============================================================
  // EVENT LISTENERS
  // ============================================================

  on(event: SocketEvent, listener: SocketListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(event);
      if (listeners) {
        const idx = listeners.indexOf(listener);
        if (idx > -1) listeners.splice(idx, 1);
      }
    };
  }

  // ============================================================
  // EMIT EVENTS (Client -> Server -> Broadcast)
  // ============================================================

  // Simulates: socket.emit('new_order', orderData)
  emitNewOrder(order: Order): void {
    if (!this.connected || !this.currentRoom) return;

    const eventData: SocketEventData = {
      type: 'new_order',
      payload: {
        order_id: order.id,
        hotel_id: order.hotel_id,
        table_id: order.table_id,
        table_number: order.table_number,
        items: order.items,
        total_amount: order.total_amount,
        created_at: order.created_at,
      },
      timestamp: Date.now(),
      roomId: this.currentRoom,
    };

    this.logEvent('new_order', eventData.payload);
    this.broadcastToRoom(eventData);
  }

  // Simulates: socket.emit('update_order_status', { orderId, newStatus })
  emitOrderStatusChange(orderId: string, newStatus: string, hotelId: string): void {
    if (!this.connected || !this.currentRoom) return;

    const eventData: SocketEventData = {
      type: 'order_status_changed',
      payload: {
        order_id: orderId,
        new_status: newStatus,
        updated_at: new Date().toISOString(),
      },
      timestamp: Date.now(),
      roomId: this.currentRoom,
    };

    this.logEvent('order_status_changed', eventData.payload);
    this.broadcastToRoom(eventData);
  }

  // Simulates: socket.emit('order_ready', { orderId })
  emitOrderReady(orderId: string): void {
    if (!this.connected || !this.currentRoom) return;

    const eventData: SocketEventData = {
      type: 'order_ready',
      payload: {
        order_id: orderId,
        message: 'Order is ready for service!',
      },
      timestamp: Date.now(),
      roomId: this.currentRoom,
    };

    this.logEvent('order_ready', eventData.payload);
    this.broadcastToRoom(eventData);
  }

  // ============================================================
  // BROADCAST TO ROOM
  // ============================================================
  // Simulates io.to(room).emit() - sends to all members in room

  private broadcastToRoom(eventData: SocketEventData): void {
    const listeners = this.listeners.get(eventData.type);
    if (listeners) {
      // Simulate network delay (50-200ms)
      const delay = 50 + Math.random() * 150;
      setTimeout(() => {
        listeners.forEach(listener => listener(eventData));
      }, delay);
    }
  }

  // ============================================================
  // EVENT LOG (for debugging/demo)
  // ============================================================

  private logEvent(type: SocketEvent, payload: any): void {
    this.eventLog.unshift({
      type,
      payload,
      timestamp: Date.now(),
      roomId: this.currentRoom || 'none',
    });
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog = this.eventLog.slice(0, this.maxLogSize);
    }
  }

  getEventLog(): SocketEventData[] {
    return [...this.eventLog];
  }

  clearEventLog(): void {
    this.eventLog = [];
  }

  // ============================================================
  // ROOM INFO
  // ============================================================

  getRoomInfo(): { roomId: string; memberCount: number } | null {
    if (!this.currentRoom) return null;
    const room = this.rooms.get(this.currentRoom);
    return room ? { roomId: room.id, memberCount: room.members.length } : null;
  }
}

// ============================================================
// Singleton Instance
// ============================================================
export const socketService = new SocketService();

// ============================================================
// SIMULATION: Auto-generate orders for demo
// ============================================================
// This simulates customers placing orders via QR scan.

let simulationInterval: ReturnType<typeof setInterval> | null = null;

export function startOrderSimulation(
  hotelId: string,
  tables: Array<{ id: string; table_number: number }>,
  menuItems: Array<{ id: string; name: string; price: number }>,
  onNewOrder: (order: Order) => void
): void {
  if (simulationInterval) return;

  // Generate a new order every 15-30 seconds
  const generateOrder = () => {
    if (tables.length === 0 || menuItems.length === 0) return;

    const randomTable = tables[Math.floor(Math.random() * tables.length)];
    const numItems = 1 + Math.floor(Math.random() * 3);
    const items: Order['items'] = [];
    
    for (let i = 0; i < numItems; i++) {
      const randomItem = menuItems[Math.floor(Math.random() * menuItems.length)];
      const existing = items.find(it => it.menu_item_id === randomItem.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        items.push({
          menu_item_id: randomItem.id,
          name: randomItem.name,
          price: randomItem.price,
          quantity: 1,
        });
      }
    }

    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order: Order = {
      id: `order-sim-${Date.now()}`,
      hotel_id: hotelId,
      table_id: randomTable.id,
      table_number: randomTable.table_number,
      items,
      total_amount: totalAmount,
      status: 'PENDING',
      payment_status: 'UNPAID',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onNewOrder(order);
    socketService.emitNewOrder(order);
  };

  // First order after 5 seconds, then every 15-30 seconds
  setTimeout(generateOrder, 5000);
  simulationInterval = setInterval(generateOrder, 15000 + Math.random() * 15000);
}

export function stopOrderSimulation(): void {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
}
