// ============================================================
// Kitchen Dashboard - Real-time Order Display (Socket.IO simulation)
// ============================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Order, OrderStatus } from '../../types';
import { ChefHat, Clock, CheckCircle2, Flame, Bell, Volume2 } from 'lucide-react';

export function KitchenDashboard() {
  const { user } = useAuth();
  const { getHotelOrders, updateOrderStatus, addOrderListener } = useData();
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const hotelOrders = user?.hotel_id ? getHotelOrders(user.hotel_id) : [];
  
  const pendingOrders = hotelOrders.filter(o => o.status === 'PENDING');
  const preparingOrders = hotelOrders.filter(o => o.status === 'PREPARING');
  const readyOrders = hotelOrders.filter(o => o.status === 'READY');

  // Simulate Socket.IO real-time updates
  useEffect(() => {
    const unsubscribe = addOrderListener((order: Order) => {
      setNewOrderAlert(true);
      setTimeout(() => setNewOrderAlert(false), 3000);
    });
    return unsubscribe;
  }, [addOrderListener]);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus);
  };

  const getNextAction = (status: OrderStatus): { label: string; nextStatus: OrderStatus; color: string } | null => {
    switch (status) {
      case 'PENDING':
        return { label: 'Start Preparing', nextStatus: 'PREPARING', color: 'bg-blue-500 hover:bg-blue-600' };
      case 'PREPARING':
        return { label: 'Mark Ready', nextStatus: 'READY', color: 'bg-green-500 hover:bg-green-600' };
      default:
        return null;
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return <Clock size={16} className="text-amber-500" />;
      case 'PREPARING': return <Flame size={16} className="text-blue-500" />;
      case 'READY': return <CheckCircle2 size={16} className="text-green-500" />;
      default: return null;
    }
  };

  const getTimeSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  const OrderCard = ({ order, column }: { order: Order; column: string }) => (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${
      column === 'pending' ? 'border-amber-200' :
      column === 'preparing' ? 'border-blue-200' :
      'border-green-200'
    }`}>
      {/* Header */}
      <div className={`px-4 py-2 flex items-center justify-between ${
        column === 'pending' ? 'bg-amber-50' :
        column === 'preparing' ? 'bg-blue-50' :
        'bg-green-50'
      }`}>
        <div className="flex items-center gap-2">
          {getStatusIcon(order.status)}
          <span className="font-bold text-gray-800">Table {order.table_number}</span>
        </div>
        <span className="text-xs text-gray-500">{getTimeSince(order.created_at)}</span>
      </div>

      {/* Items */}
      <div className="p-4">
        <div className="space-y-2">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-xs font-bold text-gray-600">
                  {item.quantity}x
                </span>
                <span className="text-sm text-gray-700">{item.name}</span>
              </div>
            </div>
          ))}
        </div>

        {order.notes && (
          <div className="mt-3 p-2 bg-yellow-50 rounded-lg">
            <p className="text-xs text-yellow-700">📝 {order.notes}</p>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-4">
          {getNextAction(order.status) && (
            <button
              onClick={() => handleStatusChange(order.id, getNextAction(order.status)!.nextStatus)}
              className={`w-full py-2.5 text-white text-sm font-medium rounded-lg transition-colors ${getNextAction(order.status)!.color}`}
            >
              {getNextAction(order.status)!.label}
            </button>
          )}
          {order.status === 'READY' && (
            <div className="text-center py-2 text-sm text-green-600 font-medium bg-green-50 rounded-lg">
              ✓ Ready for service
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
            <ChefHat size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Kitchen Display</h1>
            <p className="text-sm text-gray-500">Live orders • Auto-updates via Socket.IO</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* New Order Alert */}
          {newOrderAlert && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg animate-pulse">
              <Bell size={16} />
              <span className="text-sm font-medium">New Order!</span>
            </div>
          )}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg transition-colors ${soundEnabled ? 'bg-gray-100 text-gray-600' : 'bg-gray-50 text-gray-400'}`}
          >
            <Volume2 size={18} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-amber-600">{pendingOrders.length}</p>
          <p className="text-sm text-amber-700">Pending</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{preparingOrders.length}</p>
          <p className="text-sm text-blue-700">Preparing</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{readyOrders.length}</p>
          <p className="text-sm text-green-700">Ready</p>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Column */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <h2 className="font-semibold text-gray-700">Pending Orders</h2>
            <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              {pendingOrders.length}
            </span>
          </div>
          <div className="space-y-3">
            {pendingOrders.map(order => (
              <OrderCard key={order.id} order={order} column="pending" />
            ))}
            {pendingOrders.length === 0 && (
              <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <Clock size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No pending orders</p>
              </div>
            )}
          </div>
        </div>

        {/* Preparing Column */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <h2 className="font-semibold text-gray-700">Preparing</h2>
            <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {preparingOrders.length}
            </span>
          </div>
          <div className="space-y-3">
            {preparingOrders.map(order => (
              <OrderCard key={order.id} order={order} column="preparing" />
            ))}
            {preparingOrders.length === 0 && (
              <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <Flame size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nothing cooking</p>
              </div>
            )}
          </div>
        </div>

        {/* Ready Column */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <h2 className="font-semibold text-gray-700">Ready to Serve</h2>
            <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              {readyOrders.length}
            </span>
          </div>
          <div className="space-y-3">
            {readyOrders.map(order => (
              <OrderCard key={order.id} order={order} column="ready" />
            ))}
            {readyOrders.length === 0 && (
              <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <CheckCircle2 size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No ready orders</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
