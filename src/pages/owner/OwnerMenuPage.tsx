// ============================================================
// Owner - Menu Management (CRUD + Availability Toggle)
// ============================================================

import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { MenuItem } from '../../types';
import { Plus, Search, Edit2, Trash2, ToggleLeft, ToggleRight, X, Save } from 'lucide-react';

const CATEGORIES = ['Starters', 'Main Course', 'Rice', 'Breads', 'South Indian', 'Desserts', 'Beverages', 'Snacks', 'Thali', 'Other'];

export function OwnerMenuPage() {
  const { getCurrentHotel, getHotelMenu, addMenuItem, updateMenuItem, deleteMenuItem } = useData();
  const hotel = getCurrentHotel();
  const menuItems = hotel ? getHotelMenu(hotel.id) : [];

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', category: 'Main Course',
    is_available: true, prep_time_minutes: '15', image_url: '',
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...new Set(menuItems.map(m => m.category))];

  const openAddForm = () => {
    setEditingItem(null);
    setFormData({ name: '', description: '', price: '', category: 'Main Course', is_available: true, prep_time_minutes: '15', image_url: '' });
    setShowForm(true);
  };

  const openEditForm = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name, description: item.description, price: item.price.toString(),
      category: item.category, is_available: item.is_available,
      prep_time_minutes: item.prep_time_minutes.toString(), image_url: item.image_url,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!hotel) return;

    const price = Number(formData.price);
    const prepTime = Number(formData.prep_time_minutes);

    if (!formData.name.trim()) {
      setError('Item name is required.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setError('Enter a valid price greater than 0.');
      return;
    }
    if (!Number.isInteger(prepTime) || prepTime < 0) {
      setError('Enter a valid preparation time.');
      return;
    }

    const data = {
      hotel_id: hotel.id,
      name: formData.name.trim(),
      description: formData.description.trim(),
      price,
      category: formData.category,
      is_available: formData.is_available,
      prep_time_minutes: prepTime,
      image_url: formData.image_url,
    };

    setSaving(true);
    setError('');
    setMessage('');

    try {
      if (editingItem) {
        await updateMenuItem(editingItem.id, data);
        setMessage('Menu item updated successfully.');
      } else {
        await addMenuItem(data);
        setMessage('Menu item added successfully.');
      }
      setShowForm(false);
    } catch (e: any) {
      setError(e.message || 'Failed to save menu item.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Menu Management</h1>
          <p className="text-sm text-gray-500">{menuItems.length} items • {menuItems.filter(m => m.is_available).length} available</p>
        </div>
        <button
          onClick={openAddForm}
          className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Add Item
        </button>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}
      {message && <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">{message}</div>}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-2 text-sm rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${
              item.is_available ? 'border-gray-200' : 'border-gray-200 opacity-60'
            }`}
          >
            {/* Image placeholder */}
            <div className="h-32 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
              <span className="text-4xl">
                {item.category === 'Beverages' ? '🥤' :
                 item.category === 'Desserts' ? '🍰' :
                 item.category === 'Starters' ? '🥗' :
                 item.category === 'Rice' ? '🍚' :
                 item.category === 'Breads' ? '🫓' :
                 item.category === 'South Indian' ? '🥘' : '🍛'}
              </span>
            </div>
            
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{item.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                </div>
                <span className="text-lg font-bold text-amber-600 ml-2">₹{item.price}</span>
              </div>
              
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                  {item.category} • {item.prep_time_minutes}min
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={async () => {
                      setError('');
                      setMessage('');
                      try {
                        await updateMenuItem(item.id, { is_available: !item.is_available });
                        setMessage(item.is_available ? 'Item marked unavailable.' : 'Item marked available.');
                      } catch (e: any) {
                        setError(e.message || 'Failed to update item availability.');
                      }
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      item.is_available ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'
                    }`}
                    title={item.is_available ? 'Available' : 'Unavailable'}
                  >
                    {item.is_available ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  </button>
                  <button
                    onClick={() => openEditForm(item)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm('Delete this item?')) return;
                      setError('');
                      setMessage('');
                      try {
                        await deleteMenuItem(item.id);
                        setMessage('Menu item deleted.');
                      } catch (e: any) {
                        setError(e.message || 'Failed to delete menu item.');
                      }
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p>No menu items found</p>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-4 sm:p-6 shadow-xl max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="e.g., Butter Chicken"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                  rows={2}
                  placeholder="Brief description..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prep Time (min)</label>
                  <input
                    type="number"
                    value={formData.prep_time_minutes}
                    onChange={(e) => setFormData({ ...formData, prep_time_minutes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="15"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFormData({ ...formData, is_available: !formData.is_available })}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.is_available
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {formData.is_available ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  {formData.is_available ? 'Available' : 'Unavailable'}
                </button>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving ? 'Saving...' : editingItem ? 'Update' : 'Add Item'}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
