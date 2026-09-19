// ============================================================
// MENU ROUTES
// ============================================================

import express from 'express';
import {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from '../controllers/menuController';
import { authenticateToken, authorizeRole, verifyHotelAccess } from '../middleware/auth';

const router = express.Router();

// Public route - Get menu items (for customer QR)
router.get('/', getMenuItems);

// Protected routes - Owner only
router.post('/', authenticateToken, authorizeRole(['OWNER']), verifyHotelAccess, createMenuItem);
router.put('/:id', authenticateToken, authorizeRole(['OWNER']), verifyHotelAccess, updateMenuItem);
router.delete('/:id', authenticateToken, authorizeRole(['OWNER']), verifyHotelAccess, deleteMenuItem);

export default router;
