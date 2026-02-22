import { query } from '../config/db.js';

export async function list(req, res) {
  const critical = await query(`
    SELECT p.id AS patient_id, p.name, p.risk_level, e.id AS encounter_id, e.visit_date
    FROM patients p
    JOIN encounters e ON e.patient_id = p.id
    WHERE p.risk_level = 'high'
    ORDER BY e.visit_date DESC
    LIMIT 50
  `);
  const pendingAI = await query(`
    SELECT e.id AS encounter_id, e.patient_id, e.visit_date, p.name AS patient_name
    FROM encounters e
    JOIN patients p ON p.id = e.patient_id
    LEFT JOIN ai_results ar ON ar.encounter_id = e.id
    WHERE ar.id IS NULL
    ORDER BY e.visit_date DESC
    LIMIT 50
  `);
  res.json({ critical, pendingAI });
}
