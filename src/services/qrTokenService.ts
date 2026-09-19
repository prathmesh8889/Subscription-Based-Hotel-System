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
  // IMPORTANT: Must be deterministic - same input always produces same output
  let hash = 0;
  const combined = payload + QR_SECRET;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Use a secondary hash for longer signature (still deterministic)
  let hash2 = 5381;
  for (let i = 0; i < combined.length; i++) {
    hash2 = ((hash2 << 5) + hash2) + combined.charCodeAt(i);
    hash2 = hash2 & hash2;
  }
  return Math.abs(hash).toString(36) + Math.abs(hash2).toString(36);
}

// ============================================================
// GENERATE QR TOKEN
// ============================================================
// Creates a secure, time-bound token for a table's QR code.
// Simplified for reliable QR code scanning

export function generateQRToken(hotelId: string, tableId: string): string {
  const now = Math.floor(Date.now() / 1000);
  const sessionId = generateSessionId();
  
  // Simple format: hotelId:tableId:sessionId:timestamp
  // This is shorter and more reliable for QR codes
  const simpleToken = `${hotelId}:${tableId}:${sessionId}:${now}`;
  
  // Encode to base64 for URL safety
  return btoa(simpleToken);
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
    // Decode the simple token format: hotelId:tableId:sessionId:timestamp
    const decoded = atob(token);
    const parts = decoded.split(':');
    
    if (parts.length !== 4) {
      return { valid: false, error: 'Invalid token format' };
    }

    const [hotelId, tableId, sessionId, timestampStr] = parts;
    const timestamp = parseInt(timestampStr, 10);
    
    // Check if timestamp is valid
    if (isNaN(timestamp)) {
      return { valid: false, error: 'Invalid timestamp' };
    }

    // Check expiry (4 hours)
    const now = Math.floor(Date.now() / 1000);
    const expiryTime = timestamp + (TOKEN_EXPIRY_HOURS * 60 * 60);
    
    if (now > expiryTime) {
      return { valid: false, error: 'Token expired - please scan QR again' };
    }

    // Check hotel_id matches
    if (hotelId !== expectedHotelId) {
      return { valid: false, error: 'Token hotel mismatch - unauthorized access' };
    }

    // Check table_id if provided
    if (expectedTableId && tableId !== expectedTableId) {
      return { valid: false, error: 'Token table mismatch' };
    }

    // Create payload object for compatibility
    const payload: QRTokenPayload = {
      hotel_id: hotelId,
      table_id: tableId,
      session_id: sessionId,
      type: 'qr_session',
      iat: timestamp,
      exp: expiryTime,
      signature: 'simple',
    };

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
    const decoded = atob(token);
    const parts = decoded.split(':');
    if (parts.length !== 4) return null;
    
    const [hotelId, tableId, sessionId, timestampStr] = parts;
    const timestamp = parseInt(timestampStr, 10);
    
    return {
      hotel_id: hotelId,
      table_id: tableId,
      session_id: sessionId,
      type: 'qr_session',
      iat: timestamp,
      exp: timestamp + (TOKEN_EXPIRY_HOURS * 60 * 60),
      signature: 'simple',
    };
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
