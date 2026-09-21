// ============================================================
// LIVE ORDERS - Kitchen Dashboard with Real-time Updates
// ============================================================

import React, { useEffect, useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { ChefHat, Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export function LiveOrders() {
  const { user } = useAuth();
  const { orders, updateOrderStatus, isConnected } = useSocket();
  const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set());

  // Filter orders for current hotel
  const hotelOrders = orders.filter(order => order.hotelId === user?.hotelId);

  // Group orders by status
  const pendingOrders = hotelOrders.filter(o => o.status === 'PENDING');
  const preparingOrders = hotelOrders.filter(o => o.status === 'PREPARING');
  const readyOrders = hotelOrders.filter(o => o.status === 'READY');
  const servedOrders = hotelOrders.filter(o => o.status === 'SERVED');

  // ============================================================
  // UPDATE ORDER STATUS
  // ============================================================

  const handleStatusUpdate = async (orderId: string, newStatus: 'PREPARING' | 'READY' | 'SERVED') => {
    setUpdatingOrders(prev => new Set(prev).add(orderId));
    
    const result = await updateOrderStatus(orderId, newStatus);
    
    if (!result.success) {
      alert(result.error || 'Failed to update order status');
    }
    
    setUpdatingOrders(prev => {
      const newSet = new Set(prev);
      newSet.delete(orderId);
      return newSet;
    });
  };

  // ============================================================
  // RENDER ORDER CARD
  // ============================================================

  const renderOrderCard = (order: typeof hotelOrders[0], showActions: boolean = true) => {
    const isUpdating = updatingOrders.has(order.orderId);

    return (
      <div key={order.orderId} className="bg-white rounded-lg shadow-md p-4 border-l-4 border-amber-500">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-800">
              Table {order.tableNumber}
            </span>
            <span className="text-xs text-gray-500">
              #{order.orderId.slice(-6)}
            </span>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
            order.status === 'PREPARING' ? 'bg-blue-100 text-blue-800' :
            order.status === 'READY' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {order.status}
          </span>
        </div>

        {/* Items */}
        <div className="space-y-2 mb-3">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-gray-700">
                {item.quantity}x {item.name}
              </span>
              <span className="text-gray-600">
                ₹{item.price * item.quantity}
              </span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
          <span className="font-semibold text-gray-800">Total:</span>
          <span className="text-lg font-bold text-amber-600">₹{order.totalAmount}</span>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="mt-3 p-2 bg-yellow-50 rounded text-sm text-yellow-800">
            <strong>Note:</strong> {order.notes}
          </div>
        )}

        {/* Time */}
        <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
          <Clock size={12} />
          <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="mt-4 flex gap-2">
            {order.status === 'PENDING' && (
              <button
                onClick={() => handleStatusUpdate(order.orderId, 'PREPARING')}
                disabled={isUpdating}
                className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUpdating ? <Loader size={16} className="animate-spin" /> : <ChefHat size={16} />}
                Start Preparing
              </button>
            )}
            {order.status === 'PREPARING' && (
              <button
                onClick={() => handleStatusUpdate(order.orderId, 'READY')}
                disabled={isUpdating}
                className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUpdating ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                Mark Ready
              </button>
            )}
            {order.status === 'READY' && (
              <button
                onClick={() => handleStatusUpdate(order.orderId, 'SERVED')}
                disabled={isUpdating}
                className="flex-1 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUpdating ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                Mark Served
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Live Orders</h1>
          <p className="text-sm text-gray-500">Real-time kitchen display</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={20} className="text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">Pending</span>
          </div>
          <p className="text-2xl font-bold text-yellow-900">{pendingOrders.length}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <ChefHat size={20} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Preparing</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">{preparingOrders.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={20} className="text-green-600" />
            <span className="text-sm font-medium text-green-800">Ready</span>
          </div>
          <p className="text-2xl font-bold text-green-900">{readyOrders.length}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={20} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-800">Served</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{servedOrders.length}</p>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Pending Orders */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <AlertCircle size={20} className="text-yellow-600" />
            Pending ({pendingOrders.length})
          </h2>
          <div className="space-y-4">
            {pendingOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No pending orders
              </div>
            ) : (
              pendingOrders.map(order => renderOrderCard(order))
            )}
          </div>
        </div>

        {/* Preparing Orders */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <ChefHat size={20} className="text-blue-600" />
            Preparing ({preparingOrders.length})
          </h2>
          <div className="space-y-4">
            {preparingOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No orders being prepared
              </div>
            ) : (
              preparingOrders.map(order => renderOrderCard(order))
            )}
          </div>
        </div>

        {/* Ready Orders */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <CheckCircle size={20} className="text-green-600" />
            Ready ({readyOrders.length})
          </h2>
          <div className="space-y-4">
            {readyOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No orders ready
              </div>
            ) : (
              readyOrders.map(order => renderOrderCard(order))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
