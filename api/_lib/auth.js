// ============================================================
// Zaure — Shared Auth Library
// Sessions + staff accounts stored in Vercel KV
// ============================================================

import crypto from 'crypto';
import { kv } from '@vercel/kv';

// ------------------------------------------------------------
// Bootstrap president
// ⚠️ Change the password below, then delete this block once
//    you've created a real President account in the dashboard.
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
// KV helpers — using @vercel/kv (handles all serialization)
// ------------------------------------------------------------
export async function kvGet(key) {
  try {
    return await kv.get(key);
  } catch (err) {
    console.error('[kvGet]', key, err.message);
    return null;
  }
}

export async function kvSet(key, value, exSeconds) {
  try {
    if (exSeconds) {
      await kv.set(key, value, { ex: exSeconds });
    } else {
      await kv.set(key, value);
    }
    return true;
  } catch (err) {
    console.error('[kvSet]', key, err.message);
    return false;
  }
}

export async function kvDel(key) {
  try {
    await kv.del(key);
    return true;
  } catch (err) {
    console.error('[kvDel]', key, err.message);
    return false;
  }
}

export async function kvKeys(pattern) {
  try {
    return await kv.keys(pattern);
  } catch (err) {
    console.error('[kvKeys]', pattern, err.message);
    return [];
  }
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