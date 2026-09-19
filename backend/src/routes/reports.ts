// ============================================================
// REPORTS ROUTES
// ============================================================

import express from 'express';
import {
  getRevenueReport,
  getOrderAnalytics,
  getTopSellingItems,
  getPaymentBreakdown,
  getTableUtilization,
} from '../controllers/reportsController';
import { authenticateToken, authorizeRole, verifyHotelAccess } from '../middleware/auth';

const router = express.Router();

// All routes require authentication and OWNER role
router.use(authenticateToken);
router.use(authorizeRole(['OWNER', 'SUPER_ADMIN']));
router.use(verifyHotelAccess);

// Revenue report
router.get('/revenue', getRevenueReport);

// Order analytics
router.get('/orders', getOrderAnalytics);

// Top selling items
router.get('/top-items', getTopSellingItems);

// Payment method breakdown
router.get('/payments', getPaymentBreakdown);

// Table utilization
router.get('/tables', getTableUtilization);

export default router;
