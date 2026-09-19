// ============================================================
// OWNER REPORTS PAGE
// ============================================================
// Comprehensive reporting and analytics dashboard
// ============================================================

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, DollarSign, ShoppingCart, Users, Loader } from 'lucide-react';

interface RevenueData {
  period: string;
  revenue: number;
  orders: number;
  gst: number;
  netRevenue: number;
}

interface ReportSummary {
  totalRevenue: number;
  totalOrders: number;
  totalGST: number;
  netRevenue: number;
  averageOrderValue: number;
}

interface TopItem {
  menuItemId: string;
  name: string;
  quantity: number;
  revenue: number;
  orderCount: number;
}

interface PaymentBreakdown {
  CASH: { count: number; amount: number; percentage: number };
  UPI: { count: number; amount: number; percentage: number };
  CARD: { count: number; amount: number; percentage: number };
}

export function OwnerReports() {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdown | null>(null);

  // ============================================================
  // FETCH REPORTS (Mock)
  // ============================================================

  useEffect(() => {
    if (user?.hotelId) {
      fetchAllReports();
    }
  }, [user?.hotelId, dateRange]);

  const fetchAllReports = async () => {
    if (!user?.hotelId) return;

    setLoading(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock revenue data
    const mockRevenueData: RevenueData[] = Array.from({ length: Number(dateRange) }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (Number(dateRange) - i - 1));
      return {
        period: date.toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 5000) + 2000,
        orders: Math.floor(Math.random() * 20) + 5,
        gst: Math.floor(Math.random() * 250) + 100,
        netRevenue: Math.floor(Math.random() * 4750) + 1900,
      };
    });

    const totalRevenue = mockRevenueData.reduce((sum, item) => sum + item.revenue, 0);
    const totalOrders = mockRevenueData.reduce((sum, item) => sum + item.orders, 0);
    const totalGST = mockRevenueData.reduce((sum, item) => sum + item.gst, 0);

    const mockSummary: ReportSummary = {
      totalRevenue,
      totalOrders,
      totalGST,
      netRevenue: totalRevenue - totalGST,
      averageOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
    };

    // Mock top items
    const mockTopItems: TopItem[] = [
      { menuItemId: '1', name: 'Butter Chicken', quantity: 145, revenue: 46400, orderCount: 120 },
      { menuItemId: '2', name: 'Paneer Tikka', quantity: 132, revenue: 36960, orderCount: 110 },
      { menuItemId: '3', name: 'Biryani', quantity: 118, revenue: 41300, orderCount: 98 },
      { menuItemId: '4', name: 'Garlic Naan', quantity: 210, revenue: 14700, orderCount: 180 },
      { menuItemId: '5', name: 'Masala Dosa', quantity: 95, revenue: 17100, orderCount: 85 },
      { menuItemId: '6', name: 'Chicken Tikka', quantity: 88, revenue: 26400, orderCount: 75 },
      { menuItemId: '7', name: 'Veg Biryani', quantity: 76, revenue: 19760, orderCount: 68 },
      { menuItemId: '8', name: 'Dal Makhani', quantity: 102, revenue: 20400, orderCount: 90 },
      { menuItemId: '9', name: 'Raita', quantity: 180, revenue: 9000, orderCount: 160 },
      { menuItemId: '10', name: 'Gulab Jamun', quantity: 125, revenue: 12500, orderCount: 110 },
    ];

    // Mock payment breakdown
    const mockPaymentBreakdown: PaymentBreakdown = {
      CASH: { count: 120, amount: 85000, percentage: 42 },
      UPI: { count: 180, amount: 105000, percentage: 52 },
      CARD: { count: 30, amount: 12000, percentage: 6 },
    };

    setRevenueData(mockRevenueData);
    setSummary(mockSummary);
    setTopItems(mockTopItems);
    setPaymentBreakdown(mockPaymentBreakdown);
    setLoading(false);
  };

  // ============================================================
  // CHART COLORS
  // ============================================================

  const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444'];

  // ============================================================
  // RENDER
  // ============================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader size={48} className="animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
          <p className="text-sm text-gray-500">Comprehensive business insights</p>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign size={20} className="text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              ₹{summary.totalRevenue.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">Total Revenue</p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingCart size={20} className="text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">{summary.totalOrders}</p>
            <p className="text-xs text-gray-500 mt-1">Total Orders</p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <TrendingUp size={20} className="text-amber-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              ₹{summary.averageOrderValue.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">Avg Order Value</p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users size={20} className="text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              ₹{summary.totalGST.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">GST Collected</p>
          </div>
        </div>
      )}

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Revenue Over Time</h3>
        {revenueData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number) => `₹${value.toLocaleString()}`}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Line type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} />
              <Line type="monotone" dataKey="netRevenue" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-400">
            No revenue data available
          </div>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Payment Methods</h3>
          {paymentBreakdown ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Cash', value: paymentBreakdown.CASH.amount },
                    { name: 'UPI', value: paymentBreakdown.UPI.amount },
                    { name: 'Card', value: paymentBreakdown.CARD.amount },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {[0, 1, 2].map((index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              No payment data available
            </div>
          )}
        </div>

        {/* Top Selling Items */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Top Selling Items</h3>
          {topItems.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topItems.slice(0, 5)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
                <Tooltip formatter={(value: number) => `${value} sold`} />
                <Bar dataKey="quantity" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              No items sold yet
            </div>
          )}
        </div>
      </div>

      {/* Top Items List */}
      {topItems.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Top 10 Items</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {topItems.map((item, idx) => (
              <div key={item.menuItemId} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.quantity} sold • {item.orderCount} orders</p>
                  </div>
                </div>
                <span className="font-semibold text-gray-800">₹{item.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
