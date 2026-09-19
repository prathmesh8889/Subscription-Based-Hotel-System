import express from 'express';
import { createHotelAndOwner, getAllHotels } from '../controllers/hotelController';
import { getSubscriptions, updateSubscription } from '../controllers/subscriptionController';
import { getPlatformAnalytics } from '../controllers/platformAnalyticsController';
import { getNotifications } from '../controllers/platformNotificationsController';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const router = express.Router();
router.use(authenticateToken);
router.use(authorizeRole(['SUPER_ADMIN']));

router.post('/create-hotel', createHotelAndOwner);
router.get('/hotels', getAllHotels);
router.get('/subscriptions', getSubscriptions);
router.patch('/hotels/:id/subscription', updateSubscription);
router.get('/analytics', getPlatformAnalytics);
router.get('/notifications', getNotifications);

export default router;
