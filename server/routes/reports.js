import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import * as reportsController from '../controllers/reportsController.js';

const router = Router();

router.use(authenticate);
router.use(requireRole(['admin', 'doctor', 'nurse']));

router.get('/analytics', reportsController.getAnalytics);

export default router;
