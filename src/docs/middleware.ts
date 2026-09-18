// ============================================================
// BACKEND MIDDLEWARE & SECURITY - Express.js
// File: backend/middleware/auth.js
// ============================================================
//
// These middleware functions enforce:
// 1. JWT Authentication (authenticateToken)
// 2. Role-Based Access Control (authorizeRole)
// 3. Multi-Tenancy Data Isolation (verifyHotelOwnership)
//
// CRITICAL: Every API route (except Super Admin and public QR)
// MUST pass through ALL THREE middleware.
// ============================================================

/*
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============================================================
// 1. AUTHENTICATE TOKEN - Verifies JWT
// ============================================================
// Extracts and verifies the JWT from Authorization header.
// Attaches decoded user payload to req.user.

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.' 
      });
    }

    // Verify JWT signature and expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch fresh user data from DB (token might be valid but user deactivated)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        hotel_id: true,
        is_active: true,
      }
    });

    if (!user || !user.is_active) {
      return res.status(401).json({ 
        error: 'User account is inactive or not found.' 
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    return res.status(500).json({ error: 'Authentication error' });
  }
};

// ============================================================
// 2. AUTHORIZE ROLE - Checks RBAC permissions
// ============================================================
// Usage: router.get('/menu', authorizeRole(['OWNER', 'KITCHEN']), ...)
//
// Ensures the authenticated user has one of the allowed roles.
// SUPER_ADMIN bypasses all role checks.

const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // SUPER_ADMIN has access to everything
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden. Insufficient permissions.' 
      });
    }

    next();
  };
};

// ============================================================
// 3. VERIFY HOTEL OWNERSHIP - Multi-Tenancy Enforcement
// ============================================================
// CRITICAL SECURITY MIDDLEWARE
//
// Ensures that the user can ONLY access data belonging to 
// their hotel. This is the backbone of data isolation.
//
// How it works:
// - For GET requests with :hotelId param: checks param matches user's hotel
// - For POST/PUT: ensures the body contains the correct hotel_id
// - For queries: adds hotel_id filter to the database query
//
// This prevents horizontal privilege escalation where one hotel
// could access another hotel's data by guessing IDs.

const verifyHotelOwnership = (options = {}) => {
  return async (req, res, next) => {
    try {
      const userHotelId = req.user.hotel_id;

      // SUPER_ADMIN can access any hotel's data
      if (req.user.role === 'SUPER_ADMIN') {
        return next();
      }

      // Check URL parameter (e.g., /api/hotels/:hotelId/menu)
      if (req.params.hotelId && req.params.hotelId !== userHotelId) {
        return res.status(403).json({ 
          error: 'Forbidden. You can only access your own hotel data.' 
        });
      }

      // Check request body for POST/PUT (e.g., creating a menu item)
      if (req.body.hotel_id && req.body.hotel_id !== userHotelId) {
        return res.status(403).json({ 
          error: 'Forbidden. Cannot create resources for another hotel.' 
        });
      }

      // Check query parameters
      if (req.query.hotel_id && req.query.hotel_id !== userHotelId) {
        return res.status(403).json({ 
          error: 'Forbidden. Invalid hotel_id parameter.' 
        });
      }

      // Inject hotel_id into request for downstream use
      req.hotel_id = userHotelId;
      
      next();
    } catch (error) {
      return res.status(500).json({ error: 'Authorization error' });
    }
  };
};

// ============================================================
// 4. CHECK SUBSCRIPTION STATUS
// ============================================================
// Ensures the hotel's subscription is active.
// If expired, only allows read-only operations.

const checkSubscription = (allowReadOnly = false) => {
  return async (req, res, next) => {
    try {
      const hotelId = req.hotel_id || req.user.hotel_id;
      
      const hotel = await prisma.hotel.findUnique({
        where: { id: hotelId }
      });

      if (!hotel) {
        return res.status(404).json({ error: 'Hotel not found' });
      }

      const isExpired = new Date(hotel.subscription_end_date) < new Date();

      if (isExpired && !hotel.is_active) {
        if (allowReadOnly && ['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
          // Allow read-only access for expired subscriptions
          req.readOnlyMode = true;
          return next();
        }
        return res.status(402).json({ 
          error: 'Subscription expired. Please renew to continue.',
          readOnly: true 
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({ error: 'Subscription check failed' });
    }
  };
};

// ============================================================
// 5. ENFORCE PLAN LIMITS
// ============================================================
// Checks if the action would exceed the hotel's plan limits.
// Used during resource creation (tables, menu items, staff).

const enforcePlanLimits = (resourceType) => {
  return async (req, res, next) => {
    try {
      const hotelId = req.hotel_id || req.user.hotel_id;
      
      const hotel = await prisma.hotel.findUnique({
        where: { id: hotelId }
      });

      let currentCount;
      let maxAllowed;

      switch (resourceType) {
        case 'table':
          currentCount = await prisma.table.count({ where: { hotel_id: hotelId } });
          maxAllowed = hotel.max_tables;
          break;
        case 'menu_item':
          currentCount = await prisma.menuItem.count({ where: { hotel_id: hotelId } });
          maxAllowed = hotel.max_menu_items;
          break;
        case 'staff':
          currentCount = await prisma.user.count({ where: { hotel_id: hotelId } });
          maxAllowed = hotel.max_staff;
          break;
        default:
          return next();
      }

      if (currentCount >= maxAllowed) {
        return res.status(402).json({ 
          error: `Plan limit exceeded. Maximum ${maxAllowed} ${resourceType}s allowed.`,
          current: currentCount,
          maximum: maxAllowed,
          upgrade_hint: 'Upgrade your plan for higher limits.'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({ error: 'Plan limit check failed' });
    }
  };
};

module.exports = {
  authenticateToken,
  authorizeRole,
  verifyHotelOwnership,
  checkSubscription,
  enforcePlanLimits,
};
*/

// ============================================================
// USAGE EXAMPLES:
// ============================================================
//
// // Get menu items (Owner, Kitchen, Waiter can access)
// router.get('/api/menu',
//   authenticateToken,
//   authorizeRole(['OWNER', 'KITCHEN', 'WAITER']),
//   verifyHotelOwnership(),
//   checkSubscription(true),  // Allow read even if expired
//   async (req, res) => {
//     const items = await prisma.menuItem.findMany({
//       where: { hotel_id: req.hotel_id }  // ALWAYS filter by hotel_id
//     });
//     res.json(items);
//   }
// );
//
// // Create menu item (Owner only)
// router.post('/api/menu',
//   authenticateToken,
//   authorizeRole(['OWNER']),
//   verifyHotelOwnership(),
//   checkSubscription(false),  // Must be active to create
//   enforcePlanLimits('menu_item'),
//   async (req, res) => {
//     const item = await prisma.menuItem.create({
//       data: {
//         ...req.body,
//         hotel_id: req.hotel_id,  // Force correct hotel_id
//       }
//     });
//     res.status(201).json(item);
//   }
// );
//
// // Kitchen: Get pending orders
// router.get('/api/orders/kitchen',
//   authenticateToken,
//   authorizeRole(['KITCHEN']),
//   verifyHotelOwnership(),
//   async (req, res) => {
//     const orders = await prisma.order.findMany({
//       where: {
//         hotel_id: req.hotel_id,  // Multi-tenancy filter
//         status: { in: ['PENDING', 'PREPARING'] }
//       },
//       orderBy: { created_at: 'asc' }
//     });
//     res.json(orders);
//   }
// );

export {};
