// ============================================================
// Enhanced QR Management Page - Step 3 Implementation
// Demonstrates secure QR token generation, validation, and
// the complete security architecture.
// ============================================================

import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { QRCodeSVG } from 'qrcode.react';
import {
  generateQRToken,
  validateQRToken,
  generateQRUrl,
  decodeTokenInfo,
  generateBulkQRTokens,
  QRTokenPayload,
} from '../../services/qrTokenService';
import {
  QrCode, Shield, Clock, AlertTriangle, CheckCircle2,
  Download, Printer, Eye, EyeOff, RefreshCw, Lock,
  Copy, ExternalLink, Info
} from 'lucide-react';

export function QRManagementPage() {
  const { getCurrentHotel, getHotelTables, addTable } = useData();
  const hotel = getCurrentHotel();
  const tables = hotel ? getHotelTables(hotel.id) : [];

  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [generatedToken, setGeneratedToken] = useState<string>('');
  const [showTokenDetails, setShowTokenDetails] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    error?: string;
    payload?: QRTokenPayload;
  } | null>(null);
  const [bulkTokens, setBulkTokens] = useState<Array<{
    tableId: string;
    tableNumber: number;
    token: string;
    url: string;
  }>>([]);
  const [activeTab, setActiveTab] = useState<'generate' | 'validate' | 'bulk' | 'security'>('generate');

  // Generate token for selected table
  const handleGenerateToken = () => {
    if (!hotel || !selectedTableId) return;
    const token = generateQRToken(hotel.id, selectedTableId);
    setGeneratedToken(token);
    setValidationResult(null);
  };

  // Validate the generated token
  const handleValidateToken = () => {
    if (!hotel || !selectedTableId || !generatedToken) return;
    const result = validateQRToken(generatedToken, hotel.id, selectedTableId);
    setValidationResult(result);
  };

  // Generate bulk tokens
  const handleGenerateBulk = () => {
    if (!hotel) return;
    const tokens = generateBulkQRTokens(hotel.id, tables);
    setBulkTokens(tokens.map(t => ({
      tableId: t.table.id,
      tableNumber: t.table.table_number,
      token: t.token,
      url: t.url,
    })));
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const selectedTable = tables.find(t => t.id === selectedTableId);
  const tokenInfo = generatedToken ? decodeTokenInfo(generatedToken) : null;
  const qrUrl = generatedToken && hotel && selectedTableId
    ? generateQRUrl(hotel.id, selectedTableId, generatedToken)
    : '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">QR Code Management</h1>
        <p className="text-sm text-gray-500">
          Generate secure, time-bound QR codes for customer ordering
        </p>
      </div>

      {/* Security Architecture Banner */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-5 text-white">
        <div className="flex items-start gap-3">
          <Shield size={24} className="text-amber-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-400 mb-1">Secure QR Architecture</h3>
            <p className="text-sm text-slate-300">
              Each QR code contains a JWT-signed, time-bound token with HMAC signature verification.
              Tokens expire after 4 hours and are validated against hotel_id and table_id to prevent
              unauthorized access from outside the premises.
            </p>
            <div className="flex flex-wrap gap-3 mt-3">
              <span className="flex items-center gap-1 text-xs bg-slate-700 px-2 py-1 rounded">
                <Lock size={12} /> JWT Signed
              </span>
              <span className="flex items-center gap-1 text-xs bg-slate-700 px-2 py-1 rounded">
                <Clock size={12} /> 4hr Expiry
              </span>
              <span className="flex items-center gap-1 text-xs bg-slate-700 px-2 py-1 rounded">
                <Shield size={12} /> HMAC Verified
              </span>
              <span className="flex items-center gap-1 text-xs bg-slate-700 px-2 py-1 rounded">
                <CheckCircle2 size={12} /> Hotel Isolated
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'generate', label: 'Generate', icon: QrCode },
          { id: 'validate', label: 'Validate', icon: Shield },
          { id: 'bulk', label: 'Bulk Generate', icon: Download },
          { id: 'security', label: 'Security Flow', icon: Info },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.id ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon size={16} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ============================================================ */}
      {/* TAB: Generate QR Code */}
      {/* ============================================================ */}
      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Controls */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Step 1: Select Table</h3>
              <select
                value={selectedTableId || ''}
                onChange={(e) => {
                  setSelectedTableId(e.target.value);
                  setGeneratedToken('');
                  setValidationResult(null);
                }}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              >
                <option value="">Choose a table...</option>
                {tables.map(t => (
                  <option key={t.id} value={t.id}>
                    Table {t.table_number} ({t.capacity} seats) - {t.status}
                  </option>
                ))}
              </select>

              {tables.length === 0 && (
                <p className="text-sm text-amber-600 mt-2">
                  No tables found. Add tables from the Tables & QR page first.
                </p>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Step 2: Generate Secure Token</h3>
              <button
                onClick={handleGenerateToken}
                disabled={!selectedTableId}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={16} />
                Generate JWT Token
              </button>

              {generatedToken && (
                <div className="mt-4">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Generated Token:</label>
                  <div className="relative">
                    <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs overflow-x-auto font-mono">
                      {generatedToken.substring(0, 60)}...
                    </pre>
                    <button
                      onClick={() => copyToClipboard(generatedToken)}
                      className="absolute top-2 right-2 p-1 bg-gray-700 rounded text-gray-300 hover:text-white"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                  <button
                    onClick={() => setShowTokenDetails(!showTokenDetails)}
                    className="flex items-center gap-1 mt-2 text-xs text-amber-600 hover:text-amber-700"
                  >
                    {showTokenDetails ? <EyeOff size={12} /> : <Eye size={12} />}
                    {showTokenDetails ? 'Hide' : 'Show'} Token Details
                  </button>

                  {showTokenDetails && tokenInfo && (
                    <div className="mt-2 bg-gray-50 rounded-lg p-3 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Hotel ID:</span>
                        <span className="font-mono text-gray-700">{tokenInfo.hotel_id}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Table ID:</span>
                        <span className="font-mono text-gray-700">{tokenInfo.table_id}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Session ID:</span>
                        <span className="font-mono text-gray-700">{tokenInfo.session_id}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Issued At:</span>
                        <span className="font-mono text-gray-700">{new Date(tokenInfo.iat * 1000).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Expires At:</span>
                        <span className="font-mono text-red-600">{new Date(tokenInfo.exp * 1000).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Signature:</span>
                        <span className="font-mono text-gray-700 truncate max-w-[200px]">{tokenInfo.signature}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: QR Code Preview */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Step 3: QR Code Preview</h3>
              
              {qrUrl ? (
                <div className="text-center">
                  <div className="inline-block bg-white p-4 rounded-xl border-2 border-dashed border-gray-200">
                    <QRCodeSVG
                      value={qrUrl}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  
                  <div className="mt-4 text-left">
                    <label className="block text-xs font-medium text-gray-500 mb-1">QR URL:</label>
                    <div className="relative">
                      <pre className="bg-gray-50 border border-gray-200 p-2 rounded-lg text-xs overflow-x-auto break-all">
                        {qrUrl}
                      </pre>
                      <button
                        onClick={() => copyToClipboard(qrUrl)}
                        className="absolute top-2 right-2 p-1 bg-gray-200 rounded text-gray-600 hover:bg-gray-300"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => window.print()}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-900"
                    >
                      <Printer size={14} />
                      Print QR
                    </button>
                    <button
                      onClick={handleGenerateToken}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
                    >
                      <RefreshCw size={14} />
                      Regenerate
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <QrCode size={48} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Select a table and generate a token to preview QR code</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB: Validate Token */}
      {/* ============================================================ */}
      {activeTab === 'validate' && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-2">Token Validation Demo</h3>
            <p className="text-sm text-gray-500 mb-4">
              This simulates the backend validation that occurs when a customer scans a QR code.
              The backend checks: signature integrity, expiry time, hotel_id match, and table_id match.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Table (expected)</label>
                <select
                  value={selectedTableId || ''}
                  onChange={(e) => { setSelectedTableId(e.target.value); setValidationResult(null); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="">Choose a table...</option>
                  {tables.map(t => (
                    <option key={t.id} value={t.id}>Table {t.table_number}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Token to Validate</label>
                <textarea
                  value={generatedToken}
                  onChange={(e) => { setGeneratedToken(e.target.value); setValidationResult(null); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                  rows={3}
                  placeholder="Paste a JWT token here..."
                />
              </div>

              <button
                onClick={handleValidateToken}
                disabled={!generatedToken || !selectedTableId || !hotel}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                <Shield size={16} />
                Validate Token
              </button>
            </div>
          </div>

          {/* Validation Result */}
          {validationResult && (
            <div className={`rounded-xl border p-5 ${
              validationResult.valid
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                {validationResult.valid ? (
                  <CheckCircle2 size={24} className="text-green-500" />
                ) : (
                  <AlertTriangle size={24} className="text-red-500" />
                )}
                <div>
                  <h4 className={`font-semibold ${validationResult.valid ? 'text-green-800' : 'text-red-800'}`}>
                    {validationResult.valid ? '✓ Token Valid' : '✗ Token Invalid'}
                  </h4>
                  {!validationResult.valid && validationResult.error && (
                    <p className="text-sm text-red-600">{validationResult.error}</p>
                  )}
                </div>
              </div>

              {validationResult.valid && validationResult.payload && (
                <div className="bg-white rounded-lg p-3 space-y-1 border border-green-100">
                  <p className="text-xs font-medium text-gray-500 mb-2">Decoded Payload:</p>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Hotel:</span>
                    <span className="font-mono">{validationResult.payload.hotel_id}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Table:</span>
                    <span className="font-mono">{validationResult.payload.table_id}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Session:</span>
                    <span className="font-mono">{validationResult.payload.session_id}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Expires:</span>
                    <span className="font-mono">{new Date(validationResult.payload.exp * 1000).toLocaleTimeString()}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Validation Steps Explanation */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h4 className="font-semibold text-gray-800 mb-3">Validation Steps (Backend)</h4>
            <div className="space-y-3">
              {[
                { step: 1, label: 'Decode JWT', desc: 'Split token into header.payload.signature and base64 decode' },
                { step: 2, label: 'Verify Signature', desc: 'Recompute HMAC-SHA256 and compare with token signature' },
                { step: 3, label: 'Check Expiry', desc: 'Verify current time < token.exp (4 hour window)' },
                { step: 4, label: 'Verify Hotel', desc: 'Ensure token.hotel_id matches URL hotel_id parameter' },
                { step: 5, label: 'Verify Table', desc: 'Ensure token.table_id matches URL table parameter' },
                { step: 6, label: 'Serve Menu', desc: 'If all checks pass, serve the hotel-specific menu' },
              ].map(item => (
                <div key={item.step} className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {item.step}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB: Bulk Generate */}
      {/* ============================================================ */}
      {activeTab === 'bulk' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-800">Bulk QR Generation</h3>
                <p className="text-sm text-gray-500">Generate QR codes for all {tables.length} tables at once</p>
              </div>
              <button
                onClick={handleGenerateBulk}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-medium"
              >
                <Download size={16} />
                Generate All
              </button>
            </div>

            {bulkTokens.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {bulkTokens.map(bt => (
                  <div key={bt.tableId} className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
                    <QRCodeSVG value={bt.url} size={100} level="M" />
                    <p className="mt-2 text-sm font-medium text-gray-800">Table {bt.tableNumber}</p>
                    <button
                      onClick={() => copyToClipboard(bt.url)}
                      className="mt-1 text-xs text-amber-600 hover:text-amber-700"
                    >
                      Copy URL
                    </button>
                  </div>
                ))}
              </div>
            )}

            {bulkTokens.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <QrCode size={48} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">Click "Generate All" to create QR codes for all tables</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB: Security Flow */}
      {/* ============================================================ */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Complete Security Architecture</h3>
            
            {/* Flow Diagram */}
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">🔐 Token Generation Flow (Owner Panel)</h4>
                <div className="flex flex-col gap-2">
                  {[
                    'Owner clicks "Generate QR" for a table',
                    'Backend creates JWT payload: { hotel_id, table_id, session_id, exp }',
                    'Backend signs with HMAC-SHA256 using QR_SECRET_KEY',
                    'QR code URL generated: /customer/{hotelId}?table={tableId}&token={jwt}',
                    'QR code image rendered for printing/placement',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">{i + 1}</span>
                      <p className="text-xs text-slate-600">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-700 mb-3">📱 Token Validation Flow (Customer Scan)</h4>
                <div className="flex flex-col gap-2">
                  {[
                    'Customer scans QR code with phone camera',
                    'Browser opens: /customer/{hotelId}?table={tableId}&token={jwt}',
                    'Frontend sends token to backend for validation',
                    'Backend verifies JWT signature (prevents tampering)',
                    'Backend checks expiry (prevents replay attacks)',
                    'Backend verifies hotel_id matches URL (prevents cross-hotel access)',
                    'Backend verifies table_id matches URL (prevents table spoofing)',
                    'If valid → serve hotel-specific menu with table pre-selected',
                    'If invalid → show error page with instructions',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">{i + 1}</span>
                      <p className="text-xs text-blue-700">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-red-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-red-700 mb-3">🛡️ Attack Prevention</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { attack: 'Fake Orders from Outside', prevention: 'Token contains hotel-specific signature; IP validation optional' },
                    { attack: 'URL Manipulation', prevention: 'Changing table_id in URL fails validation (token.table_id ≠ url.table_id)' },
                    { attack: 'Replay Attacks', prevention: 'Token expires after 4 hours; session_id is unique per generation' },
                    { attack: 'Token Tampering', prevention: 'HMAC signature verification detects any payload modification' },
                    { attack: 'Cross-Hotel Access', prevention: 'Token.hotel_id must match URL hotel_id; strict isolation' },
                    { attack: 'Brute Force Tokens', prevention: 'Tokens use cryptographic signatures; not guessable' },
                  ].map((item, i) => (
                    <div key={i} className="bg-white rounded-lg p-3 border border-red-100">
                      <p className="text-xs font-medium text-red-800">⚠️ {item.attack}</p>
                      <p className="text-xs text-gray-600 mt-1">→ {item.prevention}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
