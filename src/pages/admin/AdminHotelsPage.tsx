// ============================================================
// Super Admin - Hotels Management
// ============================================================

import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { PLAN_CONFIG, PlanType, Hotel } from '../../types';
import { Building2, Check, X, CreditCard, Users, Calendar, MoreVertical, Search } from 'lucide-react';

export function AdminHotelsPage() {
  const { hotels, updateHotel, tables, orders } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);

  const filteredHotels = hotels.filter(h =>
    h.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getHotelStats = (hotelId: string) => {
    const hotelTables = tables.filter(t => t.hotel_id === hotelId);
    const hotelOrders = orders.filter(o => o.hotel_id === hotelId);
    const revenue = hotelOrders
      .filter(o => o.payment_status === 'PAID')
      .reduce((sum, o) => sum + o.total_amount, 0);
    return { tables: hotelTables.length, orders: hotelOrders.length, revenue };
  };

  const handlePlanChange = (hotelId: string, newPlan: PlanType) => {
    const config = PLAN_CONFIG[newPlan];
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    updateHotel(hotelId, {
      plan_type: newPlan,
      max_tables: config.max_tables,
      max_menu_items: config.max_menu_items,
      subscription_start_date: startDate,
      subscription_end_date: endDate,
      is_active: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Hotel Management</h1>
          <p className="text-sm text-gray-500">Manage all registered hotels and their subscriptions</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search hotels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{hotels.length}</p>
              <p className="text-xs text-gray-500">Total Hotels</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Check size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{hotels.filter(h => h.is_active).length}</p>
              <p className="text-xs text-gray-500">Active Subscriptions</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <CreditCard size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                ₹{hotels.reduce((sum, h) => sum + PLAN_CONFIG[h.plan_type].price, 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Monthly Revenue</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <X size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{hotels.filter(h => !h.is_active).length}</p>
              <p className="text-xs text-gray-500">Expired/Trial</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hotels Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Hotel</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tables</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Orders</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Expires</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredHotels.map((hotel) => {
                const stats = getHotelStats(hotel.id);
                return (
                  <tr key={hotel.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                          <Building2 size={14} className="text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{hotel.name}</p>
                          <p className="text-xs text-gray-500">{hotel.address}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        hotel.plan_type === 'BUSINESS' ? 'bg-purple-100 text-purple-700' :
                        hotel.plan_type === 'PRO' ? 'bg-blue-100 text-blue-700' :
                        hotel.plan_type === 'STARTER' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {hotel.plan_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                        hotel.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${hotel.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {hotel.is_active ? 'Active' : 'Expired'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {stats.tables}/{hotel.max_tables}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{stats.orders}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">
                      ₹{stats.revenue.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(hotel.subscription_end_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedHotel(hotel)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <MoreVertical size={16} className="text-gray-400" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hotel Detail Modal */}
      {selectedHotel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{selectedHotel.name}</h3>
              <button onClick={() => setSelectedHotel(null)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Plan</p>
                  <p className="font-semibold">{selectedHotel.plan_type}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Monthly Fee</p>
                  <p className="font-semibold">₹{PLAN_CONFIG[selectedHotel.plan_type].price}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Max Tables</p>
                  <p className="font-semibold">{selectedHotel.max_tables}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Max Menu Items</p>
                  <p className="font-semibold">{selectedHotel.max_menu_items}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Change Plan</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(PLAN_CONFIG) as PlanType[]).filter(p => p !== 'TRIAL').map((plan) => (
                    <button
                      key={plan}
                      onClick={() => {
                        handlePlanChange(selectedHotel.id, plan);
                        setSelectedHotel(null);
                      }}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        selectedHotel.plan_type === plan
                          ? 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-gray-200 hover:border-amber-300'
                      }`}
                    >
                      {plan} - ₹{PLAN_CONFIG[plan].price}/mo
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    updateHotel(selectedHotel.id, { is_active: !selectedHotel.is_active });
                    setSelectedHotel(null);
                  }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg ${
                    selectedHotel.is_active
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {selectedHotel.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => setSelectedHotel(null)}
                  className="flex-1 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
