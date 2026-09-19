// ============================================================
// WAITER BILLING PAGE
// ============================================================
// Process payments and generate invoices
// ============================================================

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Receipt, CreditCard, Banknote, Printer, Loader, CheckCircle } from 'lucide-react';

interface Order {
  id: string;
  tableNumber: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  createdAt: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

interface Invoice {
  billNumber: string;
  order: {
    id: string;
    tableNumber: number;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
    subtotal: number;
    cgst: number;
    sgst: number;
    totalGST: number;
    grandTotal: number;
    status: string;
    paymentStatus: string;
    paymentMethod?: string;
    createdAt: string;
  };
  hotel: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  waiter: string;
  generatedAt: string;
}

export function WaiterBilling() {
  const { user } = useAuth();
  const { updatePaymentStatus } = useSocket();
  
  const [unpaidOrders, setUnpaidOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // ============================================================
  // FETCH UNPAID ORDERS (Mock)
  // ============================================================

  useEffect(() => {
    fetchUnpaidOrders();
  }, [user?.hotelId]);

  const fetchUnpaidOrders = async () => {
    if (!user?.hotelId) return;

    setLoading(true);
    
    // Mock unpaid orders
    const mockOrders: Order[] = [
      {
        id: 'order-1',
        tableNumber: 1,
        totalAmount: 850,
        status: 'SERVED',
        paymentStatus: 'UNPAID',
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        items: [
          { name: 'Butter Chicken', quantity: 2, price: 320 },
          { name: 'Garlic Naan', quantity: 3, price: 70 },
        ],
      },
      {
        id: 'order-2',
        tableNumber: 3,
        totalAmount: 1200,
        status: 'SERVED',
        paymentStatus: 'UNPAID',
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        items: [
          { name: 'Paneer Tikka', quantity: 2, price: 280 },
          { name: 'Biryani', quantity: 1, price: 350 },
          { name: 'Raita', quantity: 2, price: 145 },
        ],
      },
      {
        id: 'order-3',
        tableNumber: 5,
        totalAmount: 650,
        status: 'SERVED',
        paymentStatus: 'UNPAID',
        createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        items: [
          { name: 'Masala Dosa', quantity: 2, price: 180 },
          { name: 'Coffee', quantity: 3, price: 97 },
        ],
      },
    ];

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    setUnpaidOrders(mockOrders);
    setLoading(false);
  };

  // ============================================================
  // PROCESS PAYMENT
  // ============================================================

  const handleProcessPayment = async (orderId: string, paymentMethod: 'CASH' | 'UPI' | 'CARD') => {
    setProcessingOrder(orderId);

    try {
      // Update via Socket.io
      const socketResult = await updatePaymentStatus(orderId, paymentMethod);

      if (socketResult.success) {
        // Also update via REST API for consistency
        await fetch(`http://localhost:5000/api/billing/pay/${orderId}`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ paymentMethod }),
        });

        // Refresh unpaid orders
        await fetchUnpaidOrders();
      } else {
        alert(socketResult.error || 'Failed to process payment');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      alert('Failed to process payment');
    } finally {
      setProcessingOrder(null);
    }
  };

  // ============================================================
  // GENERATE INVOICE (Mock)
  // ============================================================

  const handleGenerateInvoice = async (orderId: string) => {
    const order = unpaidOrders.find(o => o.id === orderId);
    if (!order) {
      alert('Order not found');
      return;
    }

    // Calculate GST (5% = 2.5% CGST + 2.5% SGST)
    const subtotal = order.totalAmount;
    const cgst = subtotal * 0.025;
    const sgst = subtotal * 0.025;
    const totalGST = cgst + sgst;
    const grandTotal = subtotal + totalGST;

    // Generate bill number
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const billNumber = `BILL-${dateStr}-${random}`;

    const invoice: Invoice = {
      billNumber,
      order: {
        id: order.id,
        tableNumber: order.tableNumber,
        items: order.items,
        subtotal,
        cgst: Math.round(cgst * 100) / 100,
        sgst: Math.round(sgst * 100) / 100,
        totalGST: Math.round(totalGST * 100) / 100,
        grandTotal: Math.round(grandTotal * 100) / 100,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
      },
      hotel: {
        name: 'Taj Palace Restaurant',
        address: '123 MG Road, Bangalore',
        phone: '+91 98765 43210',
        email: 'info@tajpalace.com',
      },
      waiter: user?.name || 'N/A',
      generatedAt: new Date().toISOString(),
    };

    setSelectedInvoice(invoice);
    setShowInvoiceModal(true);
  };

  // ============================================================
  // PRINT INVOICE
  // ============================================================

  const handlePrintInvoice = () => {
    window.print();
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Billing & Payments</h1>
        <p className="text-sm text-gray-500">Process payments and generate invoices</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Receipt size={20} className="text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{unpaidOrders.length}</p>
          <p className="text-xs text-gray-500 mt-1">Pending Payments</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <span className="text-amber-600 font-bold">₹</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">
            ₹{unpaidOrders.reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">Pending Amount</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">5%</p>
          <p className="text-xs text-gray-500 mt-1">GST Rate</p>
        </div>
      </div>

      {/* Unpaid Orders */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Unpaid Orders</h3>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <Loader size={32} className="animate-spin text-amber-500 mx-auto mb-3" />
            <p className="text-gray-500">Loading unpaid orders...</p>
          </div>
        ) : unpaidOrders.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle size={48} className="mx-auto text-green-500 mb-3" />
            <p className="text-gray-600 font-medium">All orders are paid!</p>
            <p className="text-sm text-gray-500 mt-1">No pending payments</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {unpaidOrders.map(order => (
              <div key={order.id} className="p-5 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-800">
                        Table {order.tableNumber}
                      </span>
                      <span className="text-xs text-gray-500">
                        #{order.id.slice(-6)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-amber-600">
                      ₹{order.totalAmount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.items.length} items
                    </p>
                  </div>
                </div>

                {/* Items Preview */}
                <div className="mb-3 text-sm text-gray-600">
                  {order.items.slice(0, 3).map((item, idx) => (
                    <span key={idx}>
                      {item.quantity}x {item.name}
                      {idx < Math.min(order.items.length - 1, 2) && ', '}
                    </span>
                  ))}
                  {order.items.length > 3 && ` +${order.items.length - 3} more`}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleProcessPayment(order.id, 'CASH')}
                    disabled={processingOrder === order.id}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {processingOrder === order.id ? (
                      <Loader size={16} className="animate-spin" />
                    ) : (
                      <Banknote size={16} />
                    )}
                    Cash
                  </button>
                  <button
                    onClick={() => handleProcessPayment(order.id, 'UPI')}
                    disabled={processingOrder === order.id}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {processingOrder === order.id ? (
                      <Loader size={16} className="animate-spin" />
                    ) : (
                      <CreditCard size={16} />
                    )}
                    UPI
                  </button>
                  <button
                    onClick={() => handleGenerateInvoice(order.id)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Receipt size={16} />
                    Invoice
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      {showInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Invoice</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintInvoice}
                  className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                >
                  <Printer size={16} />
                  Print
                </button>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Invoice Content */}
            <div className="p-6" id="invoice-content">
              {/* Hotel Info */}
              <div className="text-center mb-6 pb-6 border-b-2 border-gray-800">
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedInvoice.hotel.name}
                </h2>
                {selectedInvoice.hotel.address && (
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedInvoice.hotel.address}
                  </p>
                )}
                {selectedInvoice.hotel.phone && (
                  <p className="text-sm text-gray-600">
                    Phone: {selectedInvoice.hotel.phone}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  GSTIN: 29AABCT1234R1Z5
                </p>
              </div>

              {/* Bill Info */}
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Bill No:</p>
                    <p className="font-mono font-semibold">
                      {selectedInvoice.billNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600">Date:</p>
                    <p className="font-semibold">
                      {new Date(selectedInvoice.order.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Table:</p>
                    <p className="font-semibold">
                      Table {selectedInvoice.order.tableNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600">Waiter:</p>
                    <p className="font-semibold">{selectedInvoice.waiter}</p>
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
                    {selectedInvoice.order.items.map((item, idx) => (
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
                    <span className="font-medium">
                      ₹{selectedInvoice.order.subtotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">CGST (2.5%):</span>
                    <span className="font-medium">
                      ₹{selectedInvoice.order.cgst.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">SGST (2.5%):</span>
                    <span className="font-medium">
                      ₹{selectedInvoice.order.sgst.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                    <span>Grand Total:</span>
                    <span className="text-amber-600">
                      ₹{selectedInvoice.order.grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Status */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Payment Status:</span>
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                    selectedInvoice.order.paymentStatus === 'PAID'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {selectedInvoice.order.paymentStatus}
                  </span>
                </div>
                {selectedInvoice.order.paymentMethod && (
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-600">Payment Method:</span>
                    <span className="text-sm font-medium">
                      {selectedInvoice.order.paymentMethod}
                    </span>
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
