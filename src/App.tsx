// ============================================================
// App.tsx - Main Application Entry Point
// Multi-Tenant Hotel/Restaurant Management System (SaaS)
// ============================================================

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/DashboardLayout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { SuperAdminLoginPage } from './pages/SuperAdminLoginPage';
import { AdminHotelsPage } from './pages/admin/AdminHotelsPage';
import { OwnerDashboard } from './pages/owner/OwnerDashboard';
import { OwnerMenuPage } from './pages/owner/OwnerMenuPage';
import { OwnerTablesPage } from './pages/owner/OwnerTablesPage';
import { QRManagementPage } from './pages/owner/QRManagementPage';
import { OwnerStaffManagement } from './pages/owner/OwnerStaffManagement';
import { OwnerBilling } from './pages/owner/OwnerBilling';
import { OwnerOrdersPage } from './pages/owner/OwnerOrdersPage';
import { OwnerReportsPage } from './pages/owner/OwnerReportsPage';
import { KitchenDashboardRealtime } from './pages/kitchen/KitchenDashboardRealtime';
import { WaiterDashboard } from './pages/waiter/WaiterDashboard';
import { CustomerOrderPage } from './pages/customer/CustomerOrderPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Secret Super Admin Login */}
            <Route path="/platform/login" element={<SuperAdminLoginPage />} />
            
            {/* Customer QR Route (Public - No Auth Required) */}
            <Route path="/customer/:hotelId" element={<CustomerOrderPage />} />
            <Route path="/customer/demo" element={<Navigate to="/customer/hotel-1?table=table-1&token=ZGVtbw==" replace />} />

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
              path="/owner"
              element={
                <ProtectedRoute allowedRoles={['OWNER']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<OwnerDashboard />} />
              <Route path="menu" element={<OwnerMenuPage />} />
              <Route path="tables" element={<OwnerTablesPage />} />
              <Route path="qr" element={<QRManagementPage />} />
              <Route path="staff" element={<OwnerStaffManagement />} />
              <Route path="billing" element={<OwnerBilling />} />
              <Route path="orders" element={<OwnerOrdersPage />} />
              <Route path="reports" element={<OwnerReportsPage />} />
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
              <Route index element={<KitchenDashboardRealtime />} />
            </Route>

            {/* Waiter Routes */}
            <Route
              path="/waiter"
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
                  <p className="text-gray-500 mb-4">You don't have access to this page</p>
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
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
