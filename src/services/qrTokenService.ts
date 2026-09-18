// ============================================================
// QR Token Service - Secure, Time-Bound Token Generation
// ============================================================
// Simulates the backend JWT-based QR token system.
// In production, this logic runs on the Node.js/Express backend.
// ============================================================

import { Hotel, Table } from '../types';

// ============================================================
// Token Payload Structure (matches backend JWT payload)
// ============================================================
export interface QRTokenPayload {
  hotel_id: string;
  table_id: string;
  session_id: string;
  type: 'qr_session';
  iat: number;      // Issued at (Unix timestamp)
  exp: number;      // Expires at (Unix timestamp)
  signature: string; // HMAC signature for tamper detection
}

// ============================================================
// Configuration
// ============================================================
const QR_SECRET = 'restroflow_qr_secret_key_2026'; // In prod: env variable
const TOKEN_EXPIRY_HOURS = 4;

// ============================================================
// Simple HMAC-like signature (simulates crypto.createHmac)
// ============================================================
function generateSignature(payload: string): string {
  // Simple hash simulation - in production use crypto.createHmac('sha256', secret)
  let hash = 0;
  const combined = payload + QR_SECRET;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36) + Date.now().toString(36);
}

// ============================================================
// GENERATE QR TOKEN
// ============================================================
// Creates a secure, time-bound token for a table's QR code.
// This simulates: jwt.sign(payload, QR_SECRET, { expiresIn: '4h' })

export function generateQRToken(hotelId: string, tableId: string): string {
  const now = Math.floor(Date.now() / 1000);
  
  const payload: QRTokenPayload = {
    hotel_id: hotelId,
    table_id: tableId,
    session_id: generateSessionId(),
    type: 'qr_session',
    iat: now,
    exp: now + (TOKEN_EXPIRY_HOURS * 60 * 60),
    signature: '',
  };

  // Generate signature over the payload
  const payloadStr = JSON.stringify({
    hotel_id: payload.hotel_id,
    table_id: payload.table_id,
    session_id: payload.session_id,
    type: payload.type,
    iat: payload.iat,
    exp: payload.exp,
  });
  payload.signature = generateSignature(payloadStr);

  // Encode as base64 (simulates JWT format: header.payload.signature)
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  const sig = btoa(payload.signature);
  
  return `${header}.${body}.${sig}`;
}

// ============================================================
// VALIDATE QR TOKEN
// ============================================================
// Validates the token when customer scans the QR code.
// Returns: { valid: boolean, payload?: QRTokenPayload, error?: string }

export function validateQRToken(
  token: string,
  expectedHotelId: string,
  expectedTableId?: string
): { valid: boolean; payload?: QRTokenPayload; error?: string } {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Malformed token structure' };
    }

    const [headerB64, payloadB64, signatureB64] = parts;

    // Decode payload
    const payload: QRTokenPayload = JSON.parse(atob(payloadB64));

    // Verify signature
    const payloadStr = JSON.stringify({
      hotel_id: payload.hotel_id,
      table_id: payload.table_id,
      session_id: payload.session_id,
      type: payload.type,
      iat: payload.iat,
      exp: payload.exp,
    });
    const expectedSig = generateSignature(payloadStr);
    const actualSig = atob(signatureB64);

    if (actualSig !== expectedSig) {
      return { valid: false, error: 'Invalid signature - token may be tampered' };
    }

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (now > payload.exp) {
      return { valid: false, error: 'Token expired - please scan QR again' };
    }

    // Check type
    if (payload.type !== 'qr_session') {
      return { valid: false, error: 'Invalid token type' };
    }

    // Check hotel_id matches
    if (payload.hotel_id !== expectedHotelId) {
      return { valid: false, error: 'Token hotel mismatch - unauthorized access' };
    }

    // Check table_id if provided
    if (expectedTableId && payload.table_id !== expectedTableId) {
      return { valid: false, error: 'Token table mismatch' };
    }

    return { valid: true, payload };
  } catch (error) {
    return { valid: false, error: 'Failed to decode token' };
  }
}

// ============================================================
// GENERATE QR URL
// ============================================================
// Builds the complete QR code URL with secure token.

export function generateQRUrl(
  hotelId: string,
  tableId: string,
  token: string,
  baseUrl?: string
): string {
  const base = baseUrl || window.location.origin;
  return `${base}/customer/${hotelId}?table=${tableId}&token=${encodeURIComponent(token)}`;
}

// ============================================================
// GENERATE SESSION ID
// ============================================================
function generateSessionId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'sess_';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ============================================================
// TOKEN INFO - For display/debugging
// ============================================================
export function decodeTokenInfo(token: string): QRTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1]));
  } catch {
    return null;
  }
}

// ============================================================
// BULK GENERATE QR CODES FOR ALL TABLES
// ============================================================
export function generateBulkQRTokens(
  hotelId: string,
  tables: Table[]
): Array<{ table: Table; token: string; url: string }> {
  return tables.map(table => {
    const token = generateQRToken(hotelId, table.id);
    const url = generateQRUrl(hotelId, table.id, token);
    return { table, token, url };
  });
}
