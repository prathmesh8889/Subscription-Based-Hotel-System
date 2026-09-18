// ============================================================
// AUTH ROUTES
// ============================================================

import express from 'express';
import {
  register,
  login,
  getCurrentUser,
  changePassword,
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { adminLoginRateLimit } from '../middleware/adminSecurity';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: {
    success: false,
    error: 'Too many attempts. Please try again later.',
  },
});

// Public routes
router.post('/register', authLimiter, register);

// Login with enhanced security for admin attempts
router.post('/login', authLimiter, adminLoginRateLimit, login);

// Protected routes
router.get('/me', authenticateToken, getCurrentUser);
router.put('/change-password', authenticateToken, changePassword);

export default router;
