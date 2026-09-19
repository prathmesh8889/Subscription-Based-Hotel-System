// ============================================================
// CUSTOMER QR MENU - Scan QR, View Menu, Place Order
// ============================================================

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { ShoppingCart, Plus, Minus, CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
}

interface CartItem extends MenuItem {
  quantity: number;
}

export function CustomerQRMenu() {
  const { hotelId } = useParams<{ hotelId: string }>();
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get('table');
  const tableNumber = searchParams.get('tableNumber');
  
  const { placeOrder, isConnected } = useSocket();
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================
  // VALIDATE TABLE & FETCH MENU
  // ============================================================

  useEffect(() => {
    const validateAndFetch = async () => {
      if (!hotelId || !tableId) {
        setError('Invalid QR code. Please scan the QR code from your table.');
        setLoading(false);
        return;
      }

      try {
        // Fetch menu items for this hotel
        const response = await fetch(`http://localhost:5000/api/menu?hotelId=${hotelId}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch menu');
        }

        const data = await response.json();
        
        if (data.success) {
          setMenuItems(data.data.menuItems.filter((item: MenuItem) => item.isAvailable));
        } else {
          setError('Failed to load menu');
        }
      } catch (err) {
        setError('Failed to load menu. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    validateAndFetch();
  }, [hotelId, tableId]);

  // ============================================================
  // CART OPERATIONS
  // ============================================================

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.id !== itemId);
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // ============================================================
  // PLACE ORDER
  // ============================================================

  const handlePlaceOrder = async () => {
    if (cart.length === 0 || !tableId || !tableNumber) {
      return;
    }

    setPlacingOrder(true);
    setError(null);

    const orderData = {
      tableId,
      tableNumber: parseInt(tableNumber),
      items: cart.map(item => ({
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      totalAmount: cartTotal,
    };

    const result = await placeOrder(orderData);

    if (result.success) {
      setOrderPlaced(true);
      setCart([]);
    } else {
      setError(result.error || 'Failed to place order');
    }

    setPlacingOrder(false);
  };

  // ============================================================
  // RENDER
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size={48} className="animate-spin text-amber-500" />
      </div>
    );
  }

  if (error && !menuItems.length) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Placed!</h2>
          <p className="text-gray-600 mb-6">
            Your order has been sent to the kitchen. We'll bring it to your table soon.
          </p>
          <button
            onClick={() => setOrderPlaced(false)}
            className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            Order More
          </button>
        </div>
      </div>
    );
  }

  // Group menu items by category
  const categories = Array.from(new Set(menuItems.map(item => item.category)));

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Welcome to Table {tableNumber}</h1>
          <p className="text-amber-100">Browse our menu and place your order</p>
          <div className="flex items-center gap-2 mt-3">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm">{isConnected ? 'Connected' : 'Connecting...'}</span>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="max-w-4xl mx-auto p-4">
        {categories.map(category => (
          <div key={category} className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {menuItems
                .filter(item => item.category === category)
                .map(item => {
                  const cartItem = cart.find(i => i.id === item.id);
                  const quantity = cartItem?.quantity || 0;

                  return (
                    <div key={item.id} className="bg-white rounded-lg shadow-md p-4 flex gap-4">
                      {/* Image */}
                      <div className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <ShoppingCart size={32} />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-1">{item.name}</h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-amber-600">₹{item.price}</span>
                          
                          {quantity === 0 ? (
                            <button
                              onClick={() => addToCart(item)}
                              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2"
                            >
                              <Plus size={16} />
                              Add
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                              >
                                <Minus size={16} />
                              </button>
                              <span className="font-semibold text-gray-800 w-8 text-center">{quantity}</span>
                              <button
                                onClick={() => addToCart(item)}
                                className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center hover:bg-amber-600 transition-colors"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      {/* Cart Summary - Fixed Bottom */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-600">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                </p>
                <p className="text-2xl font-bold text-gray-800">₹{cartTotal}</p>
              </div>
              <button
                onClick={handlePlaceOrder}
                disabled={placingOrder}
                className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {placingOrder ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Place Order
                  </>
                )}
              </button>
            </div>

            {/* Cart Items Preview */}
            <div className="border-t border-gray-200 pt-3 max-h-32 overflow-y-auto">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between text-sm py-1">
                  <span className="text-gray-700">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="text-gray-600">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}
