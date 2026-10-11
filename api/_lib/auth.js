// ============================================================
// Zaure — Shared Auth Library
// Sessions + staff accounts stored in Vercel KV
// ============================================================

import crypto from 'crypto';

const KV_URL   = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

// ------------------------------------------------------------
// Bootstrap president (change password after first login)
// ------------------------------------------------------------
export const BOOTSTRAP_ADMIN = {
  id: 'president',
  name: 'Alamin Ahmed',
  email: 'president@zauretech.xyz',
  password: 'Zaure@President2026',
  role: 'president',
  permissions: ['*'],
  status: 'active'
};

// ------------------------------------------------------------
// Roles & their default permissions
// ------------------------------------------------------------
export const ROLES = {
  president: {
    label: 'President',
    permissions: ['*']
  },
  admin: {
    label: 'Admin',
    permissions: [
      'view_reports',
      'view_activity',
      'manage_staff',
      'delete_data',
      'export_data'
    ]
  },
  manager: {
    label: 'Manager',
    permissions: [
      'view_reports',
      'view_activity',
      'export_data'
    ]
  },
  operator: {
    label: 'Field Operator',
    permissions: [
      'view_own_reports',
      'submit_reports'
    ]
  },
  viewer: {
    label: 'Viewer',
    permissions: [
      'view_reports',
      'view_activity'
    ]
  }
};

// ------------------------------------------------------------
// Password hashing (SHA-256 + per-user salt)
// ------------------------------------------------------------
export function hashPassword(password, salt) {
  return crypto.createHash('sha256')
    .update(salt + password + salt)
    .digest('hex');
}

export function makeSalt() {
  return crypto.randomBytes(16).toString('hex');
}

export function makeToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function makeId() {
  return 'staff_' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
}

// ------------------------------------------------------------
// KV helpers (REST API — no npm package needed)
// ------------------------------------------------------------
export async function kvGet(key) {
  if (!KV_URL || !KV_TOKEN) return null;
  const res = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` }
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.result) return null;
  try { return JSON.parse(data.result); } catch { return data.result; }
}

export async function kvSet(key, value, exSeconds) {
  if (!KV_URL || !KV_TOKEN) return false;
  const url = exSeconds
    ? `${KV_URL}/set/${encodeURIComponent(key)}?EX=${exSeconds}`
    : `${KV_URL}/set/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(value)
  });
  return res.ok;
}

export async function kvDel(key) {
  if (!KV_URL || !KV_TOKEN) return false;
  const res = await fetch(`${KV_URL}/del/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}` }
  });
  return res.ok;
}

export async function kvKeys(pattern) {
  if (!KV_URL || !KV_TOKEN) return [];
  const res = await fetch(`${KV_URL}/keys/${encodeURIComponent(pattern)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` }
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.result || [];
}

// ------------------------------------------------------------
// Session helpers
// ------------------------------------------------------------
export function parseCookies(str) {
  if (!str) return {};
  return Object.fromEntries(
    str.split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k, decodeURIComponent(v.join('='))];
    })
  );
}

export async function getSession(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies.zaure_admin_session;
  if (!token) return null;
  return await kvGet(`session:${token}`);
}

export async function requireSession(req, res) {
  const session = await getSession(req);
  if (!session) {
    res.status(401).json({ ok: false, error: 'Not authenticated' });
    return null;
  }
  return session;
}

export function hasPermission(session, perm) {
  if (!session) return false;
  const perms = session.permissions || [];
  if (perms.includes('*')) return true;
  return perms.includes(perm);
}

export async function requirePermission(req, res, perm) {
  const session = await requireSession(req, res);
  if (!session) return null;
  if (!hasPermission(session, perm)) {
    res.status(403).json({ ok: false, error: 'Forbidden' });
    return null;
  }
  return session;
}
