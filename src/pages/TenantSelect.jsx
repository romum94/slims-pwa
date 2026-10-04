import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTenants, searchTenants } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function TenantSelect() {
  const [tenants, setTenants] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { selectTenant } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getTenants()
      .then(setTenants)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSearch(e) {
    const value = e.target.value;
    setQuery(value);
    if (value.trim() === '') {
      setLoading(true);
      try {
        setTenants(await getTenants());
      } finally {
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    try {
      setTenants(await searchTenants(value));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handlePick(tenant) {
    selectTenant(tenant);
    navigate('/login');
  }

  return (
    <div className="page">
      <h1>Pilih Perpustakaan</h1>
      <input
        type="text"
        placeholder="Cari nama perpustakaan..."
        value={query}
        onChange={handleSearch}
        className="input"
      />
      {loading && <p>Memuat daftar perpustakaan...</p>}
      {error && <p className="error">Gagal memuat daftar: {error}</p>}
      <ul className="tenant-list">
        {tenants.map((tenant) => (
          <li key={tenant.slug} className="tenant-item" onClick={() => handlePick(tenant)}>
            <span className="tenant-name">{tenant.library_name}</span>
          </li>
        ))}
      </ul>
      {!loading && !error && tenants.length === 0 && <p>Tidak ada perpustakaan ditemukan.</p>}
    </div>
  );
}
