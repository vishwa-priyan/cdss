import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import * as alertsController from '../controllers/alertsController.js';

const router = Router();

router.use(authenticate);
router.use(requireRole(['admin', 'doctor', 'nurse']));

router.get('/', alertsController.list);

export default router;
