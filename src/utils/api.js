// API Client — replaces localStorage-based storage.js
// All functions are async and communicate with the Express backend

const API_BASE = '/api';

// ─── Token Management ──────────────────────────────────────
function getToken() {
  return localStorage.getItem('schedulify_jwt');
}

function setToken(token) {
  if (token) {
    localStorage.setItem('schedulify_jwt', token);
  } else {
    localStorage.removeItem('schedulify_jwt');
  }
}

function authHeaders() {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// ─── Generic Fetch Helper ───────────────────────────────────
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) }
  });

  const data = await res.json();

  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.status = res.status;
    throw err;
  }

  return data;
}

// ═══════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════

export async function apiLogin(email, password) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  setToken(data.token);
  return data; // { token, user }
}

export async function apiSignup(email, password, name = '') {
  const data = await apiFetch('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, name })
  });
  setToken(data.token);
  return data; // { token, user }
}

export async function apiGetMe() {
  const token = getToken();
  if (!token) return null;
  try {
    const data = await apiFetch('/auth/me');
    return data.user;
  } catch {
    // Invalid/expired token
    setToken(null);
    return null;
  }
}

export function apiLogout() {
  setToken(null);
}

// ═══════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════

export async function apiGetUserByUsername(username) {
  const data = await apiFetch(`/users/${username.toLowerCase()}`);
  return data.user;
}

export async function apiCheckUsername(username) {
  const data = await apiFetch(`/users/${username.toLowerCase()}/check`);
  return data.available;
}

export async function apiUpdateProfile({ name, username, bio }) {
  const data = await apiFetch('/users/profile', {
    method: 'PUT',
    body: JSON.stringify({ name, username, bio })
  });
  return data.user;
}

// ═══════════════════════════════════════════════════════════════
// AVAILABILITY
// ═══════════════════════════════════════════════════════════════

export async function apiGetAvailability(username) {
  const data = await apiFetch(`/availability/${username.toLowerCase()}`);
  return data; // { timezone, days, blockedDates }
}

export async function apiSaveAvailability(timezone, days) {
  await apiFetch('/availability', {
    method: 'PUT',
    body: JSON.stringify({ timezone, days })
  });
}

export async function apiBlockDate(dateStr) {
  await apiFetch('/availability/block', {
    method: 'POST',
    body: JSON.stringify({ date: dateStr })
  });
}

export async function apiUnblockDate(dateStr) {
  await apiFetch(`/availability/block/${dateStr}`, {
    method: 'DELETE'
  });
}

// ═══════════════════════════════════════════════════════════════
// SLOTS
// ═══════════════════════════════════════════════════════════════

export async function apiGetSlots(username, dateStr) {
  const data = await apiFetch(`/slots/${username.toLowerCase()}/${dateStr}`);
  return data; // { slots, timezone }
}

// ═══════════════════════════════════════════════════════════════
// BOOKINGS
// ═══════════════════════════════════════════════════════════════

export async function apiCreateBooking({ hostUsername, guestName, guestEmail, date, startTime, endTime, timezone, message }) {
  const data = await apiFetch('/bookings', {
    method: 'POST',
    body: JSON.stringify({ hostUsername, guestName, guestEmail, date, startTime, endTime, timezone, message })
  });
  return data.booking;
}

export async function apiGetBookings() {
  const data = await apiFetch('/bookings');
  return data.bookings;
}

export async function apiCancelBooking(bookingId) {
  await apiFetch(`/bookings/${bookingId}/cancel`, { method: 'PUT' });
}

// ═══════════════════════════════════════════════════════════════
// EMAIL OUTBOX
// ═══════════════════════════════════════════════════════════════

export async function apiGetEmails() {
  const data = await apiFetch('/emails');
  return data.emails;
}
