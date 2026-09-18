// ============================================================
// Owner - All Orders View
// ============================================================

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { OrderStatus } from '../../types';
import { Search, Filter, Clock } from 'lucide-react';

export function OwnerOrdersPage() {
  const { user } = useAuth();
  const { getHotelOrders } = useData();
  const hotelId = user?.hotel_id || '';
  const orders = getHotelOrders(hotelId);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = orders.filter(o => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesSearch = o.id.includes(searchTerm) || o.table_number.toString().includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  const statusCounts = {
    all: orders.length,
    PENDING: orders.filter(o => o.status === 'PENDING').length,
    PREPARING: orders.filter(o => o.status === 'PREPARING').length,
    READY: orders.filter(o => o.status === 'READY').length,
    SERVED: orders.filter(o => o.status === 'SERVED').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">All Orders</h1>
        <p className="text-sm text-gray-500">View and track all orders across your restaurant</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {(['all', 'PENDING', 'PREPARING', 'READY', 'SERVED'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-2 text-sm rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === status
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All' : status} ({statusCounts[status]})
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.map(order => (
          <div key={order.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  order.status === 'PENDING' ? 'bg-amber-100' :
                  order.status === 'PREPARING' ? 'bg-blue-100' :
                  order.status === 'READY' ? 'bg-green-100' :
                  'bg-gray-100'
                }`}>
                  <span className="text-sm font-bold text-gray-700">T{order.table_number}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Order #{order.id.slice(-6)}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-800">₹{order.total_amount}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  order.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                  order.status === 'PREPARING' ? 'bg-blue-100 text-blue-700' :
                  order.status === 'READY' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {order.status}
                </span>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-2">
              <div className="flex flex-wrap gap-2">
                {order.items.map((item, idx) => (
                  <span key={idx} className="text-xs bg-gray-50 px-2 py-1 rounded text-gray-600">
                    {item.quantity}x {item.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Clock size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No orders found</p>
        </div>
      )}
    </div>
  );
}
