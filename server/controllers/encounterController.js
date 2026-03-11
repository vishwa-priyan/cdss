import PDFDocument from 'pdfkit';
import { query } from '../config/db.js';
import { runAIDiagnosis as runAI } from '../services/aiDiagnosisService.js';

export async function list(req, res) {
  const patientId = req.query.patientId;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  if (patientId) {
    const safeLimit = Number(limit);
    const safeOffset = Number(offset);

    const encounters = await query(
      `SELECT e.*, p.name AS patient_name 
      FROM encounters e 
      JOIN patients p ON p.id = e.patient_id 
      WHERE e.patient_id = ?
      ORDER BY e.visit_date DESC 
      LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      [patientId]
    );
    const [c] = await query('SELECT COUNT(*) AS total FROM encounters WHERE patient_id = ?', [patientId]);
    return res.json({
      encounters,
      pagination: { page, limit, total: c.total, totalPages: Math.ceil(c.total / limit) },
    });
  }

  const safeLimit = Number(limit);
  const safeOffset = Number(offset);

  const encounters = await query(
    `SELECT e.*, p.name AS patient_name, p.id AS patient_id 
    FROM encounters e 
    JOIN patients p ON p.id = e.patient_id
    ORDER BY e.visit_date DESC 
    LIMIT ${safeLimit} OFFSET ${safeOffset}`
  );
  const [c] = await query('SELECT COUNT(*) AS total FROM encounters');
  res.json({
    encounters,
    pagination: { page, limit, total: c.total, totalPages: Math.ceil(c.total / limit) },
  });
}

export async function getById(req, res) {
  const id = req.params.id;
  const [encounter] = await query(
    'SELECT e.*, p.name AS patient_name, p.id AS patient_id FROM encounters e JOIN patients p ON p.id = e.patient_id WHERE e.id = ?',
    [id]
  );
  if (!encounter) return res.status(404).json({ message: 'Visit not found' });
  encounter.vitals = await query('SELECT * FROM vitals WHERE encounter_id = ?', [id]);
  encounter.symptoms = await query('SELECT * FROM symptoms WHERE encounter_id = ?', [id]);
  encounter.lab_reports = await query('SELECT * FROM lab_reports WHERE encounter_id = ?', [id]);
  const [ar] = await query('SELECT * FROM ai_results WHERE encounter_id = ?', [id]);
  encounter.ai_result = ar || null;
  encounter.doctor_notes = await query(
    'SELECT dn.*, u.name AS created_by_name FROM doctor_notes dn LEFT JOIN users u ON u.id = dn.created_by WHERE dn.encounter_id = ?',
    [id]
  );
  res.json(encounter);
}

export async function addVitals(req, res) {
  const encounterId = req.params.encounterId;
  const { blood_pressure_systolic, blood_pressure_diastolic, blood_sugar, heart_rate, temperature } = req.body;
  const [e] = await query('SELECT id FROM encounters WHERE id = ?', [encounterId]);
  if (!e) return res.status(404).json({ message: 'Encounter not found' });
  await query(
    `INSERT INTO vitals (encounter_id, blood_pressure_systolic, blood_pressure_diastolic, blood_sugar, heart_rate, temperature)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      encounterId,
      blood_pressure_systolic || null,
      blood_pressure_diastolic || null,
      blood_sugar || null,
      heart_rate || null,
      temperature || null,
    ]
  );
  const [vital] = await query('SELECT * FROM vitals WHERE encounter_id = ? ORDER BY id DESC LIMIT 1', [encounterId]);
  res.status(201).json(vital);
}

export async function addSymptoms(req, res) {
  const encounterId = req.params.encounterId;
  const { symptom_text } = req.body;
  const [e] = await query('SELECT id FROM encounters WHERE id = ?', [encounterId]);
  if (!e) return res.status(404).json({ message: 'Encounter not found' });
  await query('INSERT INTO symptoms (encounter_id, symptom_text) VALUES (?, ?)', [encounterId, symptom_text || '']);
  const [s] = await query('SELECT * FROM symptoms WHERE encounter_id = ? ORDER BY id DESC LIMIT 1', [encounterId]);
  res.status(201).json(s);
}

export async function addDoctorNote(req, res) {
  const encounterId = req.params.encounterId;
  const { note_text } = req.body;
  if (!note_text || !note_text.trim()) return res.status(400).json({ message: 'note_text is required' });
  const [e] = await query('SELECT id FROM encounters WHERE id = ?', [encounterId]);
  if (!e) return res.status(404).json({ message: 'Encounter not found' });
  await query('INSERT INTO doctor_notes (encounter_id, note_text, created_by) VALUES (?, ?, ?)', [
    encounterId,
    note_text.trim(),
    req.user.id,
  ]);
  const [n] = await query(
    'SELECT dn.*, u.name AS created_by_name FROM doctor_notes dn LEFT JOIN users u ON u.id = dn.created_by WHERE dn.encounter_id = ? ORDER BY dn.id DESC LIMIT 1',
    [encounterId]
  );
  res.status(201).json(n);
}

export async function runAIDiagnosis(req, res) {
  const encounterId = req.params.encounterId;
  const encRows = await query(
    'SELECT e.*, (SELECT symptom_text FROM symptoms WHERE encounter_id = e.id LIMIT 1) AS symptom_text FROM encounters e WHERE e.id = ?',
    [encounterId]
  );
  const encounter = encRows[0];
  if (!encounter) return res.status(404).json({ message: 'Encounter not found' });
  const mlInputs = req.body?.mlInputs || {};
  const result = await runAI(encounter, mlInputs);
  await query('INSERT INTO ai_results (encounter_id, result_json) VALUES (?, ?) ON DUPLICATE KEY UPDATE result_json = VALUES(result_json)', [
    encounterId,
    JSON.stringify(result),
  ]);
  res.json(result);
}

export async function getReportPdf(req, res) {
  const id = req.params.id;
  const [encounter] = await query(
    'SELECT e.*, p.name AS patient_name, p.age, p.gender, p.contact FROM encounters e JOIN patients p ON p.id = e.patient_id WHERE e.id = ?',
    [id]
  );
  if (!encounter) return res.status(404).json({ message: 'Visit not found' });
  const vitals = await query('SELECT * FROM vitals WHERE encounter_id = ?', [id]);
  const symptoms = await query('SELECT * FROM symptoms WHERE encounter_id = ?', [id]);
  const [ar] = await query('SELECT result_json FROM ai_results WHERE encounter_id = ?', [id]);
  const ai = ar ? (typeof ar.result_json === 'string' ? JSON.parse(ar.result_json) : ar.result_json) : null;

  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="clinical-report-${id}.pdf"`);
  doc.pipe(res);

  doc.fontSize(18).text('Clinical Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Patient: ${encounter.patient_name}  |  Visit: ${encounter.visit_date}  |  Visit #${id}`);
  doc.moveDown();
  doc.text(`Chief Complaint: ${encounter.chief_complaint || '—'}`);
  doc.text(`Doctor Notes: ${encounter.doctor_notes || '—'}`);
  doc.moveDown();
  if (vitals.length) {
    doc.fontSize(14).text('Vitals');
    vitals.forEach((v) => {
      doc.fontSize(10).text(`BP: ${v.blood_pressure_systolic || '—'}/${v.blood_pressure_diastolic || '—'}  Blood Sugar: ${v.blood_sugar || '—'}  HR: ${v.heart_rate || '—'}  Temp: ${v.temperature || '—'}°C`);
    });
    doc.moveDown();
  }
  if (symptoms.length) {
    doc.fontSize(14).text('Symptoms');
    symptoms.forEach((s) => doc.fontSize(10).text(s.symptom_text || '—'));
    doc.moveDown();
  }
  if (ai) {
    doc.fontSize(14).text('AI Summary');
    doc.fontSize(10).text(ai.explainableSummary || '—');
    if (ai.diseasePrediction?.primary) doc.text(`Primary: ${ai.diseasePrediction.primary}`);
    if (ai.confidenceScore != null) doc.text(`Confidence: ${(ai.confidenceScore * 100).toFixed(0)}%`);
  }
  doc.end();
}
