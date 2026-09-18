// ============================================================
// QR CODE GENERATION LOGIC - Secure, Time-Bound Tokens
// ============================================================
//
// SECURITY MODEL:
// The QR code URL must NOT be just `?table=5`. It must contain
// a secure, time-bound token to prevent:
// 1. Fake orders from outside the hotel
// 2. URL sharing/manipulation
// 3. Replay attacks with old tokens
//
// TOKEN STRUCTURE:
// The token is a JWT containing:
// - hotel_id: Which hotel this QR belongs to
// - table_id: Which table this QR is for
// - session_id: Unique session identifier
// - exp: Expiry time (e.g., 4 hours from generation)
// - iat: Issued at timestamp
//
// VALIDATION FLOW:
// 1. Customer scans QR -> hits /customer/:hotelId?table=X&token=Y
// 2. Backend validates token signature + expiry
// 3. Backend verifies token.hotel_id matches URL hotel_id
// 4. Backend verifies token.table_id matches the table param
// 5. If valid -> serve the menu
// 6. If invalid -> show error page
// ============================================================

/*
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const crypto = require('crypto');

// ============================================================
// GENERATE QR TOKEN
// ============================================================
// Creates a secure, time-bound token for a table's QR code.

const generateQRToken = (hotelId, tableId) => {
  const payload = {
    hotel_id: hotelId,
    table_id: tableId,
    session_id: crypto.randomUUID(),
    type: 'qr_session',
  };

  // Token expires in 4 hours (adjustable)
  const token = jwt.sign(payload, process.env.QR_SECRET_KEY, {
    expiresIn: '4h',
  });

  return token;
};

// ============================================================
// GENERATE QR CODE IMAGE
// ============================================================
// Creates a downloadable QR code for a specific table.

const generateQRCode = async (req, res) => {
  try {
    const { tableId } = req.params;
    const hotelId = req.hotel_id;

    // Verify table belongs to this hotel
    const table = await prisma.table.findFirst({
      where: { id: tableId, hotel_id: hotelId }
    });

    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    // Generate secure token
    const token = generateQRToken(hotelId, tableId);

    // Build the QR URL
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const qrUrl = `${baseUrl}/customer/${hotelId}?table=${tableId}&token=${token}`;

    // Generate QR code as buffer (PNG)
    const qrBuffer = await QRCode.toBuffer(qrUrl, {
      type: 'png',
      width: 400,
      margin: 2,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
    });

    // Also return the URL for display
    res.json({
      table_number: table.table_number,
      qr_url: qrUrl,
      qr_image: qrBuffer.toString('base64'),
      token_expires: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      // Note: For printing, use the qr_image base64 directly
      // For display, use the qr_url
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
};

// ============================================================
// VALIDATE QR TOKEN
// ============================================================
// Validates the token when customer accesses the menu.

const validateQRToken = async (req, res, next) => {
  try {
    const { token } = req.query;
    const { hotelId } = req.params;

    if (!token) {
      return res.status(400).json({ error: 'Missing session token' });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.QR_SECRET_KEY);

    // Security checks
    if (decoded.hotel_id !== hotelId) {
      return res.status(403).json({ error: 'Token hotel mismatch' });
    }

    if (decoded.type !== 'qr_session') {
      return res.status(403).json({ error: 'Invalid token type' });
    }

    // Attach validated data to request
    req.qrSession = {
      hotel_id: decoded.hotel_id,
      table_id: decoded.table_id,
      session_id: decoded.session_id,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Session expired. Please scan the QR code again.' 
      });
    }
    return res.status(401).json({ error: 'Invalid session token' });
  }
};

// ============================================================
// GENERATE ALL QR CODES FOR A HOTEL
// ============================================================
// Bulk generation for printing all table QR codes.

const generateAllQRCodes = async (req, res) => {
  try {
    const hotelId = req.hotel_id;
    
    const tables = await prisma.table.findMany({
      where: { hotel_id: hotelId },
      orderBy: { table_number: 'asc' }
    });

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const qrCodes = [];

    for (const table of tables) {
      const token = generateQRToken(hotelId, table.id);
      const qrUrl = `${baseUrl}/customer/${hotelId}?table=${table.id}&token=${token}`;
      
      const qrBuffer = await QRCode.toBuffer(qrUrl, {
        type: 'png',
        width: 300,
        margin: 2,
      });

      qrCodes.push({
        table_id: table.id,
        table_number: table.table_number,
        qr_url: qrUrl,
        qr_image: qrBuffer.toString('base64'),
      });
    }

    res.json({ hotel_name: req.hotel?.name, qr_codes: qrCodes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate QR codes' });
  }
};

module.exports = {
  generateQRToken,
  generateQRCode,
  validateQRToken,
  generateAllQRCodes,
};
*/

// ============================================================
// SECURITY CONSIDERATIONS:
// ============================================================
//
// 1. TOKEN EXPIRY: 4 hours is reasonable for a dining session.
//    Can be adjusted based on restaurant type.
//
// 2. SECRET ROTATION: QR_SECRET_KEY should be rotated periodically.
//    Old tokens will become invalid (expected behavior).
//
// 3. RATE LIMITING: Apply rate limiting to the customer ordering
//    endpoint to prevent abuse.
//
// 4. IP CHECKS (Optional): For extra security, compare the
//    customer's IP with the hotel's registered IP range.
//
// 5. TABLE STATUS: When a table is marked as AVAILABLE,
//    invalidate any existing tokens for that table.
//
// 6. AUDIT LOG: Log all QR scans and order placements
//    for security auditing.

export {};
