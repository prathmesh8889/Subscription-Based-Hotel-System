// ============================================================
// PLATFORM ROUTES (Super Admin Only)
// ============================================================

import express from 'express';
import {
  createHotelAndOwner,
  getAllHotels,
} from '../controllers/hotelController';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const router = express.Router();

// All routes require SUPER_ADMIN role
router.use(authenticateToken);
router.use(authorizeRole(['SUPER_ADMIN']));

router.post('/create-hotel', createHotelAndOwner);
router.get('/hotels', getAllHotels);

export default router;
