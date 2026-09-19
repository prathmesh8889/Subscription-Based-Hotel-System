// ============================================================
// APP - Main Application Entry Point
// ============================================================

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/DashboardLayout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { SuperAdminLoginPage } from './pages/SuperAdminLoginPage';
import { AdminHotelsPage } from './pages/admin/AdminHotelsPage';
import { OwnerDashboard } from './pages/owner/OwnerDashboard';
import { LiveOrders } from './pages/kitchen/LiveOrders';
import { WaiterDashboard } from './pages/waiter/WaiterDashboard';
import { CustomerQRMenu } from './pages/customer/CustomerQRMenu';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Secret Super Admin Login */}
          <Route path="/platform/login" element={<SuperAdminLoginPage />} />
          
          {/* Customer QR Route (Public - No Auth Required) */}
          <Route path="/customer/:hotelId" element={<CustomerQRMenu />} />
          <Route path="/customer/demo" element={<Navigate to="/customer/demo-hotel?table=demo-table&tableNumber=1" replace />} />

          {/* Super Admin Routes - Protected & Secret */}
          <Route
            path="/platform/*"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<AdminHotelsPage />} />
            <Route path="hotels" element={<AdminHotelsPage />} />
            <Route path="subscriptions" element={<AdminHotelsPage />} />
            <Route path="analytics" element={<AdminHotelsPage />} />
          </Route>

          {/* Hotel Owner Routes */}
          <Route
            path="/owner/*"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<OwnerDashboard />} />
            <Route path="menu" element={<OwnerDashboard />} />
            <Route path="tables" element={<OwnerDashboard />} />
            <Route path="qr" element={<OwnerDashboard />} />
            <Route path="staff" element={<OwnerDashboard />} />
            <Route path="orders" element={<OwnerDashboard />} />
            <Route path="billing" element={<OwnerDashboard />} />
            <Route path="reports" element={<OwnerDashboard />} />
          </Route>

          {/* Kitchen Staff Routes - Real-time Socket.IO */}
          <Route
            path="/kitchen"
            element={
              <ProtectedRoute allowedRoles={['KITCHEN']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<LiveOrders />} />
          </Route>

          {/* Waiter Routes */}
          <Route
            path="/waiter/*"
            element={
              <ProtectedRoute allowedRoles={['WAITER']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<WaiterDashboard />} />
            <Route path="orders" element={<WaiterDashboard />} />
            <Route path="billing" element={<WaiterDashboard />} />
          </Route>

          {/* Unauthorized Page */}
          <Route path="/unauthorized" element={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">403</h1>
                <p className="text-gray-500 mb-4">Access Denied</p>
                <a href="/login" className="text-amber-600 hover:text-amber-700 font-medium">
                  Go to Login
                </a>
              </div>
            </div>
          } />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
