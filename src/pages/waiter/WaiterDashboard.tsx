// ============================================================
// Waiter Dashboard - Order Management & Billing
// ============================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Order, PaymentMethod, CartItem, MenuItem } from '../../types';
import {
  ClipboardList, Receipt, Plus, CheckCircle2,
  CreditCard, Banknote, X, ShoppingCart, Minus
} from 'lucide-react';

export function WaiterDashboard() {
  const { user } = useAuth();
  const { getHotelOrders, getHotelTables, getHotelMenu, updateOrderStatus, updatePaymentStatus, createOrder } = useData();
  const location = useLocation();
  const navigate = useNavigate();

  const hotelId = user?.hotel_id || '';
  const orders = getHotelOrders(hotelId);
  const tables = getHotelTables(hotelId);
  const menuItems = getHotelMenu(hotelId);

  // Sync tab with URL path
  const getTabFromPath = (): 'orders' | 'billing' | 'new-order' => {
    if (location.pathname.endsWith('/billing')) return 'billing';
    if (location.pathname.endsWith('/orders')) return 'orders';
    return 'orders';
  };

  const [activeTab, setActiveTab] = useState<'orders' | 'billing' | 'new-order'>(getTabFromPath());

  // Update tab when URL changes
  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [location.pathname]);

  const handleTabChange = (tab: 'orders' | 'billing' | 'new-order') => {
    setActiveTab(tab);
    if (tab === 'billing') navigate('/waiter/billing');
    else if (tab === 'orders') navigate('/waiter/orders');
    else navigate('/waiter');
  };
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [billingOrder, setBillingOrder] = useState<Order | null>(null);

  // Active orders include all non-completed orders AND served-but-unpaid orders
  // (waiter needs to see served orders to generate bills)
  const activeOrders = orders.filter(o => 
    o.status !== 'SERVED' || o.payment_status === 'UNPAID'
  );
  const readyOrders = orders.filter(o => o.status === 'READY');
  const unpaidOrders = orders.filter(o => o.payment_status === 'UNPAID' && o.status === 'SERVED');

  // Add to cart
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.menu_item.id === item.id);
      if (existing) {
        return prev.map(c => c.menu_item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { menu_item: item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(c => c.menu_item.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(c => c.menu_item.id === itemId ? { ...c, quantity: c.quantity - 1 } : c);
      }
      return prev.filter(c => c.menu_item.id !== itemId);
    });
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.menu_item.price * c.quantity, 0);

  const placeOrder = () => {
    if (!selectedTable || cart.length === 0) return;
    createOrder(hotelId, selectedTable, cart);
    setCart([]);
    setSelectedTable('');
    handleTabChange('orders');
  };

  const processPayment = (orderId: string, method: PaymentMethod) => {
    updatePaymentStatus(orderId, 'PAID', method);
    setBillingOrder(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Waiter Panel</h1>
          <p className="text-sm text-gray-500">Manage orders, serve tables, and process payments</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => handleTabChange('orders')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'orders' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ClipboardList size={16} />
          Active Orders ({activeOrders.length})
        </button>
        <button
          onClick={() => handleTabChange('billing')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'billing' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Receipt size={16} />
          Billing ({unpaidOrders.length})
        </button>
        <button
          onClick={() => handleTabChange('new-order')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'new-order' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Plus size={16} />
          New Order
        </button>
      </div>

      {/* Active Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {activeOrders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <ClipboardList size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No active orders</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeOrders.map(order => (
                <div key={order.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className={`px-4 py-3 flex items-center justify-between ${
                    order.status === 'PENDING' ? 'bg-amber-50' :
                    order.status === 'PREPARING' ? 'bg-blue-50' :
                    order.status === 'READY' ? 'bg-green-50' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800">Table {order.table_number}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        order.status === 'PENDING' ? 'bg-amber-200 text-amber-800' :
                        order.status === 'PREPARING' ? 'bg-blue-200 text-blue-800' :
                        order.status === 'READY' ? 'bg-green-200 text-green-800' :
                        'bg-gray-200 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">₹{order.total_amount}</span>
                  </div>
                  <div className="p-4">
                    <div className="space-y-1.5">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-600">{item.quantity}x {item.name}</span>
                          <span className="text-gray-500">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-4">
                      {order.status === 'READY' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'SERVED')}
                          className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600"
                        >
                          <CheckCircle2 size={14} />
                          Mark Served
                        </button>
                      )}
                      {order.status === 'SERVED' && order.payment_status === 'UNPAID' && (
                        <button
                          onClick={() => { setBillingOrder(order); handleTabChange('billing'); }}
                          className="flex-1 flex items-center justify-center gap-1 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600"
                        >
                          <Receipt size={14} />
                          Generate Bill
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="space-y-4">
          {unpaidOrders.length === 0 && !billingOrder ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Receipt size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No pending bills</p>
            </div>
          ) : (
            <>
              {unpaidOrders.map(order => (
                <div key={order.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800">Table {order.table_number}</h3>
                      <p className="text-xs text-gray-500">Order #{order.id.slice(-6)}</p>
                    </div>
                    <p className="text-xl font-bold text-gray-800">₹{order.total_amount}</p>
                  </div>
                  <div className="space-y-1 mb-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm text-gray-600">
                        <span>{item.quantity}x {item.name}</span>
                        <span>₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => processPayment(order.id, 'CASH')}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600"
                    >
                      <Banknote size={16} />
                      Cash
                    </button>
                    <button
                      onClick={() => processPayment(order.id, 'UPI')}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-purple-500 text-white text-sm font-medium rounded-lg hover:bg-purple-600"
                    >
                      <CreditCard size={16} />
                      UPI
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* New Order Tab */}
      {activeTab === 'new-order' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Selection */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Table</label>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              >
                <option value="">Choose a table...</option>
                {tables.filter(t => t.status === 'AVAILABLE').map(t => (
                  <option key={t.id} value={t.id}>Table {t.table_number} ({t.capacity} seats)</option>
                ))}
              </select>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Menu Items</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                {menuItems.filter(m => m.is_available).map(item => (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="flex items-center justify-between p-3 bg-gray-50 hover:bg-amber-50 rounded-lg transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-500">₹{item.price}</p>
                    </div>
                    <Plus size={16} className="text-amber-500" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cart */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 h-fit sticky top-4">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart size={18} className="text-amber-500" />
              <h3 className="font-semibold text-gray-800">Current Order</h3>
            </div>

            {cart.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Add items to start an order</p>
            ) : (
              <>
                <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.menu_item.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">{item.menu_item.name}</p>
                        <p className="text-xs text-gray-500">₹{item.menu_item.price} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => removeFromCart(item.menu_item.id)} className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded text-gray-600 hover:bg-gray-200">
                          <Minus size={12} />
                        </button>
                        <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                        <button onClick={() => addToCart(item.menu_item)} className="w-6 h-6 flex items-center justify-center bg-amber-100 rounded text-amber-600 hover:bg-amber-200">
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-3 mb-4">
                  <div className="flex justify-between text-sm font-bold">
                    <span>Total</span>
                    <span className="text-amber-600">₹{cartTotal}</span>
                  </div>
                </div>

                <button
                  onClick={placeOrder}
                  disabled={!selectedTable || cart.length === 0}
                  className="w-full py-2.5 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Place Order
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
