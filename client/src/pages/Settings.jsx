import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Settings() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'nurse' });
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      api.get('/settings/users')
        .then(({ data }) => setUsers(Array.isArray(data) ? data : []))
        .catch((e) => setError(e.response?.data?.message || 'Failed to load'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const handleCreateUser = (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    api.post('/settings/users', form)
      .then(() => {
        setForm({ email: '', password: '', name: '', role: 'nurse' });
        return api.get('/settings/users');
      })
      .then(({ data }) => setUsers(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.response?.data?.message || 'Failed to create user'))
      .finally(() => setSaving(false));
  };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Settings</h1>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Profile</h3>
        <p><strong>Name:</strong> {user?.name} &nbsp; <strong>Email:</strong> {user?.email} &nbsp; <strong>Role:</strong> {user?.role}</p>
      </div>
      {isAdmin && (
        <>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>User Management</h3>
            <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required
                  minLength={6}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Role</label>
                <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                  <option value="admin">Admin</option>
                  <option value="doctor">Doctor</option>
                  <option value="nurse">Nurse</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0, display: 'flex', alignItems: 'flex-end' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Adding...' : 'Add User'}</button>
              </div>
            </form>
            {error && <div className="error">{error}</div>}
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.email}</td>
                      <td>{u.name}</td>
                      <td>{u.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      {!isAdmin && <p style={{ color: 'var(--color-text-muted)' }}>User management is available to administrators only.</p>}
    </div>
  );
}
