import express from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth';
import {
  getOwnerSettings,
  updateOwnerSettings,
  changeOwnerPassword,
} from '../controllers/ownerSettingsController';

const router = express.Router();
router.use(authenticateToken);
router.use(authorizeRole(['OWNER']));

router.get('/settings', getOwnerSettings);
router.patch('/settings', updateOwnerSettings);
router.post('/change-password', changeOwnerPassword);

export default router;
