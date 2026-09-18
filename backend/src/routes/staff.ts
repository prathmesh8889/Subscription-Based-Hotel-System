// ============================================================
// STAFF ROUTES (Owner Only)
// ============================================================

import express from 'express';
import {
  createStaff,
  getHotelStaff,
  toggleStaffStatus,
} from '../controllers/userController';
import {
  authenticateToken,
  authorizeRole,
  verifyHotelAccess,
} from '../middleware/auth';

const router = express.Router();

// All routes require authentication and OWNER role
router.use(authenticateToken);
router.use(authorizeRole(['OWNER']));
router.use(verifyHotelAccess);

router.post('/', createStaff);
router.get('/', getHotelStaff);
router.patch('/:staffId/toggle', toggleStaffStatus);

export default router;
