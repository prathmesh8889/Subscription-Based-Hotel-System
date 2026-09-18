// ============================================================
// Owner - Tables & QR Code Management
// ============================================================

import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { QRCodeSVG } from 'qrcode.react';
import { generateQRToken, generateQRUrl } from '../../services/qrTokenService';
import { Plus, QrCode, Download, X, Printer, Table2 } from 'lucide-react';

export function OwnerTablesPage() {
  const { getCurrentHotel, getHotelTables, addTable, updateTableStatus } = useData();
  const hotel = getCurrentHotel();
  const tables = hotel ? getHotelTables(hotel.id) : [];

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('4');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [addError, setAddError] = useState('');

  const handleAddTable = () => {
    if (!hotel || !newTableNumber) return;
    
    const token = `qr_${hotel.id.slice(-2)}_t${newTableNumber}_${Math.random().toString(36).slice(2, 8)}`;
    const result = addTable(hotel.id, {
      hotel_id: hotel.id,
      table_number: parseInt(newTableNumber),
      qr_token: token,
      status: 'AVAILABLE',
      capacity: parseInt(newTableCapacity),
    });

    if (result.success) {
      setShowAddForm(false);
      setNewTableNumber('');
      setNewTableCapacity('4');
      setAddError('');
    } else {
      setAddError(result.error || 'Failed to add table');
    }
  };

  // Generate QR URL with secure session token using the QR token service
  const getQRUrl = (tableId: string, qrToken: string) => {
    if (!hotel) return '';
    // Use the secure JWT-based token service
    const token = generateQRToken(hotel.id, tableId);
    return generateQRUrl(hotel.id, tableId, token);
  };

  const selectedTableData = tables.find(t => t.id === selectedTable);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tables & QR Codes</h1>
          <p className="text-sm text-gray-500">
            {tables.length}/{hotel?.max_tables} tables • Generate QR codes for customer ordering
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Add Table
        </button>
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          🔒 <strong>QR Security:</strong> Each QR code contains a unique, time-bound session token. 
          This prevents unauthorized orders from outside the restaurant premises.
        </p>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables.map((table) => (
          <div
            key={table.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    table.status === 'AVAILABLE' ? 'bg-green-100' :
                    table.status === 'OCCUPIED' ? 'bg-red-100' :
                    'bg-amber-100'
                  }`}>
                    <Table2 size={20} className={
                      table.status === 'AVAILABLE' ? 'text-green-600' :
                      table.status === 'OCCUPIED' ? 'text-red-600' :
                      'text-amber-600'
                    } />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Table {table.table_number}</p>
                    <p className="text-xs text-gray-500">{table.capacity} seats</p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  table.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                  table.status === 'OCCUPIED' ? 'bg-red-100 text-red-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {table.status}
                </span>
              </div>

              {/* Mini QR Preview */}
              <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg mb-3">
                <QRCodeSVG
                  value={getQRUrl(table.id, table.qr_token)}
                  size={80}
                  level="M"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedTable(table.id)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors"
                >
                  <QrCode size={14} />
                  View QR
                </button>
                <select
                  value={table.status}
                  onChange={(e) => updateTableStatus(table.id, e.target.value as any)}
                  className="flex-1 px-2 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="OCCUPIED">Occupied</option>
                  <option value="RESERVED">Reserved</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {tables.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Table2 size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No tables yet. Add your first table to get started.</p>
        </div>
      )}

      {/* Add Table Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add New Table</h3>
              <button onClick={() => { setShowAddForm(false); setAddError(''); }} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>

            {addError && (
              <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {addError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Table Number</label>
                <input
                  type="number"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="e.g., 6"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (seats)</label>
                <input
                  type="number"
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="4"
                />
              </div>
              <button
                onClick={handleAddTable}
                className="w-full py-2.5 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors"
              >
                Add Table & Generate QR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Detail Modal */}
      {selectedTableData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl text-center">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Table {selectedTableData.table_number} QR Code</h3>
              <button onClick={() => setSelectedTable(null)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 mb-4">
              <QRCodeSVG
                value={getQRUrl(selectedTableData.id, selectedTableData.qr_token)}
                size={200}
                level="H"
              />
            </div>

            <p className="text-xs text-gray-500 mb-4 break-all">
              {getQRUrl(selectedTableData.id, selectedTableData.qr_token)}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors"
              >
                <Printer size={16} />
                Print QR
              </button>
              <button
                onClick={() => setSelectedTable(null)}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
