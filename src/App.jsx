import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import TenantSelect from './pages/TenantSelect.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ScanIsbn from './pages/ScanIsbn.jsx';
import { useAuth } from './context/AuthContext.jsx';

function RequireAuth({ children }) {
  const { session } = useAuth();
  if (!session) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function RequireStaff({ children }) {
  const { session } = useAuth();
  if (!session) {
    return <Navigate to="/" replace />;
  }
  if (session.role !== 'staff') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<TenantSelect />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard/scan-isbn"
        element={
          <RequireStaff>
            <ScanIsbn />
          </RequireStaff>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
