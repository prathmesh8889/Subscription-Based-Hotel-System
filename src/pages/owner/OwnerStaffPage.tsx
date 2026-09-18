// ============================================================
// Owner - Staff Management
// ============================================================

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { UserRole } from '../../types';
import { Users, Plus, X, Shield, ChefHat, ClipboardList } from 'lucide-react';

export function OwnerStaffPage() {
  const { user } = useAuth();
  const { getCurrentHotel } = useData();
  const hotel = getCurrentHotel();

  // Mock staff data (in real app, fetched from DB with hotel_id filter)
  const [staff, setStaff] = useState([
    { id: '1', name: 'Chef Anil', email: 'kitchen@tajpalace.com', role: 'KITCHEN' as UserRole, active: true },
    { id: '2', name: 'Suresh', email: 'waiter@tajpalace.com', role: 'WAITER' as UserRole, active: true },
    { id: '3', name: 'Ravi', email: 'ravi@tajpalace.com', role: 'KITCHEN' as UserRole, active: true },
    { id: '4', name: 'Meena', email: 'meena@tajpalace.com', role: 'WAITER' as UserRole, active: false },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', role: 'WAITER' as UserRole });

  const handleAddStaff = () => {
    if (!newStaff.name || !newStaff.email) return;
    setStaff(prev => [...prev, {
      id: `staff-${Date.now()}`,
      ...newStaff,
      active: true,
    }]);
    setShowAddForm(false);
    setNewStaff({ name: '', email: '', role: 'WAITER' });
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'KITCHEN': return <ChefHat size={16} className="text-orange-500" />;
      case 'WAITER': return <ClipboardList size={16} className="text-blue-500" />;
      default: return <Shield size={16} className="text-gray-500" />;
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'KITCHEN': return 'bg-orange-100 text-orange-700';
      case 'WAITER': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Staff Management</h1>
          <p className="text-sm text-gray-500">{staff.filter(s => s.active).length} active staff members</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Add Staff
        </button>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map(member => (
          <div key={member.id} className={`bg-white rounded-xl border shadow-sm p-4 ${!member.active ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-slate-600">{member.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">{member.name}</p>
                  <p className="text-xs text-gray-500">{member.email}</p>
                </div>
              </div>
              {getRoleIcon(member.role)}
            </div>
            <div className="flex items-center justify-between mt-4">
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${getRoleBadge(member.role)}`}>
                {member.role}
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${member.active ? 'text-green-600' : 'text-gray-400'}`}>
                  {member.active ? '● Active' : '○ Inactive'}
                </span>
                <button
                  onClick={() => setStaff(prev => prev.map(s => s.id === member.id ? { ...s, active: !s.active } : s))}
                  className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                >
                  {member.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Staff Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Staff Member</h3>
              <button onClick={() => setShowAddForm(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="Staff name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="staff@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
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
    </div>
  );
}
