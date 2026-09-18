// ============================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================
// Handles JWT verification, role-based access control, and
// multi-tenant data isolation validation
// ============================================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { Role } from '@prisma/client';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  hotelId: string | null;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// ============================================================
// 1. AUTHENTICATE TOKEN MIDDLEWARE
// ============================================================
// Verifies JWT token from Authorization header
// Attaches decoded user payload to req.user
//
// SECURITY:
// - Validates token signature
// - Checks token expiry
// - Verifies user still exists and is active
// - Rejects tokens for deactivated users

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.',
      });
      return;
    }

    // Verify JWT signature and expiry
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret'
    ) as JwtPayload;

    // Fetch fresh user data from database
    // This ensures deactivated users can't use old tokens
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        hotelId: true,
        isActive: true,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found.',
      });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({
        success: false,
        error: 'User account is deactivated.',
      });
      return;
    }

    // Attach user to request object
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      hotelId: user.hotelId,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token expired. Please login again.',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token.',
      });
      return;
    }

    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed.',
    });
  }
};

// ============================================================
// 2. AUTHORIZE ROLE MIDDLEWARE
// ============================================================
// Checks if user's role is in the allowed roles list
// SUPER_ADMIN bypasses all role checks
//
// USAGE:
// router.get('/admin', authorizeRole(['SUPER_ADMIN']), handler)
// router.get('/owner', authorizeRole(['OWNER', 'SUPER_ADMIN']), handler)

export const authorizeRole = (allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated.',
      });
      return;
    }

    // SUPER_ADMIN has access to everything
    if (req.user.role === 'SUPER_ADMIN') {
      next();
      return;
    }

    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Access denied. Insufficient permissions.',
      });
      return;
    }

    next();
  };
};

// ============================================================
// 3. VERIFY HOTEL ACCESS MIDDLEWARE
// ============================================================
// CRITICAL: Ensures user can only access data from their hotel
// Prevents horizontal privilege escalation
//
// SECURITY:
// - Validates hotelId in URL params matches user's hotelId
// - Validates hotelId in request body matches user's hotelId
// - Validates hotelId in query params matches user's hotelId
// - SUPER_ADMIN can access any hotel (for platform management)
//
// USAGE:
// router.get('/orders/:hotelId', verifyHotelAccess, handler)

export const verifyHotelAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated.',
      });
      return;
    }

    // SUPER_ADMIN can access any hotel
    if (req.user.role === 'SUPER_ADMIN') {
      next();
      return;
    }

    // For non-SUPER_ADMIN users, hotelId is required
    if (!req.user.hotelId) {
      res.status(403).json({
        success: false,
        error: 'User does not belong to any hotel.',
      });
      return;
    }

    // Extract hotelId from various sources
    const hotelIdFromParams = req.params.hotelId;
    const hotelIdFromBody = req.body.hotelId;
    const hotelIdFromQuery = req.query.hotelId;

    // Check all sources for hotelId
    const hotelIdsToCheck = [
      hotelIdFromParams,
      hotelIdFromBody,
      hotelIdFromQuery,
    ].filter((id): id is string => id !== undefined);

    // If any hotelId is provided, validate it matches user's hotelId
    for (const hotelId of hotelIdsToCheck) {
      if (hotelId !== req.user.hotelId) {
        res.status(403).json({
          success: false,
          error: 'Access denied. You can only access your own hotel data.',
        });
        return;
      }
    }

    // Inject user's hotelId into request for downstream use
    req.hotelId = req.user.hotelId;

    next();
  } catch (error) {
    console.error('Hotel access verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Hotel access verification failed.',
    });
  }
};

// ============================================================
// 4. VERIFY RESOURCE OWNERSHIP MIDDLEWARE
// ============================================================
// Ensures user can only modify resources they own
// Used for updating/deleting specific records
//
// USAGE:
// router.put('/orders/:id', verifyResourceOwnership('Order'), handler)

export const verifyResourceOwnership = (
  modelName: 'Order' | 'MenuItem' | 'Table'
) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated.',
        });
        return;
      }

      const resourceId = req.params.id;

      if (!resourceId) {
        res.status(400).json({
          success: false,
          error: 'Resource ID is required.',
        });
        return;
      }

      // SUPER_ADMIN can access any resource
      if (req.user.role === 'SUPER_ADMIN') {
        next();
        return;
      }

      // Fetch the resource and verify hotelId matches
      let resource: any = null;

      switch (modelName) {
        case 'Order':
          resource = await prisma.order.findUnique({
            where: { id: resourceId },
            select: { hotelId: true },
          });
          break;
        case 'MenuItem':
          resource = await prisma.menuItem.findUnique({
            where: { id: resourceId },
            select: { hotelId: true },
          });
          break;
        case 'Table':
          resource = await prisma.table.findUnique({
            where: { id: resourceId },
            select: { hotelId: true },
          });
          break;
      }

      if (!resource) {
        res.status(404).json({
          success: false,
          error: `${modelName} not found.`,
        });
        return;
      }

      // Verify resource belongs to user's hotel
      if (resource.hotelId !== req.user.hotelId) {
        res.status(403).json({
          success: false,
          error: 'Access denied. This resource does not belong to your hotel.',
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Resource ownership verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Resource ownership verification failed.',
      });
    }
  };
};

// ============================================================
// 5. CHECK SUBSCRIPTION MIDDLEWARE
// ============================================================
// Validates hotel subscription is active
// Returns 402 Payment Required if expired
//
// USAGE:
// router.post('/menu', checkSubscription, handler)

export const checkSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.hotelId) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated.',
      });
      return;
    }

    // SUPER_ADMIN bypasses subscription checks
    if (req.user.role === 'SUPER_ADMIN') {
      next();
      return;
    }

    // Fetch hotel subscription details
    const hotel = await prisma.hotel.findUnique({
      where: { id: req.user.hotelId },
      select: {
        isActive: true,
        subscriptionEnd: true,
      },
    });

    if (!hotel) {
      res.status(404).json({
        success: false,
        error: 'Hotel not found.',
      });
      return;
    }

    // Check if hotel is active
    if (!hotel.isActive) {
      res.status(402).json({
        success: false,
        error: 'Hotel account is deactivated.',
      });
      return;
    }

    // Check if subscription is expired
    const now = new Date();
    if (now > hotel.subscriptionEnd) {
      res.status(402).json({
        success: false,
        error: 'Subscription expired. Please renew to continue.',
        expired: true,
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    res.status(500).json({
      success: false,
      error: 'Subscription check failed.',
    });
  }
};
