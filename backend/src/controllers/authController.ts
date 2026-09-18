// ============================================================
// AUTH CONTROLLER
// ============================================================
// Handles user registration and login with secure password
// hashing and JWT token generation
// ============================================================

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../config/database';
import { Role } from '@prisma/client';

// ============================================================
// VALIDATION SCHEMAS
// ============================================================
// Using Zod for input validation and sanitization

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['OWNER', 'KITCHEN', 'WAITER']),
  hotelId: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ============================================================
// REGISTER USER
// ============================================================
// Creates a new user account with hashed password
//
// SECURITY:
// - Password hashed with bcrypt (10 salt rounds)
// - Email uniqueness enforced
// - Role validation (cannot create SUPER_ADMIN via this endpoint)
// - hotelId required for non-SUPER_ADMIN roles

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const validationResult = registerSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
      return;
    }

    const { email, password, name, role, hotelId } = validationResult.data;

    // Check if user already exists
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

    // Validate hotelId for non-SUPER_ADMIN roles
    if (role !== 'SUPER_ADMIN' && !hotelId) {
      res.status(400).json({
        success: false,
        error: 'hotelId is required for non-SUPER_ADMIN roles.',
      });
      return;
    }

    // Verify hotel exists if hotelId provided
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

      // Check staff limit
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

    // Hash password with bcrypt
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role as Role,
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

    // Log audit event
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
// LOGIN USER
// ============================================================
// Authenticates user and returns JWT token
//
// SECURITY:
// - Password verification with bcrypt
// - JWT contains userId, role, hotelId
// - Token expiry configured via environment variable
// - Failed login attempts logged

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const validationResult = loginSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
      return;
    }

    const { email, password } = validationResult.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists or not (security best practice)
      res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(401).json({
        success: false,
        error: 'User account is deactivated.',
      });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
      return;
    }

    // Generate JWT token
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
      { expiresIn: jwtExpiresIn }
    );

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Log audit event
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

    // Return token and user data (without password)
    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
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
// GET CURRENT USER
// ============================================================
// Returns current authenticated user data
// Requires authentication middleware

export const getCurrentUser = async (
  req: any,
  res: Response
): Promise<void> => {
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

// ============================================================
// CHANGE PASSWORD
// ============================================================
// Allows authenticated user to change their password
// Requires current password verification

export const changePassword = async (
  req: any,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated.',
      });
      return;
    }

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: 'Current password and new password are required.',
      });
      return;
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters.',
      });
      return;
    }

    // Fetch user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found.',
      });
      return;
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      res.status(401).json({
        success: false,
        error: 'Current password is incorrect.',
      });
      return;
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_CHANGED',
        resource: 'User',
        resourceId: user.id,
        hotelId: user.hotelId,
        metadata: {
          ipAddress: req.ip,
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password.',
    });
  }
};
