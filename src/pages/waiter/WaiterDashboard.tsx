// ============================================================
// WAITER DASHBOARD - Order Management & Billing
// ============================================================

import React from 'react';
import { useAuth } from '../../context/AuthContext';

export function WaiterDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Waiter Panel</h1>
        <p className="text-sm text-gray-500">Manage orders, serve tables, and process payments</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <p className="text-gray-600">Welcome, {user?.name}!</p>
        <p className="text-gray-500 mt-2">Waiter dashboard will display orders and billing here.</p>
      </div>
    </div>
  );
}
