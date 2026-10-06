import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Dashboard() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  const displayName =
    session.role === 'staff' ? session.user?.realname : session.user?.m_name;

  return (
    <div className="page">
      <header className="dashboard-header">
        <div>
          <h1>{session.tenant.library_name}</h1>
          <p>
            Masuk sebagai {displayName} ({session.role === 'staff' ? 'Pustakawan' : 'Anggota'})
          </p>
        </div>
        <button className="button secondary" onClick={handleLogout} type="button">
          Keluar
        </button>
      </header>

      {session.role === 'staff' && (
        <button className="button" type="button" onClick={() => navigate('/dashboard/scan-isbn')}>
          Scan ISBN
        </button>
      )}

      {session.role !== 'staff' && (
        <p className="placeholder-note">Fitur anggota belum ditambahkan di skeleton ini.</p>
      )}
    </div>
  );
}
