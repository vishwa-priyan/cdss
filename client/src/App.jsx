import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddPatient from './pages/AddPatient';
import PatientRecords from './pages/PatientRecords';
import PatientDetail from './pages/PatientDetail';
import Encounters from './pages/Encounters';
import EditPatient from './pages/EditPatient';
import AIDiagnosis from './pages/AIDiagnosis';
import LabReports from './pages/LabReports';
import ReportsAnalytics from './pages/ReportsAnalytics';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';

function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="add-patient" element={<ProtectedRoute roles={['admin', 'doctor']}><AddPatient /></ProtectedRoute>} />
        <Route path="patients" element={<PatientRecords />} />
        <Route path="patients/:id" element={<PatientDetail />} />
        <Route path="patients/:id/edit" element={<ProtectedRoute roles={['admin', 'doctor']}><EditPatient /></ProtectedRoute>} />
        <Route path="encounters" element={<Encounters />} />
        <Route path="ai-diagnosis" element={<ProtectedRoute roles={['admin', 'doctor']}><AIDiagnosis /></ProtectedRoute>} />
        <Route path="lab-reports" element={<LabReports />} />
        <Route path="reports" element={<ReportsAnalytics />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const { loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  return <AppRoutes />;
}
