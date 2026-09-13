// ==========================================================
// API Client
// Standard fetch wrappers for backend communication
// ==========================================================

const API_BASE = '/api';

/**
 * Handle API responses and throw readable error messages
 */
async function handleResponse(response) {
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorMsg = data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }
  return data;
}

// ----------------------------------------------------------
// Public Waitlist Endpoints
// ----------------------------------------------------------

export async function joinWaitlist({ name, email, ref }) {
  const res = await fetch(`${API_BASE}/waitlist/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, ref }),
  });
  return handleResponse(res);
}

export async function getStatus({ email, code }) {
  const params = new URLSearchParams();
  if (email) params.append('email', email);
  if (code) params.append('code', code);

  const res = await fetch(`${API_BASE}/waitlist/status?${params.toString()}`);
  return handleResponse(res);
}

export async function getPublicStats() {
  const res = await fetch(`${API_BASE}/waitlist/public-stats`);
  return handleResponse(res);
}

// ----------------------------------------------------------
// Admin Endpoints (Require Bearer Token)
// ----------------------------------------------------------

export async function adminLogin(username, password) {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(res);
}

export async function getAdminStats(token) {
  const res = await fetch(`${API_BASE}/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function getAdminUsers(token, { search = '', status = 'all', sortBy = 'rank', order = 'asc' } = {}) {
  const params = new URLSearchParams({ search, status, sortBy, order });
  const res = await fetch(`${API_BASE}/admin/users?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function updateUserStatus(token, userId, status) {
  const res = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  return handleResponse(res);
}

export async function batchGrantAccess(token, { count, userIds }) {
  const res = await fetch(`${API_BASE}/admin/users/batch-grant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ count, userIds }),
  });
  return handleResponse(res);
}

export async function deleteUser(token, userId) {
  const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function getEmailLogs(token) {
  const res = await fetch(`${API_BASE}/admin/emails`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export function getCsvExportUrl(token) {
  return token ? `${API_BASE}/admin/export/csv?token=${encodeURIComponent(token)}` : `${API_BASE}/admin/export/csv`;
}
