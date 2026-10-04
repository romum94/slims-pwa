// Lapisan API tipis. Dua host berbeda yang dipanggil:
// 1. Dashboard API (VITE_DASHBOARD_API_BASE) - untuk daftar tenant, SEBELUM memilih perpustakaan.
// 2. Base URL tenant (tenant.base_url, beda-beda per perpustakaan) - untuk login & semua endpoint
//    mobile-api/* SLiMS, SETELAH tenant dipilih. Multi-tenant routing di backend berdasarkan
//    Host header, jadi base_url yang benar WAJIB dipakai, bukan domain dashboard.

const DASHBOARD_API_BASE = import.meta.env.VITE_DASHBOARD_API_BASE || '';

async function parseJsonOrThrow(res) {
  let body = null;
  try {
    body = await res.json();
  } catch {
    // respons bukan JSON (jarang terjadi, tapi jaga-jaga)
  }
  if (!res.ok) {
    const message = body?.error || body?.message || `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

export async function getTenants() {
  const res = await fetch(`${DASHBOARD_API_BASE}/api/mobile/tenants`);
  const data = await parseJsonOrThrow(res);
  return data.tenants || [];
}

export async function searchTenants(query) {
  const res = await fetch(`${DASHBOARD_API_BASE}/api/mobile/tenants/search?q=${encodeURIComponent(query)}`);
  const data = await parseJsonOrThrow(res);
  return data.tenants || [];
}

export async function loginMember(tenantBaseUrl, username, password) {
  const res = await fetch(`${tenantBaseUrl}/mobile-api/auth/member_login.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return parseJsonOrThrow(res);
}

export async function loginStaff(tenantBaseUrl, username, password) {
  const res = await fetch(`${tenantBaseUrl}/mobile-api/auth/staff_login.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return parseJsonOrThrow(res);
}

export async function refreshAccessToken(tenantBaseUrl, refreshToken) {
  const res = await fetch(`${tenantBaseUrl}/mobile-api/auth/refresh.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  return parseJsonOrThrow(res);
}

/**
 * Fetch ke endpoint mobile-api/* milik tenant yang sedang login, otomatis
 * menyisipkan Bearer access_token, dan otomatis refresh SEKALI kalau
 * dapat 401 (access token expired) sebelum retry request yang sama.
 *
 * @param {object} session - { tenant: {base_url}, accessToken, refreshToken }
 * @param {(newSession: object) => void} onSessionUpdate - dipanggil kalau token di-refresh, buat update context/localStorage
 */
export async function authFetch(session, path, options = {}, onSessionUpdate) {
  const doFetch = (token) =>
    fetch(`${session.tenant.base_url}${path}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });

  let res = await doFetch(session.accessToken);

  if (res.status === 401 && session.refreshToken) {
    const refreshed = await refreshAccessToken(session.tenant.base_url, session.refreshToken).catch(() => null);
    if (refreshed?.access_token) {
      const updated = { ...session, accessToken: refreshed.access_token };
      onSessionUpdate?.(updated);
      res = await doFetch(refreshed.access_token);
    }
  }

  return parseJsonOrThrow(res);
}
