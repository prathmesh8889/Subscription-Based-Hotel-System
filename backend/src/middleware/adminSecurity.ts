// ============================================================
// ADMIN SECURITY MIDDLEWARE
// ============================================================
// Security measures for the secret Super Admin route
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

// ============================================================
// CONFIGURATION
// ============================================================

const SECRET_ADMIN_PATH = '/platform/login';
const ALLOWED_IPS = process.env.ADMIN_ALLOWED_IPS?.split(',') || [];
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// ============================================================
// IP WHITELIST MIDDLEWARE
// ============================================================

export const ipWhitelist = (req: Request, res: Response, next: NextFunction) => {
  if (ALLOWED_IPS.length === 0) {
    return next();
  }

  if (!req.path.startsWith('/platform')) {
    return next();
  }

  const clientIp = req.ip || req.connection.remoteAddress || '';
  
  if (!ALLOWED_IPS.includes(clientIp)) {
    console.warn(`⚠️ Unauthorized IP access attempt: ${clientIp} to ${req.path}`);
    
    prisma.auditLog.create({
      data: {
        action: 'UNAUTHORIZED_IP_ACCESS',
        resource: 'AdminRoute',
        metadata: {
          ip: clientIp,
          path: req.path,
          userAgent: req.get('user-agent'),
          timestamp: new Date().toISOString(),
        },
      },
    }).catch((err: any) => console.error('Failed to log audit:', err));

    return res.status(404).json({
      success: false,
      error: 'Not found',
    });
  }

  next();
};

// ============================================================
// ADMIN LOGIN RATE LIMITER
// ============================================================

export const adminLoginRateLimit = async (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.connection.remoteAddress || '';
  const email = req.body.email;

  if (!email) {
    return next();
  }

  try {
    const recentAttempts = await prisma.auditLog.count({
      where: {
        action: 'ADMIN_LOGIN_FAILED',
        createdAt: {
          gte: new Date(Date.now() - LOCKOUT_DURATION),
        },
      },
    });

    if (recentAttempts >= MAX_LOGIN_ATTEMPTS) {
      await prisma.auditLog.create({
        data: {
          action: 'ADMIN_ACCOUNT_LOCKED',
          resource: 'User',
          metadata: {
            email,
            ip,
            attempts: recentAttempts,
            lockedUntil: new Date(Date.now() + LOCKOUT_DURATION).toISOString(),
          },
        },
      });

      return res.status(429).json({
        success: false,
        error: 'Too many failed attempts. Account locked for 15 minutes.',
        locked: true,
        retryAfter: Math.ceil(LOCKOUT_DURATION / 1000),
      });
    }

    next();
  } catch (error) {
    console.error('Rate limit check failed:', error);
    next();
  }
};

// ============================================================
// ADMIN ACCESS LOGGER
// ============================================================

export const adminAccessLogger = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.path.startsWith('/platform')) {
    return next();
  }

  const ip = req.ip || req.connection.remoteAddress || '';
  const userAgent = req.get('user-agent') || '';

  try {
    await prisma.auditLog.create({
      data: {
        userId: (req as any).user?.userId,
        action: 'ADMIN_ROUTE_ACCESS',
        resource: 'AdminRoute',
        metadata: {
          path: req.path,
          method: req.method,
          ip,
          userAgent,
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Failed to log admin access:', error);
  }

  next();
};

// ============================================================
// HONEYPOT DETECTION
// ============================================================

export const honeypotDetection = (req: Request, res: Response, next: NextFunction) => {
  const suspiciousPaths = [
    '/admin',
    '/administrator',
    '/wp-admin',
    '/phpmyadmin',
    '/admin/login',
    '/superadmin',
  ];

  const lowerPath = req.path.toLowerCase();
  
  if (suspiciousPaths.some(path => lowerPath.includes(path))) {
    const ip = req.ip || req.connection.remoteAddress || '';
    
    console.warn(`🚨 Suspicious admin route probe: ${ip} -> ${req.path}`);
    
    prisma.auditLog.create({
      data: {
        action: 'SUSPICIOUS_ROUTE_PROBE',
        resource: 'Honeypot',
        metadata: {
          ip,
          path: req.path,
          userAgent: req.get('user-agent'),
          timestamp: new Date().toISOString(),
        },
      },
    }).catch((err: any) => console.error('Failed to log honeypot:', err));

    return res.status(404).json({
      success: false,
      error: 'Not found',
    });
  }

  next();
};

// ============================================================
// SESSION SECURITY MIDDLEWARE
// ============================================================

export const adminSessionSecurity = (req: Request, res: Response, next: NextFunction) => {
  if (!req.path.startsWith('/platform')) {
    return next();
  }

  const user = (req as any).user;

  if (!user) {
    return next();
  }

  if (user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Super Admin only.',
    });
  }

  next();
};
