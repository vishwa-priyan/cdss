import { query } from '../config/db.js';

export async function getStats(req, res) {
  const today = new Date().toISOString().slice(0, 10);
  const [totalPatients] = await query('SELECT COUNT(*) AS count FROM patients');
  const [todayVisits] = await query('SELECT COUNT(*) AS count FROM encounters WHERE visit_date = ?', [today]);
  const [criticalCases] = await query("SELECT COUNT(*) AS count FROM patients WHERE risk_level = 'high'");
  const [pendingAI] = await query(
    `SELECT COUNT(*) AS count FROM encounters e
     LEFT JOIN ai_results ar ON ar.encounter_id = e.id
     WHERE ar.id IS NULL AND e.visit_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`
  );
  let confidenceDist = [];
  try {
    confidenceDist = await query(`
      SELECT
        CASE
          WHEN CAST(JSON_UNQUOTE(JSON_EXTRACT(result_json, '$.confidenceScore')) AS DECIMAL(5,2)) < 0.5 THEN 'low'
          WHEN CAST(JSON_UNQUOTE(JSON_EXTRACT(result_json, '$.confidenceScore')) AS DECIMAL(5,2)) < 0.8 THEN 'medium'
          ELSE 'high'
        END AS band,
        COUNT(*) AS count
      FROM ai_results
      WHERE result_json IS NOT NULL
      GROUP BY band
    `);
  } catch {
    confidenceDist = [];
  }

  const riskSummary = await query(
    "SELECT risk_level, COUNT(*) AS count FROM patients GROUP BY risk_level"
  );

  res.json({
    totalPatients: totalPatients.count,
    todaysVisits: todayVisits.count,
    criticalCases: criticalCases.count,
    pendingAIReviews: pendingAI.count,
    confidenceDistribution: confidenceDist,
    riskSummary: riskSummary.reduce((acc, r) => ({ ...acc, [r.risk_level]: r.count }), { low: 0, medium: 0, high: 0 }),
  });
}

export async function getRecentPatients(req, res) {
  const rows = await query(`
    SELECT p.id, p.name, p.risk_level, e.visit_date AS last_visit
    FROM patients p
    LEFT JOIN encounters e ON e.patient_id = p.id
    WHERE e.id = (SELECT id FROM encounters e2 WHERE e2.patient_id = p.id ORDER BY visit_date DESC LIMIT 1)
    ORDER BY e.visit_date DESC
    LIMIT 10
  `);
  res.json(rows);
}

export async function getCriticalAlerts(req, res) {
  const rows = await query(`
    SELECT p.id AS patient_id, p.name, p.risk_level, e.id AS encounter_id, e.visit_date
    FROM patients p
    JOIN encounters e ON e.patient_id = p.id
    WHERE p.risk_level = 'high'
    ORDER BY e.visit_date DESC
    LIMIT 20
  `);
  res.json(rows);
}
