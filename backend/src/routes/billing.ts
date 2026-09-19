// ============================================================
// BILLING ROUTES
// ============================================================

import express from 'express';
import {
  getUnpaidOrders,
  generateInvoice,
  processPayment,
  getBillingSummary,
} from '../controllers/billingController';
import { authenticateToken, authorizeRole, verifyHotelAccess } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get unpaid orders (Waiter/Owner)
router.get('/unpaid', authorizeRole(['WAITER', 'OWNER', 'SUPER_ADMIN']), verifyHotelAccess, getUnpaidOrders);

// Generate invoice (Waiter/Owner)
router.get('/invoice/:orderId', authorizeRole(['WAITER', 'OWNER', 'SUPER_ADMIN']), generateInvoice);

// Process payment (Waiter/Owner)
router.post('/pay/:orderId', authorizeRole(['WAITER', 'OWNER', 'SUPER_ADMIN']), verifyHotelAccess, processPayment);

// Get billing summary (Owner)
router.get('/summary', authorizeRole(['OWNER', 'SUPER_ADMIN']), verifyHotelAccess, getBillingSummary);

export default router;
