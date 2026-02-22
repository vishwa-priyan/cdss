import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import debounce from '../utils/debounce';

export default function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    try {
      const { data } = await api.get('/patients', { params: { search: q, limit: 8 } });
      setResults(data.patients || []);
    } catch {
      setResults([]);
    }
  }, []);

  const debouncedSearch = React.useMemo(() => debounce(doSearch, 300), [doSearch]);

  const handleSearchChange = (e) => {
    const v = e.target.value;
    setSearch(v);
    debouncedSearch(v);
    setSearchOpen(!!v);
  };

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 2rem',
        background: 'var(--color-surface)',
        boxShadow: 'var(--shadow-sm)',
        gap: '1rem',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ position: 'relative', flex: '1', maxWidth: 400 }}>
        <input
          type="search"
          placeholder="Search patients..."
          value={search}
          onChange={handleSearchChange}
          onFocus={() => setSearchOpen(!!search)}
          onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
          style={{
            width: '100%',
            padding: '0.5rem 1rem',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            fontSize: '0.95rem',
          }}
        />
        {searchOpen && results.length > 0 && (
          <ul
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              margin: 0,
              padding: 0,
              listStyle: 'none',
              background: 'var(--color-surface)',
              boxShadow: 'var(--shadow)',
              borderRadius: 'var(--radius)',
              zIndex: 10,
              maxHeight: 300,
              overflow: 'auto',
            }}
          >
            {results.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    navigate(`/patients/${p.id}`);
                    setSearch('');
                    setSearchOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.6rem 1rem',
                    textAlign: 'left',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {p.name} (ID: {p.id})
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ padding: '0.4rem 0.6rem', minWidth: 'auto' }}
          title="Notifications"
        >
          <span aria-hidden>🔔</span>
        </button>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          {user?.name || user?.email}
        </span>
        <span style={{ color: 'var(--color-border)' }}>|</span>
        <button type="button" className="btn btn-secondary" onClick={logout}>
          Logout
        </button>
      </div>
    </header>
  );
}
