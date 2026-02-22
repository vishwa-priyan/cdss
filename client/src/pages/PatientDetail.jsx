import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function PatientDetail() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/patients/${id}`)
      .then(({ data }) => setPatient(data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  const downloadReport = async (encounterId) => {
    try {
      const token = localStorage.getItem('cdss_token');
      const res = await fetch(`/api/encounters/${encounterId}/report-pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clinical-report-${encounterId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!patient) return <div>Patient not found</div>;

  const aiResult = (enc) => {
    const ar = enc.ai_result;
    if (!ar || !ar.result_json) return null;
    return typeof ar.result_json === 'string' ? JSON.parse(ar.result_json) : ar.result_json;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ marginTop: 0 }}>Patient: {patient.name}</h1>
        <Link to="/patients" className="btn btn-secondary">Back to Records</Link>
      </div>
      <div className="card">
        <p><strong>ID:</strong> {patient.id} &nbsp; <strong>Age:</strong> {patient.age ?? '—'} &nbsp; <strong>Gender:</strong> {patient.gender ?? '—'} &nbsp; <strong>Contact:</strong> {patient.contact ?? '—'}</p>
        <p><strong>Risk Level:</strong> <span className={`badge badge-${patient.risk_level || 'low'}`}>{patient.risk_level || 'low'}</span></p>
      </div>

      <h2>Visit History (Timeline)</h2>
      {patient.encounters?.length === 0 && <p className="empty">No visits yet</p>}
      {patient.encounters?.map((enc) => {
        const ai = aiResult(enc);
        return (
          <div key={enc.id} className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <h3 style={{ marginTop: 0 }}>Visit: {new Date(enc.visit_date).toLocaleDateString()} (Encounter #{enc.id})</h3>
              <button type="button" className="btn btn-secondary" onClick={() => downloadReport(enc.id)}>Download Report (PDF)</button>
            </div>
            <p><strong>Chief Complaint:</strong> {enc.chief_complaint || '—'}</p>
            <p><strong>Doctor Notes:</strong> {enc.doctor_notes || '—'}</p>
            {enc.follow_up_date && <p><strong>Follow-up:</strong> {new Date(enc.follow_up_date).toLocaleDateString()}</p>}
            {enc.symptoms?.length > 0 && (
              <p><strong>Symptoms:</strong> {enc.symptoms.map((s) => s.symptom_text).join('; ')}</p>
            )}
            {enc.vitals?.length > 0 && (
              <p><strong>Vitals:</strong> {enc.vitals.map((v) => `BP ${v.blood_pressure_systolic}/${v.blood_pressure_diastolic}, HR ${v.heart_rate}, Temp ${v.temperature}°C`).join(' | ')}</p>
            )}
            {ai && (
              <>
                <p><strong>AI Prediction:</strong> {ai.diseasePrediction?.primary || '—'}</p>
                <p><strong>Differentials:</strong> {Array.isArray(ai.diseasePrediction?.differential) ? ai.diseasePrediction.differential.join(', ') : '—'}</p>
                <p><strong>Suggested Tests:</strong> {Array.isArray(ai.diseasePrediction?.suggestedTests) ? ai.diseasePrediction.suggestedTests.join(', ') : '—'}</p>
                <p><strong>Suggested Medications:</strong> {Array.isArray(ai.diseasePrediction?.suggestedMedications) ? ai.diseasePrediction.suggestedMedications.join(', ') : '—'}</p>
                <p><strong>Confidence:</strong> {ai.confidenceScore != null ? `${(ai.confidenceScore * 100).toFixed(0)}%` : '—'}</p>
                {ai.redFlags?.length > 0 && <p style={{ color: 'var(--color-danger)' }}><strong>Red flags:</strong> {ai.redFlags.join(' ')}</p>}
                <p><strong>Summary:</strong> {ai.explainableSummary || '—'}</p>
              </>
            )}
            {enc.doctor_notes && Array.isArray(enc.doctor_notes) && enc.doctor_notes.length > 0 && (
              <p><strong>Notes:</strong> {enc.doctor_notes.map((n) => n.note_text).join('; ')}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
