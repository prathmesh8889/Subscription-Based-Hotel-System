// ============================================================
// ADMIN HOTELS PAGE - Super Admin Dashboard
// ============================================================

import React from 'react';
import { useAuth } from '../../context/AuthContext';

export function AdminHotelsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Hotel Management</h1>
        <p className="text-sm text-gray-500">Manage all registered hotels and their subscriptions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-bold">0</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">0</p>
              <p className="text-xs text-gray-500">Total Hotels</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 font-bold">0</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">0</p>
              <p className="text-xs text-gray-500">Active Subscriptions</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <span className="text-amber-600 font-bold">₹</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">₹0</p>
              <p className="text-xs text-gray-500">Monthly Revenue</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-red-600 font-bold">0</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">0</p>
              <p className="text-xs text-gray-500">Expired/Trial</p>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Welcome, Super Admin!</h2>
        <p className="text-gray-600 mb-4">
          You have full access to manage all hotels, subscriptions, and platform settings.
        </p>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
            Add New Hotel
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            View Analytics
          </button>
        </div>
      </div>
    </div>
  );
}
