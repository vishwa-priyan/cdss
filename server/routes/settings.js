import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import * as settingsController from '../controllers/settingsController.js';

const router = Router();

router.use(authenticate);

router.get('/', requireRole(['admin']), settingsController.get);
router.patch('/', requireRole(['admin']), settingsController.update);
router.get('/users', requireRole(['admin']), settingsController.listUsers);
router.post('/users', requireRole(['admin']), settingsController.createUser);
router.put('/users/:id', requireRole(['admin']), settingsController.updateUser);

export default router;
