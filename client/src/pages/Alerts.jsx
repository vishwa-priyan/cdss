import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Alerts() {
  const [alerts, setAlerts] = useState({ critical: [], pendingAI: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/alerts')
      .then(({ data }) => setAlerts(data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Alerts</h1>
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          <div className="card">
            <h3 style={{ marginTop: 0, color: 'var(--color-danger)' }}>Critical Cases</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Visit Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.critical?.length === 0 && (
                    <tr>
                      <td colSpan={3} className="empty">No critical alerts</td>
                    </tr>
                  )}
                  {alerts.critical?.map((a) => (
                    <tr key={`c-${a.patient_id}-${a.encounter_id}`}>
                      <td>{a.name}</td>
                      <td>{new Date(a.visit_date).toLocaleDateString()}</td>
                      <td><Link to={`/patients/${a.patient_id}`} className="btn btn-secondary">View</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0, color: 'var(--color-warning)' }}>Pending AI Reviews</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Visit Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.pendingAI?.length === 0 && (
                    <tr>
                      <td colSpan={3} className="empty">No pending AI reviews</td>
                    </tr>
                  )}
                  {alerts.pendingAI?.map((a) => (
                    <tr key={`p-${a.encounter_id}`}>
                      <td>{a.patient_name}</td>
                      <td>{new Date(a.visit_date).toLocaleDateString()}</td>
                      <td><Link to={`/ai-diagnosis?encounterId=${a.encounter_id}`} className="btn btn-primary">Run AI</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
