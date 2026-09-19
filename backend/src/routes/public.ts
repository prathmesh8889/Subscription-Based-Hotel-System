import express from 'express';
import rateLimit from 'express-rate-limit';
import { getPublicMenu, createPublicOrder, getPublicOrder } from '../controllers/publicController';

const router = express.Router();
const limiter = rateLimit({
  windowMs: 60_000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/menu/:hotelId', getPublicMenu);
router.get('/orders/:orderId', limiter, getPublicOrder);
router.post('/orders', limiter, createPublicOrder);

export default router;
