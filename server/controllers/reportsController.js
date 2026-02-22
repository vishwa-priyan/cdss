import { query } from '../config/db.js';

export async function getAnalytics(req, res) {
  const diseaseDist = await query(`
    SELECT JSON_UNQUOTE(JSON_EXTRACT(result_json, '$.diseasePrediction.primary')) AS disease, COUNT(*) AS count
    FROM ai_results
    WHERE result_json IS NOT NULL AND JSON_EXTRACT(result_json, '$.diseasePrediction.primary') IS NOT NULL
    GROUP BY disease
    ORDER BY count DESC
    LIMIT 10
  `).catch(() => []);

  const monthlyGrowth = await query(`
    SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS count
    FROM patients
    GROUP BY month
    ORDER BY month
    LIMIT 12
  `);

  const [criticalPct] = await query(`
    SELECT (SELECT COUNT(*) FROM patients WHERE risk_level = 'high') AS critical,
           (SELECT COUNT(*) FROM patients) AS total
  `);
  const criticalCasePercentage = criticalPct.total ? ((criticalPct.critical / criticalPct.total) * 100).toFixed(1) : 0;

  const [aiUsage] = await query(`
    SELECT COUNT(*) AS total_ai_runs FROM ai_results
  `);
  const [encountersCount] = await query('SELECT COUNT(*) AS total FROM encounters');
  const aiUsageAnalytics = {
    totalRuns: aiUsage.total_ai_runs,
    totalEncounters: encountersCount.total,
    usageRate: encountersCount.total ? ((aiUsage.total_ai_runs / encountersCount.total) * 100).toFixed(1) : 0,
  };

  const symptomsRaw = await query(`
    SELECT symptom_text FROM symptoms WHERE symptom_text IS NOT NULL AND symptom_text != ''
  `);
  const symptomCounts = {};
  symptomsRaw.forEach((r) => {
    const parts = (r.symptom_text || '').split(/[,;]/).map((s) => s.trim().toLowerCase()).filter(Boolean);
    parts.forEach((s) => (symptomCounts[s] = (symptomCounts[s] || 0) + 1));
  });
  const mostCommonSymptoms = Object.entries(symptomCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([symptom, count]) => ({ symptom, count }));

  res.json({
    diseaseDistribution: diseaseDist,
    monthlyPatientGrowth: monthlyGrowth,
    criticalCasePercentage: parseFloat(criticalCasePercentage),
    aiUsageAnalytics,
    mostCommonSymptoms,
  });
}
