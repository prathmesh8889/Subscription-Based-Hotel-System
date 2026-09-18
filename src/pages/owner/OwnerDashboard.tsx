// ============================================================
// Owner Dashboard - Overview & Analytics
// ============================================================

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { PLAN_CONFIG } from '../../types';
import {
  Table2, Receipt, TrendingUp,
  Clock, AlertTriangle, IndianRupee
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { LiveActivityFeed } from '../../components/LiveActivityFeed';

export function OwnerDashboard() {
  const { user } = useAuth();
  const { getCurrentHotel, getHotelTables, getHotelMenu, getHotelOrders } = useData();
  
  const hotel = getCurrentHotel();
  if (!hotel) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Hotel Not Found</h2>
          <p className="text-gray-500">Unable to load hotel data. Please contact support.</p>
        </div>
      </div>
    );
  }

  const tables = getHotelTables(hotel.id);
  const menuItems = getHotelMenu(hotel.id);
  const orders = getHotelOrders(hotel.id);

  const todayOrders = orders.filter(o => {
    const today = new Date().toDateString();
    return new Date(o.created_at).toDateString() === today;
  });

  const totalRevenue = orders
    .filter(o => o.payment_status === 'PAID')
    .reduce((sum, o) => sum + o.total_amount, 0);

  const pendingOrders = orders.filter(o => o.status === 'PENDING' || o.status === 'PREPARING');
  const availableTables = tables.filter(t => t.status === 'AVAILABLE');

  // Chart data
  const orderStatusData = [
    { name: 'Pending', value: orders.filter(o => o.status === 'PENDING').length, color: '#f59e0b' },
    { name: 'Preparing', value: orders.filter(o => o.status === 'PREPARING').length, color: '#3b82f6' },
    { name: 'Ready', value: orders.filter(o => o.status === 'READY').length, color: '#10b981' },
    { name: 'Served', value: orders.filter(o => o.status === 'SERVED').length, color: '#6b7280' },
  ].filter(d => d.value > 0);

  const revenueByCategory = Array.from(
    orders
      .filter(o => o.payment_status === 'PAID')
      .reduce((map, order) => {
        order.items.forEach(item => {
          const menuItem = menuItems.find(m => m.id === item.menu_item_id);
          const category = menuItem?.category || 'Other';
          map.set(category, (map.get(category) || 0) + item.price * item.quantity);
        });
        return map;
      }, new Map<string, number>())
  ).map(([name, value]) => ({ name, value }));

  const planConfig = PLAN_CONFIG[hotel.plan_type];
  const isSubscriptionActive = hotel.is_active && new Date(hotel.subscription_end_date) > new Date();

  return (
    <div className="space-y-6">
      {/* Subscription Banner */}
      {!isSubscriptionActive && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-red-500" />
          <div>
            <p className="font-medium text-red-800">Subscription Expired</p>
            <p className="text-sm text-red-600">
              Your hotel is in Read-Only Mode. No new orders can be placed. Contact admin to renew.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Welcome back, {user?.name} • {planConfig.name} Plan (₹{planConfig.price}/mo)
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <IndianRupee size={20} className="text-amber-600" />
            </div>
            <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">+12%</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">₹{totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Total Revenue</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Receipt size={20} className="text-blue-600" />
            </div>
            <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">Today</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{todayOrders.length}</p>
          <p className="text-xs text-gray-500 mt-1">Today's Orders</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-orange-600" />
            </div>
            <span className="text-xs text-orange-600 font-medium bg-orange-50 px-2 py-0.5 rounded-full">Active</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{pendingOrders.length}</p>
          <p className="text-xs text-gray-500 mt-1">Pending Orders</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Table2 size={20} className="text-green-600" />
            </div>
            <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">Free</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{availableTables.length}/{tables.length}</p>
          <p className="text-xs text-gray-500 mt-1">Tables Available</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Order Status Distribution</h3>
          {orderStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400">
              No order data yet
            </div>
          )}
        </div>

        {/* Revenue by Category */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Revenue by Category</h3>
          {revenueByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueByCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => `₹${value}`} />
                <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400">
              No revenue data yet
            </div>
          )}
        </div>
      </div>

      {/* Live Activity Feed */}
      <LiveActivityFeed />

      {/* Plan Usage */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Plan Usage & Limits</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Tables</span>
              <span className="font-medium">{tables.length}/{hotel.max_tables}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${(tables.length / hotel.max_tables) * 100}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Menu Items</span>
              <span className="font-medium">{menuItems.length}/{hotel.max_menu_items}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${(menuItems.length / hotel.max_menu_items) * 100}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Subscription</span>
              <span className="font-medium">{isSubscriptionActive ? 'Active' : 'Expired'}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isSubscriptionActive ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: isSubscriptionActive ? '100%' : '100%' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Recent Orders</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {orders.slice(0, 5).map((order) => (
            <div key={order.id} className="px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  order.status === 'PENDING' ? 'bg-amber-100' :
                  order.status === 'PREPARING' ? 'bg-blue-100' :
                  order.status === 'READY' ? 'bg-green-100' :
                  'bg-gray-100'
                }`}>
                  <span className="text-xs font-bold">T{order.table_number}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {order.items.length} items • ₹{order.total_amount}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                order.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                order.status === 'PREPARING' ? 'bg-blue-100 text-blue-700' :
                order.status === 'READY' ? 'bg-green-100 text-green-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {order.status}
              </span>
            </div>
          ))}
          {orders.length === 0 && (
            <div className="px-5 py-8 text-center text-gray-400">No orders yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
