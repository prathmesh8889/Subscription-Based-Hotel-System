// ============================================================
// OWNER DASHBOARD - Overview & Analytics
// ============================================================

import React from 'react';
import { useAuth } from '../../context/AuthContext';

export function OwnerDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Welcome back, {user?.name}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <span className="text-amber-600 font-bold">₹</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">₹0</p>
          <p className="text-xs text-gray-500 mt-1">Total Revenue</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-bold">0</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">0</p>
          <p className="text-xs text-gray-500 mt-1">Today's Orders</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 font-bold">0</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">0</p>
          <p className="text-xs text-gray-500 mt-1">Pending Orders</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 font-bold">0</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">0/0</p>
          <p className="text-xs text-gray-500 mt-1">Tables Available</p>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Welcome to RestroFlow!</h2>
        <p className="text-gray-600 mb-4">
          Your restaurant management system is ready. Start by setting up your menu and tables.
        </p>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors">
            Setup Menu
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            Add Tables
          </button>
        </div>
      </div>
    </div>
  );
}
