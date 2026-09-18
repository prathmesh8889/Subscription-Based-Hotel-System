// ============================================================
// STEP 5: SECRET SUPER ADMIN ROUTE - BACKEND SECURITY
// ============================================================
// Additional backend security measures for the secret admin route
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
// Restricts access to admin routes from specific IP addresses
// Only enabled if ALLOWED_IPS is configured

export const ipWhitelist = (req: Request, res: Response, next: NextFunction) => {
  // Skip if no IPs configured (disabled)
  if (ALLOWED_IPS.length === 0) {
    return next();
  }

  // Only apply to admin routes
  if (!req.path.startsWith('/platform')) {
    return next();
  }

  const clientIp = req.ip || req.connection.remoteAddress || '';
  
  // Check if IP is in whitelist
  if (!ALLOWED_IPS.includes(clientIp)) {
    // Log the unauthorized access attempt
    console.warn(`⚠️ Unauthorized IP access attempt: ${clientIp} to ${req.path}`);
    
    // Log to audit trail
    prisma.auditLog.create({
       {
        action: 'UNAUTHORIZED_IP_ACCESS',
        resource: 'AdminRoute',
        meta {
          ip: clientIp,
          path: req.path,
          userAgent: req.get('user-agent'),
          timestamp: new Date().toISOString(),
        },
      },
    }).catch(err => console.error('Failed to log audit:', err));

    // Return 403 without revealing the route exists
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
// More aggressive rate limiting for admin login attempts

export const adminLoginRateLimit = async (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.connection.remoteAddress || '';
  const email = req.body.email;

  if (!email) {
    return next();
  }

  try {
    // Check recent failed attempts for this email
    const recentAttempts = await prisma.auditLog.count({
      where: {
        action: 'ADMIN_LOGIN_FAILED',
        meta: {
          path: { contains: email },
        },
        createdAt: {
          gte: new Date(Date.now() - LOCKOUT_DURATION),
        },
      },
    });

    if (recentAttempts >= MAX_LOGIN_ATTEMPTS) {
      // Log the lockout
      await prisma.auditLog.create({
         {
          action: 'ADMIN_ACCOUNT_LOCKED',
          resource: 'User',
          meta {
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
    next(); // Continue even if check fails
  }
};

// ============================================================
// ADMIN ACCESS LOGGER
// ============================================================
// Logs all access to admin routes for security auditing

export const adminAccessLogger = async (req: Request, res: Response, next: NextFunction) => {
  // Only log admin routes
  if (!req.path.startsWith('/platform')) {
    return next();
  }

  const ip = req.ip || req.connection.remoteAddress || '';
  const userAgent = req.get('user-agent') || '';

  // Log the access
  try {
    await prisma.auditLog.create({
       {
        userId: (req as any).user?.userId,
        action: 'ADMIN_ROUTE_ACCESS',
        resource: 'AdminRoute',
        meta {
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
// Detects if someone is probing for admin routes

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
    
    // Log suspicious activity
    console.warn(`🚨 Suspicious admin route probe: ${ip} -> ${req.path}`);
    
    prisma.auditLog.create({
       {
        action: 'SUSPICIOUS_ROUTE_PROBE',
        resource: 'Honeypot',
        meta {
          ip,
          path: req.path,
          userAgent: req.get('user-agent'),
          timestamp: new Date().toISOString(),
        },
      },
    }).catch(err => console.error('Failed to log honeypot:', err));

    // Return 404 to not reveal the actual admin route
    return res.status(404).json({
      success: false,
      error: 'Not found',
    });
  }

  next();
};

// ============================================================
// TWO-FACTOR AUTHENTICATION CHECK (Optional)
// ============================================================
// Requires 2FA for admin access if enabled

export const require2FA = async (req: Request, res: Response, next: NextFunction) => {
  // Skip if 2FA is not enabled
  if (process.env.ADMIN_REQUIRE_2FA !== 'true') {
    return next();
  }

  // Only apply to admin routes
  if (!req.path.startsWith('/platform')) {
    return next();
  }

  const userId = (req as any).user?.userId;

  if (!userId) {
    return next();
  }

  try {
    // Check if user has 2FA enabled
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        meta true,
      },
    });

    if (!user) {
      return next();
    }

    const meta = user.meta as any;
    const has2FA = meta?.twoFactorEnabled === true;

    if (has2FA) {
      // Check if 2FA token is provided
      const twoFactorToken = req.headers['x-2fa-token'];

      if (!twoFactorToken) {
        return res.status(403).json({
          success: false,
          error: 'Two-factor authentication required',
          requires2FA: true,
        });
      }

      // Verify 2FA token (implementation depends on 2FA provider)
      // This is a placeholder - implement with your 2FA provider
      const isValid2FA = await verify2FAToken(userId, twoFactorToken as string);

      if (!isValid2FA) {
        return res.status(403).json({
          success: false,
          error: 'Invalid two-factor authentication code',
        });
      }
    }

    next();
  } catch (error) {
    console.error('2FA check failed:', error);
    next(); // Continue even if check fails
  }
};

// Placeholder function for 2FA verification
async function verify2FAToken(userId: string, token: string): Promise<boolean> {
  // Implement with your 2FA provider (Google Authenticator, Authy, etc.)
  // Example: return await authenticator.verify({ token, secret: userSecret });
  console.warn('2FA verification not implemented - using placeholder');
  return true; // Placeholder - always returns true
}

// ============================================================
// SESSION SECURITY MIDDLEWARE
// ============================================================
// Additional security checks for admin sessions

export const adminSessionSecurity = (req: Request, res: Response, next: NextFunction) => {
  // Only apply to admin routes
  if (!req.path.startsWith('/platform')) {
    return next();
  }

  const user = (req as any).user;

  if (!user) {
    return next();
  }

  // Check if user is SUPER_ADMIN
  if (user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Super Admin only.',
    });
  }

  // Additional security checks can be added here:
  // - Check session age
  // - Verify IP hasn't changed during session
  // - Check for suspicious activity patterns

  next();
};
