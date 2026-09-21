// ============================================================
// DASHBOARD LAYOUT - Sidebar + Header
// ============================================================

import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import {
  LayoutDashboard, UtensilsCrossed, Table2, QrCode, Users,
  Receipt, ChefHat, ClipboardList, Building2, CreditCard,
  LogOut, Menu, X, Bell, Settings
} from 'lucide-react';

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { getHotelOrders } = useData();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const hotelOrders = user?.hotelId ? getHotelOrders(user.hotelId) : [];
  const pendingAlerts = hotelOrders.filter(o => ['PENDING','PREPARING','READY'].includes(o.status)).length;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Navigation items based on role
  const getNavItems = () => {
    switch (user?.role) {
      case 'SUPER_ADMIN':
        return [
          { to: '/platform/dashboard', icon: Building2, label: 'Hotels' },
          { to: '/platform/subscriptions', icon: CreditCard, label: 'Subscriptions' },
          { to: '/platform/analytics', icon: LayoutDashboard, label: 'Analytics' },
        ];
      case 'OWNER':
        return [
          { to: '/owner', icon: LayoutDashboard, label: 'Dashboard' },
          { to: '/owner/menu', icon: UtensilsCrossed, label: 'Menu' },
          { to: '/owner/tables', icon: Table2, label: 'Tables' },
          { to: '/owner/qr', icon: QrCode, label: 'QR Codes' },
          { to: '/owner/staff', icon: Users, label: 'Staff' },
          { to: '/owner/orders', icon: ClipboardList, label: 'Orders' },
          { to: '/owner/billing', icon: CreditCard, label: 'Billing' },
          { to: '/owner/reports', icon: Receipt, label: 'Reports' },
          { to: '/owner/settings', icon: Settings, label: 'Settings' },
        ];
      case 'KITCHEN':
        return [
          { to: '/kitchen', icon: ChefHat, label: 'Live Kitchen' },
        ];
      case 'WAITER':
        return [
          { to: '/waiter', icon: LayoutDashboard, label: 'Dashboard' },
          { to: '/waiter/orders', icon: ClipboardList, label: 'Orders' },
          { to: '/waiter/billing', icon: Receipt, label: 'Billing' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 max-w-[86vw] bg-slate-900 text-white transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo / Hotel Name */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                <UtensilsCrossed size={20} className="text-white" />
              </div>
              <div>
                <h1 className="font-bold text-sm">
                  {user?.role === 'SUPER_ADMIN' ? 'SaaS Admin' : user?.hotel?.name || 'Restaurant'}
                </h1>
                <p className="text-xs text-slate-400">
                  {user?.role === 'SUPER_ADMIN' ? 'Platform Management' : user?.hotel?.subscriptionPlan + ' Plan'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold">{user?.name?.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 truncate">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0 w-full flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-3 sm:px-4 py-3 flex items-center justify-between gap-3 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="font-semibold text-gray-800">
                {user?.role === 'SUPER_ADMIN' ? 'Super Admin Panel' : user?.hotel?.name}
              </h2>
              {user?.hotel && user?.role !== 'SUPER_ADMIN' && (
                <p className="text-xs text-gray-500">{user.hotel.subscriptionPlan} Plan</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (user?.role === 'OWNER') navigate('/owner/orders');
                else if (user?.role === 'KITCHEN') navigate('/kitchen');
                else if (user?.role === 'WAITER') navigate('/waiter/orders');
              }}
              className="p-2 hover:bg-gray-100 rounded-lg relative"
              title="Order notifications"
            >
              <Bell size={18} className="text-gray-600" />
              {pendingAlerts > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 text-[10px] bg-red-500 text-white rounded-full grid place-items-center">
                  {Math.min(pendingAlerts, 99)}
                </span>
              )}
            </button>
            {user?.role === 'OWNER' && (
              <button
                onClick={() => navigate('/owner/settings')}
                className="p-2 hover:bg-gray-100 rounded-lg"
                title="Settings"
              >
                <Settings size={18} className="text-gray-600" />
              </button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 min-w-0 p-3 sm:p-4 lg:p-6 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
