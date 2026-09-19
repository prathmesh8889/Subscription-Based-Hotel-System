// ============================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  hotelId: string | null;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
  hotelId?: string;
  cookies?: any;
}

// ============================================================
// 1. AUTHENTICATE TOKEN
// ============================================================

export const authenticateToken = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Read token from HttpOnly cookie
    const token = req.cookies?.auth_token;

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access denied. No session found.',
      });
      return;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret'
    ) as JwtPayload;

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
// 2. AUTHORIZE ROLE
// ============================================================

export const authorizeRole = (allowedRoles: string[]) => {
  return (req: any, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated.',
      });
      return;
    }

    if (req.user.role === 'SUPER_ADMIN') {
      next();
      return;
    }

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
// 3. VERIFY HOTEL ACCESS (CRITICAL FOR MULTI-TENANCY)
// ============================================================

export const verifyHotelAccess = async (
  req: any,
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

    if (req.user.role === 'SUPER_ADMIN') {
      next();
      return;
    }

    if (!req.user.hotelId) {
      res.status(403).json({
        success: false,
        error: 'User does not belong to any hotel.',
      });
      return;
    }

    const hotelIdFromParams = req.params.hotelId;
    const hotelIdFromBody = req.body.hotelId;
    const hotelIdFromQuery = req.query.hotelId;

    const hotelIdsToCheck = [
      hotelIdFromParams,
      hotelIdFromBody,
      hotelIdFromQuery,
    ].filter((id): id is string => id !== undefined);

    for (const hotelId of hotelIdsToCheck) {
      if (hotelId !== req.user.hotelId) {
        res.status(403).json({
          success: false,
          error: 'Access denied. You can only access your own hotel data.',
        });
        return;
      }
    }

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
