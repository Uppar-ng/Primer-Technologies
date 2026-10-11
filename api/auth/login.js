// POST /api/auth/login  { email, password }

import {
  BOOTSTRAP_ADMIN, hashPassword, makeToken,
  kvGet, kvSet
} from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ ok: false, error: 'Email and password required' });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  let staff = null;

  // 1. Bootstrap president
  if (normalizedEmail === BOOTSTRAP_ADMIN.email.toLowerCase()) {
    if (password !== BOOTSTRAP_ADMIN.password) {
      await new Promise(r => setTimeout(r, 400));
      return res.status(401).json({ ok: false, error: 'Invalid credentials' });
    }
    staff = {
      id: BOOTSTRAP_ADMIN.id,
      name: BOOTSTRAP_ADMIN.name,
      email: BOOTSTRAP_ADMIN.email,
      role: BOOTSTRAP_ADMIN.role,
      permissions: BOOTSTRAP_ADMIN.permissions,
      status: 'active'
    };
  } else {
    // 2. Look up staff in KV
    const staffId = await kvGet(`staff-email:${normalizedEmail}`);
    if (!staffId) {
      await new Promise(r => setTimeout(r, 400));
      return res.status(401).json({ ok: false, error: 'Invalid credentials' });
    }

    const record = await kvGet(`staff:${staffId}`);
    if (!record || record.status !== 'active') {
      await new Promise(r => setTimeout(r, 400));
      return res.status(401).json({ ok: false, error: 'Invalid credentials' });
    }

    const attempt = hashPassword(password, record.salt);
    if (attempt !== record.passwordHash) {
      await new Promise(r => setTimeout(r, 400));
      return res.status(401).json({ ok: false, error: 'Invalid credentials' });
    }

    staff = {
      id: record.id,
      name: record.name,
      email: record.email,
      role: record.role,
      permissions: record.permissions || [],
      status: record.status
    };
  }

  // Create session (30 days)
  const token = makeToken();
  const session = {
    token,
    staffId: staff.id,
    name: staff.name,
    email: staff.email,
    role: staff.role,
    permissions: staff.permissions,
    createdAt: new Date().toISOString()
  };

  await kvSet(`session:${token}`, session, 60 * 60 * 24 * 30);

  res.setHeader('Set-Cookie',
    `zaure_admin_session=${token}; Path=/; Max-Age=${60*60*24*30}; HttpOnly; Secure; SameSite=Lax`
  );

  return res.status(200).json({ ok: true, staff });
}