import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function EditPatient() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: '',
    contact: '',
    chief_complaint: '',
    past_medical_history: '',
    current_medications: '',
    allergies: '',
    risk_level: 'low',
  });

  useEffect(() => {
    setLoading(true);
    api
      .get(`/patients/${id}`)
      .then(({ data }) => {
        setForm({
          name: data.name || '',
          age: data.age != null ? String(data.age) : '',
          gender: data.gender || '',
          contact: data.contact || '',
          chief_complaint: data.chief_complaint || '',
          past_medical_history: data.past_medical_history || '',
          current_medications: data.current_medications || '',
          allergies: data.allergies || '',
          risk_level: data.risk_level || 'low',
        });
      })
      .catch((e) => setError(e.response?.data?.message || 'Failed to load patient'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        ...form,
        age: form.age ? parseInt(form.age, 10) : null,
      };
      await api.put(`/patients/${id}`, payload);
      navigate(`/patients/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update patient');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ marginTop: 0 }}>Edit Patient</h1>
        <Link to={`/patients/${id}`} className="btn btn-secondary">Back to Details</Link>
      </div>
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

          <h3>Risk</h3>
          <div className="form-group">
            <label>Risk Level</label>
            <select name="risk_level" value={form.risk_level} onChange={handleChange}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {error && <div className="error">{error}</div>}
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

