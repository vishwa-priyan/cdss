import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import * as encounterController from '../controllers/encounterController.js';

const router = Router();

router.use(authenticate);

router.get('/', requireRole(['admin', 'doctor', 'nurse']), encounterController.list);
router.get('/:id/report-pdf', requireRole(['admin', 'doctor', 'nurse']), encounterController.getReportPdf);
router.get('/:id', requireRole(['admin', 'doctor', 'nurse']), encounterController.getById);
router.post('/:encounterId/vitals', requireRole(['admin', 'doctor', 'nurse']), encounterController.addVitals);
router.post('/:encounterId/symptoms', requireRole(['admin', 'doctor', 'nurse']), encounterController.addSymptoms);
router.post('/:encounterId/doctor-notes', requireRole(['admin', 'doctor']), encounterController.addDoctorNote);
router.post('/:encounterId/ai-diagnosis', requireRole(['admin', 'doctor']), encounterController.runAIDiagnosis);

export default router;
