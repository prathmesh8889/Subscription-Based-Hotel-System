// ============================================================
// AUTH CONTROLLER
// ============================================================

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../config/database';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['SUPER_ADMIN', 'OWNER', 'KITCHEN', 'WAITER']),
  hotelId: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ============================================================
// REGISTER
// ============================================================

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const validationResult = registerSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.issues,
      });
      return;
    }

    const { email, password, name, role, hotelId } = validationResult.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'User with this email already exists.',
      });
      return;
    }

    if (role !== 'SUPER_ADMIN' && !hotelId) {
      res.status(400).json({
        success: false,
        error: 'hotelId is required for non-SUPER_ADMIN roles.',
      });
      return;
    }

    if (hotelId) {
      const hotel = await prisma.hotel.findUnique({
        where: { id: hotelId },
      });

      if (!hotel) {
        res.status(404).json({
          success: false,
          error: 'Hotel not found.',
        });
        return;
      }

      if (!hotel.isActive) {
        res.status(403).json({
          success: false,
          error: 'Hotel is not active.',
        });
        return;
      }

      const staffCount = await prisma.user.count({
        where: { hotelId },
      });

      if (staffCount >= hotel.maxStaff) {
        res.status(402).json({
          success: false,
          error: `Staff limit reached. Maximum ${hotel.maxStaff} staff allowed.`,
        });
        return;
      }
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role as any,
        hotelId: hotelId || null,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        hotelId: true,
        isActive: true,
        createdAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTERED',
        resource: 'User',
        resourceId: user.id,
        hotelId: user.hotelId,
        metadata: {
          email: user.email,
          role: user.role,
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: user,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed. Please try again.',
    });
  }
};

// ============================================================
// LOGIN
// ============================================================

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const validationResult = loginSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.issues,
      });
      return;
    }

    const { email, password } = validationResult.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
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

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        hotelId: user.hotelId,
      },
      jwtSecret,
      { expiresIn: jwtExpiresIn as any }
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        resource: 'User',
        resourceId: user.id,
        hotelId: user.hotelId,
        metadata: {
          email: user.email,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      },
    });

    // Set HttpOnly cookie with JWT token
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieMaxAge = 24 * 60 * 60 * 1000; // 24 hours

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: cookieMaxAge,
      path: '/',
    });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          hotelId: user.hotelId,
          isActive: user.isActive,
          lastLoginAt: user.lastLoginAt,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed. Please try again.',
    });
  }
};

// ============================================================
// VERIFY SESSION
// ============================================================

export const verifySession = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.auth_token;

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'No session found.',
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    const decoded = jwt.verify(token, jwtSecret) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        hotelId: true,
        isActive: true,
        lastLoginAt: true,
        hotel: {
          select: {
            id: true,
            name: true,
            subscriptionPlan: true,
            subscriptionEnd: true,
            isActive: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        error: 'Invalid session.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Session expired.',
      });
      return;
    }

    console.error('Verify session error:', error);
    res.status(500).json({
      success: false,
      error: 'Session verification failed.',
    });
  }
};

// ============================================================
// LOGOUT
// ============================================================

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.auth_token;

    if (token) {
      try {
        const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
        const decoded = jwt.verify(token, jwtSecret) as any;

        await prisma.auditLog.create({
          data: {
            userId: decoded.userId,
            action: 'USER_LOGOUT',
            resource: 'User',
            resourceId: decoded.userId,
            metadata: {
              ipAddress: req.ip,
              userAgent: req.get('user-agent'),
            },
          },
        });
      } catch (error) {
        // Token might be invalid, just clear cookie
      }
    }

    // Clear cookie
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
    });

    res.status(200).json({
      success: true,
      message: 'Logout successful.',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed.',
    });
  }
};

// ============================================================
// GET CURRENT USER
// ============================================================

export const getCurrentUser = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated.',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        hotelId: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        hotel: {
          select: {
            id: true,
            name: true,
            subscriptionPlan: true,
            subscriptionEnd: true,
            isActive: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user data.',
    });
  }
};
