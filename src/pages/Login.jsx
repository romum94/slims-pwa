import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { pendingTenant, login } = useAuth();
  const [role, setRole] = useState('member');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  if (!pendingTenant) {
    // Langsung ke halaman pilih perpustakaan kalau user masuk ke /login tanpa pilih tenant dulu
    // (misalnya refresh browser di halaman ini).
    navigate('/', { replace: true });
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(role, username, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.status === 401 ? 'Username atau password salah.' : err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <h1>{pendingTenant.library_name}</h1>
      <div className="tabs">
        <button
          className={role === 'member' ? 'tab active' : 'tab'}
          onClick={() => setRole('member')}
          type="button"
        >
          Anggota
        </button>
        <button
          className={role === 'staff' ? 'tab active' : 'tab'}
          onClick={() => setRole('staff')}
          type="button"
        >
          Pustakawan
        </button>
      </div>
      <form onSubmit={handleSubmit} className="form">
        <label>
          {role === 'member' ? 'ID Anggota' : 'Username'}
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="button" disabled={submitting}>
          {submitting ? 'Masuk...' : 'Masuk'}
        </button>
      </form>
    </div>
  );
}
