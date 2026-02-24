import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingVisit, setSavingVisit] = useState(false);
  const [visitError, setVisitError] = useState('');
  const [newVisit, setNewVisit] = useState({
    visit_date: new Date().toISOString().slice(0, 10),
    chief_complaint: '',
    symptoms: '',
    doctor_notes: '',
    follow_up_date: '',
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    blood_sugar: '',
    heart_rate: '',
    temperature: '',
  });
  const [uploadingId, setUploadingId] = useState(null);
  const [uploadError, setUploadError] = useState('');

  const loadPatient = () => {
    setLoading(true);
    setError('');
    api
      .get(`/patients/${id}`)
      .then(({ data }) => setPatient(data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPatient();
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

  const handleNewVisitChange = (e) => {
    const { name, value } = e.target;
    setNewVisit((v) => ({ ...v, [name]: value }));
  };

  const handleAddVisit = async (e) => {
    e.preventDefault();
    setVisitError('');
    setSavingVisit(true);
    try {
      const payload = {
        ...newVisit,
        blood_pressure_systolic: newVisit.blood_pressure_systolic ? parseInt(newVisit.blood_pressure_systolic, 10) : null,
        blood_pressure_diastolic: newVisit.blood_pressure_diastolic ? parseInt(newVisit.blood_pressure_diastolic, 10) : null,
        blood_sugar: newVisit.blood_sugar ? parseFloat(newVisit.blood_sugar) : null,
        heart_rate: newVisit.heart_rate ? parseInt(newVisit.heart_rate, 10) : null,
        temperature: newVisit.temperature ? parseFloat(newVisit.temperature) : null,
      };
      await api.post(`/patients/${id}/visits`, payload);
      setNewVisit({
        visit_date: new Date().toISOString().slice(0, 10),
        chief_complaint: '',
        symptoms: '',
        doctor_notes: '',
        follow_up_date: '',
        blood_pressure_systolic: '',
        blood_pressure_diastolic: '',
        blood_sugar: '',
        heart_rate: '',
        temperature: '',
      });
      loadPatient();
    } catch (err) {
      setVisitError(err.response?.data?.message || 'Failed to add visit');
    } finally {
      setSavingVisit(false);
    }
  };

  const handleDeletePatient = async () => {
    if (!window.confirm('Delete this patient and all visits? This cannot be undone.')) return;
    try {
      await api.delete(`/patients/${id}`);
      navigate('/patients');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete patient');
    }
  };

  const handleLabUpload = async (encounterId, file) => {
    if (!file) return;
    setUploadingId(encounterId);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('cdss_token');
      await fetch(`/api/upload/lab-report/${encounterId}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      loadPatient();
    } catch (e) {
      setUploadError('Failed to upload lab report');
    } finally {
      setUploadingId(null);
    }
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
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to="/patients" className="btn btn-secondary">Back to Records</Link>
          <Link to={`/patients/${patient.id}/edit`} className="btn btn-secondary">Edit Patient</Link>
          <button type="button" className="btn btn-danger" onClick={handleDeletePatient}>Delete Patient</button>
        </div>
      </div>
      <div className="card">
        <p><strong>ID:</strong> {patient.id} &nbsp; <strong>Age:</strong> {patient.age ?? '—'} &nbsp; <strong>Gender:</strong> {patient.gender ?? '—'} &nbsp; <strong>Contact:</strong> {patient.contact ?? '—'}</p>
        <p><strong>Risk Level:</strong> <span className={`badge badge-${patient.risk_level || 'low'}`}>{patient.risk_level || 'low'}</span></p>
      </div>

      <h2>New Visit</h2>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={handleAddVisit}>
          <div className="form-row">
            <div className="form-group">
              <label>Date of Visit *</label>
              <input name="visit_date" type="date" value={newVisit.visit_date} onChange={handleNewVisitChange} required />
            </div>
            <div className="form-group">
              <label>Follow-up Date</label>
              <input name="follow_up_date" type="date" value={newVisit.follow_up_date} onChange={handleNewVisitChange} />
            </div>
          </div>
          <div className="form-group">
            <label>Chief Complaint</label>
            <input name="chief_complaint" value={newVisit.chief_complaint} onChange={handleNewVisitChange} />
          </div>
          <div className="form-group">
            <label>Symptoms</label>
            <textarea name="symptoms" value={newVisit.symptoms} onChange={handleNewVisitChange} rows={2} />
          </div>
          <div className="form-group">
            <label>Doctor Notes</label>
            <textarea name="doctor_notes" value={newVisit.doctor_notes} onChange={handleNewVisitChange} rows={2} />
          </div>
          <h4>Vitals</h4>
          <div className="form-row">
            <div className="form-group">
              <label>BP Systolic</label>
              <input name="blood_pressure_systolic" type="number" min="0" value={newVisit.blood_pressure_systolic} onChange={handleNewVisitChange} />
            </div>
            <div className="form-group">
              <label>BP Diastolic</label>
              <input name="blood_pressure_diastolic" type="number" min="0" value={newVisit.blood_pressure_diastolic} onChange={handleNewVisitChange} />
            </div>
            <div className="form-group">
              <label>Blood Sugar</label>
              <input name="blood_sugar" type="number" step="0.1" value={newVisit.blood_sugar} onChange={handleNewVisitChange} />
            </div>
            <div className="form-group">
              <label>Heart Rate</label>
              <input name="heart_rate" type="number" min="0" value={newVisit.heart_rate} onChange={handleNewVisitChange} />
            </div>
            <div className="form-group">
              <label>Temperature (°C)</label>
              <input name="temperature" type="number" step="0.1" value={newVisit.temperature} onChange={handleNewVisitChange} />
            </div>
          </div>
          {visitError && <div className="error">{visitError}</div>}
          <button type="submit" className="btn btn-primary" disabled={savingVisit}>
            {savingVisit ? 'Adding Visit...' : 'Add Visit'}
          </button>
        </form>
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
            {enc.lab_reports?.length > 0 && (
              <p>
                <strong>Lab Reports:</strong>{' '}
                {enc.lab_reports.map((r) => (
                  <a
                    key={r.id}
                    href={`/uploads/${r.file_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ marginRight: '0.5rem' }}
                  >
                    {r.file_name}
                  </a>
                ))}
              </p>
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
            <div style={{ marginTop: '0.75rem' }}>
              <label style={{ fontWeight: 600, marginRight: '0.5rem' }}>Upload Lab Report:</label>
              <input
                type="file"
                onChange={(e) => handleLabUpload(enc.id, e.target.files?.[0])}
                style={{ marginRight: '0.5rem' }}
              />
              {uploadingId === enc.id && <span>Uploading...</span>}
              {uploadError && <div className="error" style={{ marginTop: '0.5rem' }}>{uploadError}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
