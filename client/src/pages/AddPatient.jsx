import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function AddPatient() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: '',
    contact: '',
    chief_complaint: '',
    symptoms: '',
    past_medical_history: '',
    current_medications: '',
    allergies: '',
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    blood_sugar: '',
    heart_rate: '',
    temperature: '',
    visit_date: new Date().toISOString().slice(0, 10),
    doctor_notes: '',
    follow_up_date: '',
    risk_level: 'low',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        age: form.age ? parseInt(form.age, 10) : null,
        blood_pressure_systolic: form.blood_pressure_systolic ? parseInt(form.blood_pressure_systolic, 10) : null,
        blood_pressure_diastolic: form.blood_pressure_diastolic ? parseInt(form.blood_pressure_diastolic, 10) : null,
        blood_sugar: form.blood_sugar ? parseFloat(form.blood_sugar) : null,
        heart_rate: form.heart_rate ? parseInt(form.heart_rate, 10) : null,
        temperature: form.temperature ? parseFloat(form.temperature) : null,
      };
      const { data } = await api.post('/patients', payload);
      navigate(`/patients/${data.patient.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Add Patient</h1>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <h3 style={{ marginTop: 0 }}>Demographics</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Name *</label>
              <input name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Age</label>
              <input name="age" type="number" min="0" value={form.age} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange}>
                <option value="">—</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Contact</label>
              <input name="contact" value={form.contact} onChange={handleChange} />
            </div>
          </div>

          <h3>Clinical</h3>
          <div className="form-group">
            <label>Chief Complaint</label>
            <input name="chief_complaint" value={form.chief_complaint} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Symptoms</label>
            <textarea name="symptoms" value={form.symptoms} onChange={handleChange} rows={3} />
          </div>
          <div className="form-group">
            <label>Past Medical History</label>
            <textarea name="past_medical_history" value={form.past_medical_history} onChange={handleChange} rows={2} />
          </div>
          <div className="form-group">
            <label>Current Medications</label>
            <textarea name="current_medications" value={form.current_medications} onChange={handleChange} rows={2} />
          </div>
          <div className="form-group">
            <label>Allergies</label>
            <input name="allergies" value={form.allergies} onChange={handleChange} />
          </div>

          <h3>Vitals</h3>
          <div className="form-row">
            <div className="form-group">
              <label>BP Systolic</label>
              <input name="blood_pressure_systolic" type="number" min="0" value={form.blood_pressure_systolic} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>BP Diastolic</label>
              <input name="blood_pressure_diastolic" type="number" min="0" value={form.blood_pressure_diastolic} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Blood Sugar</label>
              <input name="blood_sugar" type="number" step="0.1" value={form.blood_sugar} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Heart Rate</label>
              <input name="heart_rate" type="number" min="0" value={form.heart_rate} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Temperature (°C)</label>
              <input name="temperature" type="number" step="0.1" value={form.temperature} onChange={handleChange} />
            </div>
          </div>

          <h3>Visit</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Date of Visit *</label>
              <input name="visit_date" type="date" value={form.visit_date} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Risk Level</label>
              <select name="risk_level" value={form.risk_level} onChange={handleChange}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="form-group">
              <label>Follow-up Date</label>
              <input name="follow_up_date" type="date" value={form.follow_up_date} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label>Doctor Notes</label>
            <textarea name="doctor_notes" value={form.doctor_notes} onChange={handleChange} rows={3} />
          </div>

          {error && <div className="error">{error}</div>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}
