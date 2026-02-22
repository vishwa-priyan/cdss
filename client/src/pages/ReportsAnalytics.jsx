import React, { useState, useEffect } from 'react';
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
import api from '../services/api';

const COLORS = ['#1e5f8a', '#2d7ab8', '#0d9488', '#d97706', '#dc2626'];

export default function ReportsAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/reports/analytics')
      .then((res) => setData(res.data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading analytics...</div>;
  if (error) return <div className="error">{error}</div>;

  const diseaseData = (data?.diseaseDistribution || []).map((d, i) => ({ ...d, fill: COLORS[i % COLORS.length] }));
  const symptomData = data?.mostCommonSymptoms || [];
  const monthlyData = data?.monthlyPatientGrowth || [];

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Reports & Analytics</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{data?.criticalCasePercentage ?? 0}%</div>
          <div style={{ color: 'var(--color-text-muted)' }}>Critical Case %</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{data?.aiUsageAnalytics?.totalRuns ?? 0}</div>
          <div style={{ color: 'var(--color-text-muted)' }}>AI Runs</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{data?.aiUsageAnalytics?.usageRate ?? 0}%</div>
          <div style={{ color: 'var(--color-text-muted)' }}>AI Usage Rate</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Disease Distribution</h3>
          {diseaseData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={diseaseData}>
                <XAxis dataKey="disease" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="empty">No disease data yet</p>
          )}
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Monthly Patient Growth</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="var(--color-primary-light)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="empty">No growth data yet</p>
          )}
        </div>
      </div>
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ marginTop: 0 }}>Most Common Symptoms</h3>
        {symptomData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={symptomData} layout="vertical" margin={{ left: 100 }}>
              <XAxis type="number" />
              <YAxis type="category" dataKey="symptom" width={90} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="empty">No symptom data yet</p>
        )}
      </div>
    </div>
  );
}
