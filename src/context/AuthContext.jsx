import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { loginMember, loginStaff } from '../api/client.js';

const STORAGE_KEY = 'slims_pwa_session';

const AuthContext = createContext(null);

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(session) {
  try {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // localStorage tidak tersedia (mode private browsing dkk) - sesi cuma hidup di memori,
    // user harus login ulang tiap buka app baru. Tidak fatal, cuma kurang nyaman.
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadSession);
  // Tenant yang sedang dipilih tapi belum login (di halaman Login) - terpisah dari session.
  const [pendingTenant, setPendingTenant] = useState(null);

  useEffect(() => {
    saveSession(session);
  }, [session]);

  const selectTenant = useCallback((tenant) => {
    setPendingTenant(tenant);
  }, []);

  const login = useCallback(
    async (role, username, password) => {
      if (!pendingTenant) {
        throw new Error('Pilih perpustakaan dulu sebelum login.');
      }
      const data =
        role === 'staff'
          ? await loginStaff(pendingTenant.base_url, username, password)
          : await loginMember(pendingTenant.base_url, username, password);

      const newSession = {
        tenant: pendingTenant,
        role,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        user: role === 'staff' ? data.staff : data.member,
      };
      setSession(newSession);
      setPendingTenant(null);
      return newSession;
    },
    [pendingTenant]
  );

  const logout = useCallback(() => {
    setSession(null);
  }, []);

  // Dipanggil dari authFetch (lewat callback) kalau access token baru habis di-refresh.
  const updateSession = useCallback((updated) => {
    setSession(updated);
  }, []);

  return (
    <AuthContext.Provider
      value={{ session, pendingTenant, selectTenant, login, logout, updateSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth harus dipakai di dalam <AuthProvider>');
  }
  return ctx;
}
