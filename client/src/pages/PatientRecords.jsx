import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function PatientRecords() {
  const [patients, setPatients] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = (p = page) => {
    setLoading(true);
    api
      .get('/patients', {
        params: { search, dateFrom, dateTo, page: p, limit: 10 },
      })
      .then(({ data }) => {
        setPatients(data.patients);
        setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
      })
      .catch((e) => setError(e.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(page);
  }, [page]);

  const handleSearch = (e) => {
    e?.preventDefault();
    setPage(1);
    load(1);
  };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Patient Records</h1>
      <div className="card">
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0, minWidth: 200 }}>
            <label>Search by name</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name..."
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Date from</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Date to</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
      </div>
      <div className="card">
        <div className="table-wrap">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Patient ID</th>
                    <th>Name</th>
                    <th>Last Visit Date</th>
                    <th>Risk Level</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {patients.length === 0 && (
                    <tr>
                      <td colSpan={5} className="empty">No patients found</td>
                    </tr>
                  )}
                  {patients.map((p) => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td>{p.name}</td>
                      <td>{p.last_visit_date ? new Date(p.last_visit_date).toLocaleDateString() : '—'}</td>
                      <td><span className={`badge badge-${p.risk_level || 'low'}`}>{p.risk_level || 'low'}</span></td>
                      <td><Link to={`/patients/${p.id}`} className="btn btn-secondary">View Details</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pagination.totalPages > 1 && (
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </button>
                  <span>Page {pagination.page} of {pagination.totalPages}</span>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
