// ============================================================
// Owner - Enhanced Staff Management with Activity Tracking
// ============================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { UserRole } from '../../types';
import { 
  Plus, X, Shield, ChefHat, ClipboardList, 
  Users, Activity, Clock, TrendingUp, CheckCircle,
  AlertCircle, Edit2, Trash2, Phone, Mail, Calendar
} from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  phone?: string;
  joinDate: string;
  ordersHandled?: number;
  avgRating?: number;
  lastActive?: string;
}

export function OwnerStaffManagement() {
  const { user } = useAuth();
  const { getCurrentHotel, getHotelOrders } = useData();
  const hotel = getCurrentHotel();
  const orders = hotel ? getHotelOrders(hotel.id) : [];

  // Enhanced staff data with activity tracking
  const [staff, setStaff] = useState<StaffMember[]>([
    { 
      id: '1', 
      name: 'Chef Anil', 
      email: 'kitchen@tajpalace.com', 
      role: 'KITCHEN', 
      active: true,
      phone: '+91 98765 43210',
      joinDate: '2024-03-15',
      ordersHandled: 245,
      avgRating: 4.8,
      lastActive: '2026-01-15T12:30:00Z'
    },
    { 
      id: '2', 
      name: 'Suresh', 
      email: 'waiter@tajpalace.com', 
      role: 'WAITER', 
      active: true,
      phone: '+91 98765 43211',
      joinDate: '2024-06-20',
      ordersHandled: 189,
      avgRating: 4.6,
      lastActive: '2026-01-15T12:45:00Z'
    },
    { 
      id: '3', 
      name: 'Ravi Kumar', 
      email: 'ravi@tajpalace.com', 
      role: 'KITCHEN', 
      active: true,
      phone: '+91 98765 43212',
      joinDate: '2024-09-10',
      ordersHandled: 156,
      avgRating: 4.7,
      lastActive: '2026-01-15T12:20:00Z'
    },
    { 
      id: '4', 
      name: 'Meena Sharma', 
      email: 'meena@tajpalace.com', 
      role: 'WAITER', 
      active: false,
      phone: '+91 98765 43213',
      joinDate: '2024-01-05',
      ordersHandled: 312,
      avgRating: 4.9,
      lastActive: '2026-01-10T18:00:00Z'
    },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showDetails, setShowDetails] = useState<StaffMember | null>(null);
  const [newStaff, setNewStaff] = useState({ 
    name: '', 
    email: '', 
    role: 'WAITER' as UserRole,
    phone: ''
  });

  // Calculate staff statistics
  const activeStaff = staff.filter(s => s.active);
  const kitchenStaff = staff.filter(s => s.role === 'KITCHEN' && s.active);
  const waiterStaff = staff.filter(s => s.role === 'WAITER' && s.active);
  const totalOrdersHandled = staff.reduce((sum, s) => sum + (s.ordersHandled || 0), 0);
  const avgRating = staff.reduce((sum, s) => sum + (s.avgRating || 0), 0) / staff.length;

  const handleAddStaff = () => {
    if (!newStaff.name || !newStaff.email) return;
    const newMember: StaffMember = {
      id: `staff-${Date.now()}`,
      name: newStaff.name,
      email: newStaff.email,
      role: newStaff.role,
      phone: newStaff.phone,
      joinDate: new Date().toISOString().split('T')[0],
      active: true,
      ordersHandled: 0,
      avgRating: 0,
      lastActive: new Date().toISOString()
    };
    setStaff(prev => [...prev, newMember]);
    setShowAddForm(false);
    setNewStaff({ name: '', email: '', role: 'WAITER', phone: '' });
  };

  const handleToggleActive = (staffId: string) => {
    setStaff(prev => prev.map(s => 
      s.id === staffId ? { ...s, active: !s.active } : s
    ));
  };

  const handleDelete = (staffId: string) => {
    if (confirm('Are you sure you want to remove this staff member?')) {
      setStaff(prev => prev.filter(s => s.id !== staffId));
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'KITCHEN': return <ChefHat size={20} className="text-orange-500" />;
      case 'WAITER': return <ClipboardList size={20} className="text-blue-500" />;
      default: return <Shield size={20} className="text-gray-500" />;
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'KITCHEN': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'WAITER': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Staff Management</h1>
          <p className="text-sm text-gray-500">Manage your team and track performance</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Add Staff Member
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users size={20} className="text-blue-600" />
            </div>
            <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
              {activeStaff.length} active
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{staff.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total Staff</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <ChefHat size={20} className="text-orange-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{kitchenStaff.length}</p>
          <p className="text-xs text-gray-500 mt-1">Kitchen Staff</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <ClipboardList size={20} className="text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{totalOrdersHandled}</p>
          <p className="text-xs text-gray-500 mt-1">Orders Handled</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
              ★ {avgRating.toFixed(1)}
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{waiterStaff.length}</p>
          <p className="text-xs text-gray-500 mt-1">Waiters</p>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map(member => (
          <div 
            key={member.id} 
            className={`bg-white rounded-xl border shadow-sm p-5 transition-all hover:shadow-md ${
              !member.active ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-slate-600">
                    {member.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{member.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getRoleBadge(member.role)}`}>
                      {member.role}
                    </span>
                    {getRoleIcon(member.role)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowDetails(member)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="View Details"
                >
                  <Activity size={16} />
                </button>
                <button
                  onClick={() => handleToggleActive(member.id)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    member.active 
                      ? 'text-green-600 hover:bg-green-50' 
                      : 'text-gray-400 hover:bg-gray-50'
                  }`}
                  title={member.active ? 'Deactivate' : 'Activate'}
                >
                  {member.active ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                </button>
                <button
                  onClick={() => handleDelete(member.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail size={14} className="text-gray-400" />
                <span className="truncate">{member.email}</span>
              </div>
              {member.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone size={14} className="text-gray-400" />
                  <span>{member.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar size={14} className="text-gray-400" />
                <span>Joined {new Date(member.joinDate).toLocaleDateString()}</span>
              </div>
            </div>

            {member.active && member.lastActive && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Clock size={12} />
                    <span>Last active: {getTimeAgo(member.lastActive)}</span>
                  </div>
                  {member.ordersHandled && (
                    <div className="flex items-center gap-1 text-gray-500">
                      <ClipboardList size={12} />
                      <span>{member.ordersHandled} orders</span>
                    </div>
                  )}
                </div>
                {member.avgRating && member.avgRating > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-yellow-500">★</span>
                    <span className="text-xs font-medium text-gray-700">
                      {member.avgRating.toFixed(1)} rating
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Staff Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Staff Member</h3>
              <button 
                onClick={() => setShowAddForm(false)} 
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="staff@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="KITCHEN">Kitchen Staff</option>
                  <option value="WAITER">Waiter / Cashier</option>
                </select>
              </div>
              <button
                onClick={handleAddStaff}
                className="w-full py-2.5 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors"
              >
                Add Staff Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Staff Details</h3>
              <button 
                onClick={() => setShowDetails(null)} 
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Profile Section */}
              <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-slate-600">
                    {showDetails.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-800">{showDetails.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-sm px-3 py-1 rounded-full border ${getRoleBadge(showDetails.role)}`}>
                      {showDetails.role}
                    </span>
                    {getRoleIcon(showDetails.role)}
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2">
                <h5 className="font-medium text-gray-700">Contact Information</h5>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail size={16} className="text-gray-400" />
                    <span className="text-gray-700">{showDetails.email}</span>
                  </div>
                  {showDetails.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone size={16} className="text-gray-400" />
                      <span className="text-gray-700">{showDetails.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={16} className="text-gray-400" />
                    <span className="text-gray-700">
                      Joined {new Date(showDetails.joinDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="space-y-2">
                <h5 className="font-medium text-gray-700">Performance</h5>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <ClipboardList size={16} className="text-blue-600" />
                      <span className="text-xs text-blue-700 font-medium">Orders Handled</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-800">
                      {showDetails.ordersHandled || 0}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp size={16} className="text-green-600" />
                      <span className="text-xs text-green-700 font-medium">Avg Rating</span>
                    </div>
                    <p className="text-2xl font-bold text-green-800">
                      {showDetails.avgRating?.toFixed(1) || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Activity */}
              <div className="space-y-2">
                <h5 className="font-medium text-gray-700">Activity</h5>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock size={16} className="text-gray-400" />
                    <span className="text-gray-700">
                      Last active: {showDetails.lastActive ? getTimeAgo(showDetails.lastActive) : 'Never'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm mt-2">
                    {showDetails.active ? (
                      <>
                        <CheckCircle size={16} className="text-green-500" />
                        <span className="text-green-700 font-medium">Currently Active</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={16} className="text-gray-400" />
                        <span className="text-gray-600">Inactive</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    handleToggleActive(showDetails.id);
                    setShowDetails(null);
                  }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                    showDetails.active
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {showDetails.active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => {
                    handleDelete(showDetails.id);
                    setShowDetails(null);
                  }}
                  className="flex-1 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
