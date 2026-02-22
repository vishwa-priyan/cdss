import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { query } from '../config/db.js';

const router = Router();

router.use(authenticate);
router.use(requireRole(['admin', 'doctor', 'nurse']));

router.get('/', async (req, res) => {
  const rows = await query(`
    SELECT lr.*, e.id AS encounter_id, e.patient_id, e.visit_date, p.name AS patient_name
    FROM lab_reports lr
    JOIN encounters e ON e.id = lr.encounter_id
    JOIN patients p ON p.id = e.patient_id
    ORDER BY lr.uploaded_at DESC
  `);
  res.json(rows);
});

export default router;
