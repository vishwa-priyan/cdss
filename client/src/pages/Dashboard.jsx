import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#0d9488', '#d97706', '#dc2626'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/dashboard/recent-patients'),
      api.get('/dashboard/critical-alerts'),
    ])
      .then(([s, r, a]) => {
        setStats(s.data);
        setRecent(r.data);
        setAlerts(a.data);
      })
      .catch((e) => setError(e.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error">{error}</div>;

  const riskData = stats?.riskSummary
    ? [
        { name: 'Low', value: stats.riskSummary.low || 0, fill: COLORS[0] },
        { name: 'Medium', value: stats.riskSummary.medium || 0, fill: COLORS[1] },
        { name: 'High', value: stats.riskSummary.high || 0, fill: COLORS[2] },
      ].filter((d) => d.value > 0)
    : [];
  const confidenceData = Array.isArray(stats?.confidenceDistribution)
    ? stats.confidenceDistribution.map((d) => ({ name: d.band, count: d.count }))
    : [];

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>{stats?.totalPatients ?? 0}</div>
          <div style={{ color: 'var(--color-text-muted)' }}>Total Patients</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>{stats?.todaysVisits ?? 0}</div>
          <div style={{ color: 'var(--color-text-muted)' }}>Today's Visits</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-danger)' }}>{stats?.criticalCases ?? 0}</div>
          <div style={{ color: 'var(--color-text-muted)' }}>Critical Cases</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-warning)' }}>{stats?.pendingAIReviews ?? 0}</div>
          <div style={{ color: 'var(--color-text-muted)' }}>Pending AI Reviews</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Risk Level Summary</h3>
          {riskData.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={riskData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {riskData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="empty">No risk data yet</p>
          )}
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>AI Confidence Distribution</h3>
          {confidenceData.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={confidenceData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="empty">No AI results yet</p>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Recent Patients</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Risk</th>
                  <th>Last Visit</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty">No patients yet</td>
                  </tr>
                )}
                {recent.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td><span className={`badge badge-${p.risk_level || 'low'}`}>{p.risk_level || 'low'}</span></td>
                    <td>{p.last_visit ? new Date(p.last_visit).toLocaleDateString() : '—'}</td>
                    <td><Link to={`/patients/${p.id}`}>View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Critical Alerts</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {alerts.length === 0 && <li className="empty">No critical alerts</li>}
            {alerts.slice(0, 8).map((a) => (
              <li key={`${a.patient_id}-${a.encounter_id}`} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                <Link to={`/patients/${a.patient_id}`}>{a.name}</Link> — {new Date(a.visit_date).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
