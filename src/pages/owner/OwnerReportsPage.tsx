// ============================================================
// Owner - Sales Reports & Analytics
// ============================================================

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Download, TrendingUp, IndianRupee, Receipt } from 'lucide-react';

export function OwnerReportsPage() {
  const { user } = useAuth();
  const { getHotelOrders, getHotelMenu } = useData();
  const hotelId = user?.hotelId || '';
  const orders = getHotelOrders(hotelId);
  const menuItems = getHotelMenu(hotelId);

  const [dateRange, setDateRange] = useState('today');

  const paidOrders = orders.filter(o => o.payment_status === 'PAID');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const avgOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

  // Payment method breakdown
  const paymentData = [
    { name: 'Cash', value: paidOrders.filter(o => o.payment_method === 'CASH').reduce((s, o) => s + o.total_amount, 0), color: '#10b981' },
    { name: 'UPI', value: paidOrders.filter(o => o.payment_method === 'UPI').reduce((s, o) => s + o.total_amount, 0), color: '#8b5cf6' },
    { name: 'Unpaid', value: orders.filter(o => o.payment_status === 'UNPAID').reduce((s, o) => s + o.total_amount, 0), color: '#ef4444' },
  ].filter(d => d.value > 0);

  // Top selling items
  const itemSales = new Map<string, { name: string; quantity: number; revenue: number }>();
  paidOrders.forEach(order => {
    order.items.forEach(item => {
      const existing = itemSales.get(item.menu_item_id) || { name: item.name, quantity: 0, revenue: 0 };
      existing.quantity += item.quantity;
      existing.revenue += item.price * item.quantity;
      itemSales.set(item.menu_item_id, existing);
    });
  });
  const topItems = Array.from(itemSales.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Hourly order distribution (mock)
  const hourlyData = [
    { hour: '10AM', orders: 3 },
    { hour: '11AM', orders: 8 },
    { hour: '12PM', orders: 15 },
    { hour: '1PM', orders: 18 },
    { hour: '2PM', orders: 12 },
    { hour: '3PM', orders: 5 },
    { hour: '4PM', orders: 3 },
    { hour: '5PM', orders: 4 },
    { hour: '6PM', orders: 8 },
    { hour: '7PM', orders: 14 },
    { hour: '8PM', orders: 16 },
    { hour: '9PM', orders: 10 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sales Reports</h1>
          <p className="text-sm text-gray-500">Track revenue, orders, and performance</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <IndianRupee size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">₹{totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Total Revenue</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Receipt size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{paidOrders.length}</p>
              <p className="text-xs text-gray-500">Completed Orders</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <TrendingUp size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">₹{avgOrderValue.toFixed(0)}</p>
              <p className="text-xs text-gray-500">Avg Order Value</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Orders */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Orders by Hour</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="orders" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Payment Breakdown</h3>
          {paymentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ₹${value}`}
                >
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `₹${value}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400">
              No payment data
            </div>
          )}
        </div>
      </div>

      {/* Top Items */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Top Selling Items</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {topItems.length > 0 ? (
            topItems.map((item, idx) => (
              <div key={idx} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.quantity} sold</p>
                  </div>
                </div>
                <span className="font-semibold text-gray-800">₹{item.revenue.toLocaleString()}</span>
              </div>
            ))
          ) : (
            <div className="px-5 py-8 text-center text-gray-400">No sales data yet</div>
          )}
        </div>
      </div>

      {/* All Orders Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">All Orders</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Order</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Table</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Items</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">#{order.id.slice(-6)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">T{order.table_number}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{order.items.length} items</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">₹{order.total_amount}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      order.status === 'SERVED' ? 'bg-green-100 text-green-700' :
                      order.status === 'READY' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'PREPARING' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      order.payment_status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {order.payment_status} {order.payment_method ? `(${order.payment_method})` : ''}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
