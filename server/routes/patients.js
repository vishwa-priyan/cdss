import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import * as patientController from '../controllers/patientController.js';

const router = Router();

router.use(authenticate);

router.get('/', requireRole(['admin', 'doctor', 'nurse']), patientController.list);
router.post('/', requireRole(['admin', 'doctor']), patientController.create);
router.get('/:id', requireRole(['admin', 'doctor', 'nurse']), patientController.getById);
router.put('/:id', requireRole(['admin', 'doctor']), patientController.update);
router.get('/:patientId/encounters', requireRole(['admin', 'doctor', 'nurse']), patientController.listEncounters);
router.post('/:patientId/encounters', requireRole(['admin', 'doctor']), patientController.createEncounter);

export default router;
