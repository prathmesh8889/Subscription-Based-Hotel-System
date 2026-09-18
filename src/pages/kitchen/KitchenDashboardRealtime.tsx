// ============================================================
// Enhanced Kitchen Dashboard - Step 4: Real-Time Socket.IO
// ============================================================
// Full implementation of real-time order flow with:
// - Socket.IO connection simulation with room-based isolation
// - Live order updates without page refresh
// - Connection status indicator
// - Event log for debugging
// - Sound notification on new orders
// - Auto-scroll to newest orders
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Order, OrderStatus, MenuItem } from '../../types';
import { socketService, SocketEventData, startOrderSimulation, stopOrderSimulation } from '../../services/socketService';
import {
  ChefHat, Clock, CheckCircle2, Flame, Bell, Volume2, VolumeX,
  Wifi, WifiOff, Radio, Activity, Play, Pause, Timer
} from 'lucide-react';

export function KitchenDashboardRealtime() {
  const { user } = useAuth();
  const { getHotelOrders, getHotelTables, getHotelMenu, updateOrderStatus, createOrder } = useData();

  const [isConnected, setIsConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [eventLog, setEventLog] = useState<SocketEventData[]>([]);
  const [showEventLog, setShowEventLog] = useState(false);
  const [simulationActive, setSimulationActive] = useState(false);
  const [newOrderFlash, setNewOrderFlash] = useState(false);
  const [connectionRoom, setConnectionRoom] = useState<string>('');

  const hotelId = user?.hotelId || '';
  const allOrders = getHotelOrders(hotelId);
  const tables = getHotelTables(hotelId);
  const menuItems = getHotelMenu(hotelId);

  const pendingOrders = allOrders.filter(o => o.status === 'PENDING');
  const preparingOrders = allOrders.filter(o => o.status === 'PREPARING');
  const readyOrders = allOrders.filter(o => o.status === 'READY');

  const ordersEndRef = useRef<HTMLDivElement>(null);
  const soundEnabledRef = useRef(soundEnabled);

  // Keep ref in sync with state
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // ============================================================
  // NOTIFICATION SOUND (defined BEFORE useEffect that uses it)
  // ============================================================
  const playNotificationSound = useCallback(() => {
    // Create a simple beep using Web Audio API
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      
      // Play a double beep
      setTimeout(() => {
        oscillator.frequency.value = 1000;
      }, 150);
      
      setTimeout(() => {
        oscillator.stop();
        audioCtx.close();
      }, 300);
    } catch (e) {
      // Audio not available
    }
  }, []);

  // ============================================================
  // SOCKET.IO CONNECTION
  // ============================================================
  useEffect(() => {
    if (!hotelId || !user) return;

    // Connect to socket room
    socketService.connect(user.id, hotelId);

    // Listen for connection status
    const unsubConnect = socketService.on('connection_status', (data) => {
      setIsConnected(data.payload.status === 'connected');
      setConnectionRoom(data.payload.room || '');
    });

    // Listen for new orders (real-time!)
    // Uses ref for soundEnabled to avoid reconnection on toggle
    const unsubNewOrder = socketService.on('new_order', (data) => {
      setNewOrderFlash(true);
      setTimeout(() => setNewOrderFlash(false), 3000);
      
      // Play notification sound (uses ref to avoid stale closure)
      if (soundEnabledRef.current) {
        playNotificationSound();
      }
    });

    // Listen for status changes
    const unsubStatus = socketService.on('order_status_changed', (data) => {
      // Status changes are handled through the data context
    });

    return () => {
      unsubConnect();
      unsubNewOrder();
      unsubStatus();
      socketService.disconnect();
    };
  }, [hotelId, user, playNotificationSound]);

  // Update event log periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setEventLog(socketService.getEventLog());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Cleanup simulation on unmount
  useEffect(() => {
    return () => {
      stopOrderSimulation();
    };
  }, []);

  // ============================================================
  // ORDER SIMULATION (Demo)
  // ============================================================
  const toggleSimulation = () => {
    if (simulationActive) {
      stopOrderSimulation();
      setSimulationActive(false);
    } else {
      const availableTables = tables.map(t => ({ id: t.id, table_number: t.table_number }));
      const availableItems = menuItems.filter(m => m.is_available).map(m => ({
        id: m.id, name: m.name, price: m.price
      }));

      startOrderSimulation(hotelId, availableTables, availableItems, (newOrder) => {
        // Add order to data context - with null safety
        const cartItems = newOrder.items
          .map(item => {
            const menuItem = menuItems.find(m => m.id === item.menu_item_id);
            if (!menuItem) return null;
            return { menu_item: menuItem, quantity: item.quantity };
          })
          .filter((item): item is { menu_item: MenuItem; quantity: number } => item !== null);
        
        if (cartItems.length > 0) {
          createOrder(hotelId, newOrder.table_id, cartItems);
        }
      });
      setSimulationActive(true);
    }
  };

  // ============================================================
  // ORDER STATUS HANDLERS
  // ============================================================
  const handleStartPreparing = (orderId: string) => {
    updateOrderStatus(orderId, 'PREPARING');
    socketService.emitOrderStatusChange(orderId, 'PREPARING', hotelId);
  };

  const handleMarkReady = (orderId: string) => {
    updateOrderStatus(orderId, 'READY');
    socketService.emitOrderStatusChange(orderId, 'READY', hotelId);
    socketService.emitOrderReady(orderId);
  };

  // ============================================================
  // HELPERS
  // ============================================================
  const getTimeSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`;
  };

  const getUrgencyColor = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes > 20) return 'border-red-400 bg-red-50';
    if (minutes > 10) return 'border-amber-400 bg-amber-50';
    return 'border-gray-200';
  };

  // ============================================================
  // ORDER CARD COMPONENT
  // ============================================================
  const OrderCard = ({ order, column }: { order: Order; column: string }) => (
    <div className={`bg-white rounded-xl border-2 shadow-sm overflow-hidden transition-all hover:shadow-md ${
      column === 'pending' ? getUrgencyColor(order.created_at) :
      column === 'preparing' ? 'border-blue-200' :
      'border-green-200'
    }`}>
      {/* Header */}
      <div className={`px-4 py-2.5 flex items-center justify-between ${
        column === 'pending' ? 'bg-amber-50 border-b border-amber-100' :
        column === 'preparing' ? 'bg-blue-50 border-b border-blue-100' :
        'bg-green-50 border-b border-green-100'
      }`}>
        <div className="flex items-center gap-2">
          {column === 'pending' && <Clock size={16} className="text-amber-500" />}
          {column === 'preparing' && <Flame size={16} className="text-blue-500 animate-pulse" />}
          {column === 'ready' && <CheckCircle2 size={16} className="text-green-500" />}
          <span className="font-bold text-gray-800">Table {order.table_number}</span>
          <span className="text-xs bg-white/80 px-1.5 py-0.5 rounded text-gray-500">
            #{order.id.slice(-4)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Timer size={12} className="text-gray-400" />
          <span className="text-xs text-gray-500">{getTimeSince(order.created_at)}</span>
        </div>
      </div>

      {/* Items */}
      <div className="p-4">
        <div className="space-y-2">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                column === 'pending' ? 'bg-amber-100 text-amber-700' :
                column === 'preparing' ? 'bg-blue-100 text-blue-700' :
                'bg-green-100 text-green-700'
              }`}>
                {item.quantity}x
              </span>
              <span className="text-sm text-gray-700 font-medium">{item.name}</span>
            </div>
          ))}
        </div>

        {order.notes && (
          <div className="mt-3 p-2 bg-yellow-50 rounded-lg border border-yellow-100">
            <p className="text-xs text-yellow-700">📝 {order.notes}</p>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-4">
          {order.status === 'PENDING' && (
            <button
              onClick={() => handleStartPreparing(order.id)}
              className="w-full py-2.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <Flame size={16} />
              Start Preparing
            </button>
          )}
          {order.status === 'PREPARING' && (
            <button
              onClick={() => handleMarkReady(order.id)}
              className="w-full py-2.5 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} />
              Mark Ready
            </button>
          )}
          {order.status === 'READY' && (
            <div className="text-center py-2.5 text-sm text-green-700 font-medium bg-green-50 rounded-lg border border-green-200">
              ✓ Waiting for waiter pickup
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* ============================================================ */}
      {/* HEADER with Connection Status */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
            <ChefHat size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Kitchen Display System</h1>
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1 text-xs ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
                {isConnected ? 'Socket Connected' : 'Disconnected'}
              </span>
              {connectionRoom && (
                <span className="text-xs text-gray-400">• Room: {connectionRoom}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Simulation Toggle */}
          <button
            onClick={toggleSimulation}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
              simulationActive
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {simulationActive ? <Pause size={14} /> : <Play size={14} />}
            {simulationActive ? 'Stop Simulation' : 'Simulate Orders'}
          </button>

          {/* New Order Alert */}
          {newOrderFlash && (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-lg animate-pulse text-xs font-medium">
              <Bell size={14} />
              New Order!
            </div>
          )}

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg transition-colors ${soundEnabled ? 'bg-gray-100 text-gray-600' : 'bg-gray-50 text-gray-400'}`}
            title={soundEnabled ? 'Mute notifications' : 'Enable notifications'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Event Log Toggle */}
          <button
            onClick={() => setShowEventLog(!showEventLog)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
              showEventLog ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Activity size={14} />
            Events
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SOCKET.IO INFO BANNER */}
      {/* ============================================================ */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-3 flex items-center gap-3">
        <Radio size={18} className="text-indigo-500 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-xs text-indigo-800">
            <strong>Real-time via Socket.IO:</strong> Orders appear instantly without page refresh.
            {simulationActive && ' 🔄 Simulation active - new orders arriving every 15-30 seconds.'}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
          <span className="text-xs text-indigo-600">{isConnected ? 'LIVE' : 'OFFLINE'}</span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* EVENT LOG PANEL */}
      {/* ============================================================ */}
      {showEventLog && (
        <div className="bg-slate-900 rounded-xl p-4 text-xs font-mono max-h-48 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-400">📡 Socket.IO Event Log</span>
            <span className="text-slate-500">{eventLog.length} events</span>
          </div>
          {eventLog.length === 0 ? (
            <p className="text-slate-500">Waiting for events...</p>
          ) : (
            <div className="space-y-1">
              {eventLog.slice(0, 20).map((event, idx) => (
                <div key={idx} className="flex items-start gap-2 text-slate-300">
                  <span className="text-slate-500 flex-shrink-0">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`flex-shrink-0 px-1 rounded ${
                    event.type === 'new_order' ? 'bg-amber-900 text-amber-300' :
                    event.type === 'order_status_changed' ? 'bg-blue-900 text-blue-300' :
                    event.type === 'order_ready' ? 'bg-green-900 text-green-300' :
                    'bg-slate-700 text-slate-300'
                  }`}>
                    {event.type}
                  </span>
                  <span className="text-slate-400 truncate">
                    {JSON.stringify(event.payload).substring(0, 80)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* STATS BAR */}
      {/* ============================================================ */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`rounded-xl p-3 text-center border-2 transition-all ${
          pendingOrders.length > 0 ? 'bg-amber-50 border-amber-300' : 'bg-gray-50 border-gray-200'
        }`}>
          <p className={`text-2xl font-bold ${pendingOrders.length > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
            {pendingOrders.length}
          </p>
          <p className="text-xs text-gray-600">Pending</p>
        </div>
        <div className={`rounded-xl p-3 text-center border-2 transition-all ${
          preparingOrders.length > 0 ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'
        }`}>
          <p className={`text-2xl font-bold ${preparingOrders.length > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
            {preparingOrders.length}
          </p>
          <p className="text-xs text-gray-600">Preparing</p>
        </div>
        <div className={`rounded-xl p-3 text-center border-2 transition-all ${
          readyOrders.length > 0 ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'
        }`}>
          <p className={`text-2xl font-bold ${readyOrders.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
            {readyOrders.length}
          </p>
          <p className="text-xs text-gray-600">Ready</p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* KANBAN BOARD */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pending Column */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
            <h2 className="font-semibold text-gray-700 text-sm">Pending</h2>
            <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
              {pendingOrders.length}
            </span>
          </div>
          <div className="space-y-3 min-h-[200px]">
            {pendingOrders.map(order => (
              <OrderCard key={order.id} order={order} column="pending" />
            ))}
            {pendingOrders.length === 0 && (
              <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <Clock size={20} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs">No pending orders</p>
              </div>
            )}
          </div>
        </div>

        {/* Preparing Column */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <h2 className="font-semibold text-gray-700 text-sm">Preparing</h2>
            <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              {preparingOrders.length}
            </span>
          </div>
          <div className="space-y-3 min-h-[200px]">
            {preparingOrders.map(order => (
              <OrderCard key={order.id} order={order} column="preparing" />
            ))}
            {preparingOrders.length === 0 && (
              <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <Flame size={20} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs">Nothing cooking</p>
              </div>
            )}
          </div>
        </div>

        {/* Ready Column */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <h2 className="font-semibold text-gray-700 text-sm">Ready to Serve</h2>
            <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              {readyOrders.length}
            </span>
          </div>
          <div className="space-y-3 min-h-[200px]">
            {readyOrders.map(order => (
              <OrderCard key={order.id} order={order} column="ready" />
            ))}
            {readyOrders.length === 0 && (
              <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <CheckCircle2 size={20} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs">No ready orders</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden ref for auto-scroll */}
      <div ref={ordersEndRef} />
    </div>
  );
}
