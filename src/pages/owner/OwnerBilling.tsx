// ============================================================
// Owner - Bill Generation & Payment Processing
// ============================================================

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Order, PaymentMethod } from '../../types';
import { 
  Receipt, CreditCard, Banknote, Printer, Download,
  CheckCircle, Clock, X, Search, Filter, FileText,
  IndianRupee, Calendar, User
} from 'lucide-react';

export function OwnerBilling() {
  const { user } = useAuth();
  const { getHotelOrders, updatePaymentStatus } = useData();
  const hotelId = user?.hotel_id || '';
  const orders = getHotelOrders(hotelId);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'unpaid' | 'paid'>('unpaid');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'unpaid' && order.payment_status === 'UNPAID') ||
      (filterStatus === 'paid' && order.payment_status === 'PAID');
    
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.table_number.toString().includes(searchTerm);
    
    return matchesStatus && matchesSearch;
  });

  // Statistics
  const unpaidOrders = orders.filter(o => o.payment_status === 'UNPAID');
  const paidOrders = orders.filter(o => o.payment_status === 'PAID');
  const totalUnpaid = unpaidOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const totalPaid = paidOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const todayPaid = paidOrders.filter(o => {
    const today = new Date().toDateString();
    return new Date(o.updated_at).toDateString() === today;
  }).reduce((sum, o) => sum + o.total_amount, 0);

  const handleProcessPayment = (orderId: string, method: PaymentMethod) => {
    updatePaymentStatus(orderId, 'PAID', method);
    setSelectedOrder(null);
    setShowBillPreview(false);
  };

  const handlePrintBill = () => {
    window.print();
  };

  const generateBillNumber = (orderId: string) => {
    return `BILL-${orderId.slice(-6).toUpperCase()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Billing & Payments</h1>
          <p className="text-sm text-gray-500">Generate bills and process payments</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">₹{totalUnpaid.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Pending Collection</p>
          <p className="text-xs text-red-600 mt-1">{unpaidOrders.length} orders</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">₹{totalPaid.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Total Collected</p>
          <p className="text-xs text-green-600 mt-1">{paidOrders.length} orders</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <IndianRupee size={20} className="text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">₹{todayPaid.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Today's Collection</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Receipt size={20} className="text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{orders.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total Bills</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order ID or table number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                filterStatus === 'all'
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All ({orders.length})
            </button>
            <button
              onClick={() => setFilterStatus('unpaid')}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                filterStatus === 'unpaid'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Unpaid ({unpaidOrders.length})
            </button>
            <button
              onClick={() => setFilterStatus('paid')}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                filterStatus === 'paid'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Paid ({paidOrders.length})
            </button>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Bill No
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Table
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Items
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm font-medium text-gray-800">
                      {generateBillNumber(order.id)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-gray-800">
                      Table {order.table_number}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">
                      {order.items.length} items
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-gray-800">
                      ₹{order.total_amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                      order.payment_status === 'PAID'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        order.payment_status === 'PAID' ? 'bg-green-500' : 'bg-red-500'
                      }`}></span>
                      {order.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowBillPreview(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Bill"
                      >
                        <FileText size={16} />
                      </button>
                      {order.payment_status === 'UNPAID' && order.status === 'SERVED' && (
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-3 py-1 text-xs font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                        >
                          Collect Payment
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Receipt size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No orders found</p>
          </div>
        )}
      </div>

      {/* Payment Collection Modal */}
      {selectedOrder && !showBillPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Collect Payment</h3>
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Bill Number</span>
                  <span className="font-mono text-sm font-medium">
                    {generateBillNumber(selectedOrder.id)}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Table</span>
                  <span className="text-sm font-medium">Table {selectedOrder.table_number}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Items</span>
                  <span className="text-sm font-medium">{selectedOrder.items.length} items</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-base font-semibold text-gray-800">Total Amount</span>
                  <span className="text-xl font-bold text-amber-600">
                    ₹{selectedOrder.total_amount.toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleProcessPayment(selectedOrder.id, 'CASH')}
                    className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
                  >
                    <Banknote size={24} className="text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Cash</span>
                  </button>
                  <button
                    onClick={() => handleProcessPayment(selectedOrder.id, 'UPI')}
                    className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
                  >
                    <CreditCard size={24} className="text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">UPI</span>
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedOrder(selectedOrder);
                  setShowBillPreview(true);
                }}
                className="w-full py-2 text-sm text-amber-600 hover:text-amber-700 font-medium"
              >
                View Bill Details →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill Preview Modal */}
      {showBillPreview && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Bill Preview</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintBill}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Printer size={16} />
                  Print
                </button>
                <button 
                  onClick={() => {
                    setShowBillPreview(false);
                    setSelectedOrder(null);
                  }} 
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6" id="bill-content">
              {/* Bill Header */}
              <div className="text-center mb-6 pb-6 border-b-2 border-gray-800">
                <h2 className="text-2xl font-bold text-gray-800">Taj Palace Restaurant</h2>
                <p className="text-sm text-gray-600 mt-1">123 MG Road, Bangalore</p>
                <p className="text-sm text-gray-600">Phone: +91 98765 43210</p>
                <p className="text-sm text-gray-600">GSTIN: 29AABCT1234R1Z5</p>
              </div>

              {/* Bill Info */}
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Bill No:</p>
                    <p className="font-mono font-semibold">{generateBillNumber(selectedOrder.id)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600">Date:</p>
                    <p className="font-semibold">
                      {new Date(selectedOrder.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Table:</p>
                    <p className="font-semibold">Table {selectedOrder.table_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600">Time:</p>
                    <p className="font-semibold">
                      {new Date(selectedOrder.created_at).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-6">
                <table className="w-full text-sm">
                  <thead className="border-b-2 border-gray-300">
                    <tr>
                      <th className="text-left py-2 font-semibold">Item</th>
                      <th className="text-center py-2 font-semibold">Qty</th>
                      <th className="text-right py-2 font-semibold">Rate</th>
                      <th className="text-right py-2 font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2">{item.name}</td>
                        <td className="text-center py-2">{item.quantity}</td>
                        <td className="text-right py-2">₹{item.price}</td>
                        <td className="text-right py-2 font-medium">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="border-t-2 border-gray-300 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">₹{selectedOrder.total_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">GST (5%):</span>
                    <span className="font-medium">₹{Math.round(selectedOrder.total_amount * 0.05).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                    <span>Total:</span>
                    <span className="text-amber-600">
                      ₹{Math.round(selectedOrder.total_amount * 1.05).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Status */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Payment Status:</span>
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                    selectedOrder.payment_status === 'PAID'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {selectedOrder.payment_status}
                  </span>
                </div>
                {selectedOrder.payment_method && (
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-600">Payment Method:</span>
                    <span className="text-sm font-medium">{selectedOrder.payment_method}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-600">Thank you for dining with us!</p>
                <p className="text-xs text-gray-500 mt-1">Visit again</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
