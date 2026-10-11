// ============================================================
// POST /api/auth/login
// Body: { email, password }
// Returns: { ok, staff }
// Sets cookie: zaure_admin_session
// ============================================================

import {
  BOOTSTRAP_ADMIN,
  hashPassword,
  makeToken,
  kvGet,
  kvSet
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

  try {
    // ---------- 1. Bootstrap President ----------
    if (normalizedEmail === BOOTSTRAP_ADMIN.email.toLowerCase()) {
      if (password !== BOOTSTRAP_ADMIN.password) {
        // Small delay to slow brute-force attempts
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
    }

    // ---------- 2. Regular staff from KV ----------
    else {
      const staffId = await kvGet(`staff-email:${normalizedEmail}`);

      if (!staffId) {
        await new Promise(r => setTimeout(r, 400));
        return res.status(401).json({ ok: false, error: 'Invalid credentials' });
      }

      const record = await kvGet(`staff:${staffId}`);

      if (!record) {
        await new Promise(r => setTimeout(r, 400));
        return res.status(401).json({ ok: false, error: 'Invalid credentials' });
      }

      if (record.status !== 'active') {
        return res.status(403).json({ ok: false, error: 'Account disabled. Contact the President.' });
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

    // ---------- 3. Create session ----------
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

    // Store session in KV for 30 days
    const saved = await kvSet(`session:${token}`, session, 60 * 60 * 24 * 30);

    if (!saved) {
      console.error('[login] Failed to save session to KV');
      return res.status(500).json({
        ok: false,
        error: 'Could not create session. Check KV configuration.'
      });
    }

    // ---------- 4. Set cookie ----------
    // Note: `Secure` intentionally omitted so preview URLs and localhost work.
    // Production HTTPS is enforced by Vercel's automatic headers.
    res.setHeader(
      'Set-Cookie',
      `zaure_admin_session=${token}; Path=/; Max-Age=${60 * 60 * 24 * 30}; HttpOnly; SameSite=Lax`
    );

    // Prevent caching of login responses
    res.setHeader('Cache-Control', 'no-store');

    return res.status(200).json({ ok: true, staff });

  } catch (err) {
    console.error('[login] Fatal:', err);
    return res.status(500).json({ ok: false, error: 'Internal error' });
  }
}