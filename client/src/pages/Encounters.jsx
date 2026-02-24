import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Encounters() {
  const [encounters, setEncounters] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/encounters', { params: { page: 1, limit: 20 } })
      .then(({ data }) => {
        setEncounters(data.encounters || []);
        setPagination(data.pagination || {});
      })
      .catch((e) => setError(e.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Visits</h1>
      <div className="card">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Patient</th>
                  <th>Visit Date</th>
                  <th>Chief Complaint</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {encounters.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty">No visits</td>
                  </tr>
                )}
                {encounters.map((e) => (
                  <tr key={e.id}>
                    <td>{e.id}</td>
                    <td><Link to={`/patients/${e.patient_id}`}>{e.patient_name}</Link></td>
                    <td>{new Date(e.visit_date).toLocaleDateString()}</td>
                    <td>{e.chief_complaint || '—'}</td>
                    <td>
                      <Link to={`/patients/${e.patient_id}`} className="btn btn-secondary">View Patient</Link>
                      {' '}
                      <Link to={`/ai-diagnosis?encounterId=${e.id}`} className="btn btn-primary">AI Diagnosis</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
