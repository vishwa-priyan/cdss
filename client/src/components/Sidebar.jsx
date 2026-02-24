import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/add-patient', label: 'Add Patient', roles: ['admin', 'doctor'] },
  { to: '/patients', label: 'Patient Records' },
  { to: '/encounters', label: 'Visits' },
  { to: '/ai-diagnosis', label: 'AI Diagnosis', roles: ['admin', 'doctor'] },
  { to: '/lab-reports', label: 'Lab Reports' },
  { to: '/reports', label: 'Reports & Analytics' },
  { to: '/alerts', label: 'Alerts' },
  { to: '/settings', label: 'Settings' },
];

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  const filtered = navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role);
  });

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        minHeight: '100vh',
        background: 'var(--color-surface)',
        boxShadow: 'var(--shadow)',
        padding: '1rem 0',
      }}
    >
      <div style={{ padding: '0 1rem', marginBottom: '1.5rem' }}>
        <strong style={{ color: 'var(--color-primary)', fontSize: '1.1rem' }}>CDSS</strong>
      </div>
      <nav>
        {filtered.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            style={({ isActive }) => ({
              display: 'block',
              padding: '0.6rem 1.25rem',
              color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontWeight: isActive ? 600 : 500,
              borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
              background: isActive ? 'var(--color-accent)' : 'transparent',
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
