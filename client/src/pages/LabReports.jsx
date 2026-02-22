import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function LabReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/lab-reports')
      .then(({ data }) => setReports(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Lab Reports</h1>
      <div className="card">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Encounter</th>
                  <th>Patient</th>
                  <th>Visit Date</th>
                  <th>File</th>
                  <th>Uploaded</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty">No lab reports uploaded</td>
                  </tr>
                )}
                {reports.map((r) => (
                  <tr key={r.id}>
                    <td><Link to={`/patients/${r.patient_id}`}>#{r.encounter_id}</Link></td>
                    <td>{r.patient_name}</td>
                    <td>{r.visit_date ? new Date(r.visit_date).toLocaleDateString() : '—'}</td>
                    <td>{r.file_name}</td>
                    <td>{r.uploaded_at ? new Date(r.uploaded_at).toLocaleDateString() : '—'}</td>
                    <td>
                      <a href={`/uploads/${r.file_path}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                        View / Download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
        Upload lab reports via Add Patient or when editing an encounter.
      </p>
    </div>
  );
}
