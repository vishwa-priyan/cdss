import { body, validationResult } from 'express-validator';
import { query } from '../config/db.js';
import { getConnection } from '../config/db.js';

export async function list(req, res) {
  const search = req.query.search || '';
  const disease = req.query.disease || '';
  const dateFrom = req.query.dateFrom || '';
  const dateTo = req.query.dateTo || '';
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const offset = (page - 1) * limit;

  let where = '1=1';
  const params = [];
  if (search) {
    where += ' AND p.name LIKE ?';
    params.push(`%${search}%`);
  }
  if (dateFrom) {
    where += ' AND (SELECT MAX(e.visit_date) FROM encounters e WHERE e.patient_id = p.id) >= ?';
    params.push(dateFrom);
  }
  if (dateTo) {
    where += ' AND (SELECT MAX(e.visit_date) FROM encounters e WHERE e.patient_id = p.id) <= ?';
    params.push(dateTo);
  }

  let listSql = `
    SELECT p.id, p.name, p.age, p.gender, p.risk_level, p.created_at,
           (SELECT MAX(e.visit_date) FROM encounters e WHERE e.patient_id = p.id) AS last_visit_date
    FROM patients p
    WHERE ${where}
    ORDER BY last_visit_date IS NULL, last_visit_date DESC, p.id DESC
  `;
  let rows = await query(listSql, params);

  if (disease) {
    const withDisease = [];
    for (const row of rows) {
      const ai = await query(
        'SELECT result_json FROM ai_results ar JOIN encounters e ON e.id = ar.encounter_id WHERE e.patient_id = ?',
        [row.id]
      );
      const hasDisease = ai.some((a) => a.result_json && JSON.stringify(a.result_json).toLowerCase().includes(disease.toLowerCase()));
      if (hasDisease) withDisease.push(row);
    }
    const total = withDisease.length;
    rows = withDisease.slice(offset, offset + limit);
    return res.json({
      patients: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  }

  const [countRow] = await query(`SELECT COUNT(DISTINCT p.id) AS total FROM patients p WHERE ${where}`, params);
  const total = countRow.total;
  const listSqlPaginated = listSql + ' LIMIT ? OFFSET ?';
  rows = await query(listSqlPaginated, [...params, limit, offset]);
  res.json({
    patients: rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  });
}

export async function create(req, res) {
  const {
    name,
    age,
    gender,
    contact,
    chief_complaint,
    past_medical_history,
    current_medications,
    allergies,
    risk_level,
    visit_date,
    doctor_notes,
    follow_up_date,
    symptoms,
    blood_pressure_systolic,
    blood_pressure_diastolic,
    blood_sugar,
    heart_rate,
    temperature,
  } = req.body;
  if (!name || !visit_date) {
    return res.status(400).json({ message: 'Name and visit date are required' });
  }
  const conn = await getConnection();
  try {
    await conn.beginTransaction();
    const [insertPatient] = await conn.execute(
      `INSERT INTO patients (name, age, gender, contact, chief_complaint, past_medical_history, current_medications, allergies, risk_level)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        age || null,
        gender || null,
        contact || null,
        chief_complaint || null,
        past_medical_history || null,
        current_medications || null,
        allergies || null,
        risk_level || 'low',
      ]
    );
    const patientId = insertPatient.insertId;
    const [insertEnc] = await conn.execute(
      'INSERT INTO encounters (patient_id, visit_date, chief_complaint, doctor_notes, follow_up_date, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [patientId, visit_date, chief_complaint || null, doctor_notes || null, follow_up_date || null, req.user.id]
    );
    const encounterId = insertEnc.insertId;
    if (symptoms) {
      await conn.execute('INSERT INTO symptoms (encounter_id, symptom_text) VALUES (?, ?)', [encounterId, symptoms]);
    }
    if (
      blood_pressure_systolic != null ||
      blood_pressure_diastolic != null ||
      blood_sugar != null ||
      heart_rate != null ||
      temperature != null
    ) {
      await conn.execute(
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
    }
    await conn.commit();
    const [patient] = await query('SELECT * FROM patients WHERE id = ?', [patientId]);
    res.status(201).json({ patient, encounterId });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

export async function getById(req, res) {
  const id = req.params.id;
  const [patient] = await query('SELECT * FROM patients WHERE id = ?', [id]);
  if (!patient) return res.status(404).json({ message: 'Patient not found' });
  const encounters = await query(
    'SELECT e.*, u.name AS created_by_name FROM encounters e LEFT JOIN users u ON u.id = e.created_by WHERE e.patient_id = ? ORDER BY e.visit_date DESC',
    [id]
  );
  for (const enc of encounters) {
    enc.vitals = await query('SELECT * FROM vitals WHERE encounter_id = ? ORDER BY recorded_at DESC', [enc.id]);
    enc.symptoms = await query('SELECT * FROM symptoms WHERE encounter_id = ?', [enc.id]);
    enc.lab_reports = await query('SELECT * FROM lab_reports WHERE encounter_id = ?', [enc.id]);
    const [ar] = await query('SELECT * FROM ai_results WHERE encounter_id = ?', [enc.id]);
    enc.ai_result = ar || null;
    enc.doctor_notes = await query(
      'SELECT dn.*, u.name AS created_by_name FROM doctor_notes dn LEFT JOIN users u ON u.id = dn.created_by WHERE dn.encounter_id = ?',
      [enc.id]
    );
  }
  res.json({ ...patient, encounters });
}

export async function update(req, res) {
  const id = req.params.id;
  const { name, age, gender, contact, chief_complaint, past_medical_history, current_medications, allergies, risk_level } = req.body;
  const [patient] = await query('SELECT id FROM patients WHERE id = ?', [id]);
  if (!patient) return res.status(404).json({ message: 'Patient not found' });
  await query(
    `UPDATE patients SET name=COALESCE(?,name), age=COALESCE(?,age), gender=COALESCE(?,gender), contact=COALESCE(?,contact),
     chief_complaint=COALESCE(?,chief_complaint), past_medical_history=COALESCE(?,past_medical_history),
     current_medications=COALESCE(?,current_medications), allergies=COALESCE(?,allergies), risk_level=COALESCE(?,risk_level)
     WHERE id=?`,
    [name, age, gender, contact, chief_complaint, past_medical_history, current_medications, allergies, risk_level, id]
  );
  const [updated] = await query('SELECT * FROM patients WHERE id = ?', [id]);
  res.json(updated);
}

export async function listEncounters(req, res) {
  const patientId = req.params.patientId;
  const [p] = await query('SELECT id FROM patients WHERE id = ?', [patientId]);
  if (!p) return res.status(404).json({ message: 'Patient not found' });
  const encounters = await query(
    'SELECT e.*, u.name AS created_by_name FROM encounters e LEFT JOIN users u ON u.id = e.created_by WHERE e.patient_id = ? ORDER BY e.visit_date DESC',
    [patientId]
  );
  res.json(encounters);
}

export async function createEncounter(req, res) {
  const patientId = req.params.patientId;
  const { visit_date, chief_complaint, doctor_notes, follow_up_date } = req.body;
  if (!visit_date) return res.status(400).json({ message: 'visit_date is required' });
  const [p] = await query('SELECT id FROM patients WHERE id = ?', [patientId]);
  if (!p) return res.status(404).json({ message: 'Patient not found' });
  const [result] = await query(
    'INSERT INTO encounters (patient_id, visit_date, chief_complaint, doctor_notes, follow_up_date, created_by) VALUES (?, ?, ?, ?, ?, ?)',
    [patientId, visit_date, chief_complaint || null, doctor_notes || null, follow_up_date || null, req.user.id]
  );
  const [encounter] = await query('SELECT * FROM encounters WHERE id = ?', [result.insertId]);
  res.status(201).json(encounter);
}
