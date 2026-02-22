import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import * as dashboardController from '../controllers/dashboardController.js';

const router = Router();

router.use(authenticate);
router.use(requireRole(['admin', 'doctor', 'nurse']));

router.get('/stats', dashboardController.getStats);
router.get('/recent-patients', dashboardController.getRecentPatients);
router.get('/critical-alerts', dashboardController.getCriticalAlerts);

export default router;
