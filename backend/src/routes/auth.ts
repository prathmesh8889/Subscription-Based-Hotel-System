// ============================================================
// AUTH ROUTES
// ============================================================

import express from 'express';
import { register, login, getCurrentUser, verifySession, logout } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: 'Too many attempts. Please try again later.',
  },
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/verify', verifySession);
router.post('/logout', logout);
router.get('/me', authenticateToken, getCurrentUser);

export default router;
