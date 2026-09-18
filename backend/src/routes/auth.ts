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
router.post('/login', authLimiter, login);

// Protected routes
router.get('/me', authenticateToken, getCurrentUser);
router.put('/change-password', authenticateToken, changePassword);

export default router;
