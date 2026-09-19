// ============================================================
// CUSTOMER ORDER PAGE - QR Code Menu & Ordering
// ============================================================

import React from 'react';
import { useParams } from 'react-router-dom';

export function CustomerOrderPage() {
  const { hotelId } = useParams<{ hotelId: string }>();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome!</h1>
          <p className="text-gray-600 mb-4">
            Scan QR code to view menu and place orders.
          </p>
          <p className="text-sm text-gray-500">
            Hotel ID: {hotelId || 'Not specified'}
          </p>
        </div>
      </div>
    </div>
  );
}
