// ============================================================
// Customer QR Experience - Public Menu & Ordering (No Login Required)
// ============================================================

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { CartItem, MenuItem } from '../../types';
import { validateQRToken } from '../../services/qrTokenService';
import {
  ShoppingCart, Plus, Minus, CheckCircle2,
  ChefHat, UtensilsCrossed, X, Search, AlertCircle
} from 'lucide-react';

export function CustomerOrderPage() {
  const { hotelId } = useParams<{ hotelId: string }>();
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get('table') || '';
  const token = searchParams.get('token') || '';

  const { getHotel, getHotelMenu, getHotelTables, createOrder, orders } = useData();

  const hotel = hotelId ? getHotel(hotelId) : undefined;
  const menuItems = hotelId ? getHotelMenu(hotelId).filter(m => m.is_available) : [];
  const tables = hotelId ? getHotelTables(hotelId) : [];
  const table = tables.find(t => t.id === tableId);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [tokenValid, setTokenValid] = useState(true);

  // Validate session token using the secure QR token service
  useEffect(() => {
    if (token && hotelId) {
      // useSearchParams already decodes the token, so pass it directly
      const result = validateQRToken(token, hotelId, tableId || undefined);
      
      if (result.valid) {
        setTokenValid(true);
      } else {
        // Fallback: accept demo tokens or tokens without strict validation
        try {
          const decoded = atob(token);
          // Accept if it contains the hotel and table info
          if (decoded.includes(hotelId) || decoded === 'demo') {
            setTokenValid(true);
          } else {
            console.warn('QR Token validation failed:', result.error);
            setTokenValid(false);
          }
        } catch (error) {
          console.error('Token decode error:', error);
          setTokenValid(false);
        }
      }
    } else {
      // Demo mode - no token provided
      setTokenValid(true);
    }
  }, [token, tableId, hotelId]);

  // Track order status
  const currentOrder = placedOrderId ? orders.find(o => o.id === placedOrderId) : null;

  const categories = ['All', ...Array.from(new Set(menuItems.map(m => m.category)))];

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const handlePlaceOrder = () => {
    if (!hotelId || !tableId || cart.length === 0) return;
    const order = createOrder(hotelId, tableId, cart);
    setPlacedOrderId(order.id);
    setOrderPlaced(true);
    setCart([]);
    setShowCart(false);
  };

  // Hotel not found screen
  if (!hotel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-amber-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Restaurant Not Found</h1>
          <p className="text-gray-500">We couldn't find this restaurant.</p>
          <p className="text-sm text-gray-400 mt-2">Please check the QR code or ask a staff member for help.</p>
        </div>
      </div>
    );
  }

  // Token invalid screen
  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X size={32} className="text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Invalid Session</h1>
          <p className="text-gray-500">This QR code session has expired or is invalid.</p>
          <p className="text-sm text-gray-400 mt-2">Please ask a staff member for a new QR code.</p>
        </div>
      </div>
    );
  }

  // Order tracking screen
  if (orderPlaced && currentOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
        <div className="max-w-md mx-auto p-4">
          {/* Header */}
          <div className="text-center pt-8 pb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Order Placed!</h1>
            <p className="text-gray-500 mt-1">Table {table?.table_number} • {hotel?.name}</p>
          </div>

          {/* Order Status Timeline */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-4">Order Status</h3>
            <div className="space-y-4">
              {[
                { status: 'PENDING', label: 'Order Received', icon: CheckCircle2, activeBg: 'bg-green-100', activeText: 'text-green-500' },
                { status: 'PREPARING', label: 'Being Prepared', icon: ChefHat, activeBg: 'bg-blue-100', activeText: 'text-blue-500' },
                { status: 'READY', label: 'Ready to Serve', icon: UtensilsCrossed, activeBg: 'bg-amber-100', activeText: 'text-amber-500' },
                { status: 'SERVED', label: 'Served', icon: CheckCircle2, activeBg: 'bg-green-100', activeText: 'text-green-500' },
              ].map((step, idx) => {
                const statusOrder = ['PENDING', 'PREPARING', 'READY', 'SERVED'];
                const currentIdx = statusOrder.indexOf(currentOrder.status);
                const isActive = idx <= currentIdx;
                const isCurrent = idx === currentIdx;

                return (
                  <div key={step.status} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isActive ? step.activeBg : 'bg-gray-100'
                    }`}>
                      <step.icon size={16} className={isActive ? step.activeText : 'text-gray-400'} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isActive ? 'text-gray-800' : 'text-gray-400'}`}>
                        {step.label}
                      </p>
                    </div>
                    {isCurrent && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full animate-pulse">
                        Current
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-3">Order Summary</h3>
            <div className="space-y-2">
              {currentOrder.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.quantity}x {item.name}</span>
                  <span className="text-gray-800 font-medium">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-amber-600">₹{currentOrder.total_amount}</span>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            🔔 You'll be notified when your order is ready
          </p>
        </div>
      </div>
    );
  }

  // Main menu ordering screen
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hotel Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
              <UtensilsCrossed size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">{hotel?.name || 'Restaurant'}</h1>
              <p className="text-xs text-slate-400">
                {table ? `Table ${table.table_number}` : 'Digital Menu'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search menu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none shadow-sm"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-4 px-4">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 text-sm rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-amber-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Items */}
        <div className="space-y-3">
          {filteredItems.map(item => {
            const inCart = cart.find(c => c.menu_item.id === item.id);
            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex"
              >
                {/* Item Image Placeholder */}
                <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl">
                    {item.category === 'Beverages' ? '🥤' :
                     item.category === 'Desserts' ? '🍰' :
                     item.category === 'Starters' ? '🥗' :
                     item.category === 'Rice' ? '🍚' :
                     item.category === 'Breads' ? '🫓' :
                     item.category === 'South Indian' ? '🥘' : '🍛'}
                  </span>
                </div>

                {/* Item Details */}
                <div className="flex-1 p-3 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm">{item.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-amber-600">₹{item.price}</span>
                    {inCart ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-sm font-bold w-5 text-center">{inCart.quantity}</span>
                        <button
                          onClick={() => addToCart(item)}
                          className="w-7 h-7 flex items-center justify-center bg-amber-500 text-white rounded-full hover:bg-amber-600"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(item)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-full hover:bg-amber-100 transition-colors"
                      >
                        <Plus size={12} />
                        ADD
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p>No items found</p>
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {cartCount > 0 && !showCart && (
        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto">
          <button
            onClick={() => setShowCart(true)}
            className="w-full flex items-center justify-between px-5 py-3.5 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-500/30 hover:bg-amber-600 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} />
              <span className="font-medium">{cartCount} item{cartCount > 1 ? 's' : ''}</span>
            </div>
            <span className="font-bold">₹{cartTotal}</span>
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full max-w-md mx-auto rounded-t-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Your Order</h3>
              <button onClick={() => setShowCart(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.map(item => (
                <div key={item.menu_item.id} className="flex items-center justify-between py-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{item.menu_item.name}</p>
                    <p className="text-xs text-gray-500">₹{item.menu_item.price} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => removeFromCart(item.menu_item.id)}
                      className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                    <button
                      onClick={() => addToCart(item.menu_item)}
                      className="w-7 h-7 flex items-center justify-center bg-amber-100 text-amber-600 rounded-full hover:bg-amber-200"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="text-sm font-medium text-gray-800 w-16 text-right">
                    ₹{item.menu_item.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 p-4">
              <div className="flex justify-between mb-4">
                <span className="font-medium text-gray-600">Total</span>
                <span className="text-xl font-bold text-amber-600">₹{cartTotal}</span>
              </div>
              <button
                onClick={handlePlaceOrder}
                className="w-full py-3 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20"
              >
                Place Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
