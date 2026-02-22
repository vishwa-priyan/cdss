import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import * as uploadController from '../controllers/uploadController.js';

const router = Router();

router.use(authenticate);
router.use(requireRole(['admin', 'doctor', 'nurse']));

router.post('/lab-report/:encounterId', uploadController.uploadLabReport);

export default router;
