// ============================================================
// KITCHEN DASHBOARD - Real-Time Order Display
// ============================================================

import React from 'react';
import { useAuth } from '../../context/AuthContext';

export function KitchenDashboardRealtime() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Kitchen Display</h1>
        <p className="text-sm text-gray-500">Live orders • Auto-updates via Socket.IO</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <p className="text-gray-600">Welcome, {user?.name}!</p>
        <p className="text-gray-500 mt-2">Kitchen dashboard will display live orders here.</p>
      </div>
    </div>
  );
}
