// GET    /api/auth/staff              list all
// POST   /api/auth/staff              create
// PUT    /api/auth/staff?id=X         update
// DELETE /api/auth/staff?id=X         delete

import {
  requirePermission, hashPassword, makeSalt, makeId,
  kvGet, kvSet, kvDel, kvKeys, ROLES
} from '../_lib/auth.js';

export default async function handler(req, res) {
  const session = await requirePermission(req, res, 'manage_staff');
  if (!session) return;

  if (req.method === 'GET') {
    // List all staff
    const keys = await kvKeys('staff:*');
    const ids = keys.filter(k => !k.startsWith('staff-email:'))
      .map(k => k.replace('staff:', ''));
    const records = await Promise.all(ids.map(id => kvGet(`staff:${id}`)));
    const staff = records.filter(Boolean).map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      permissions: r.permissions || [],
      status: r.status,
      createdAt: r.createdAt
    }));
    return res.status(200).json({ ok: true, staff, roles: ROLES });
  }

  if (req.method === 'POST') {
    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password || !role) {
      return res.status(400).json({ ok: false, error: 'name, email, password, role required' });
    }
    const emailNorm = String(email).toLowerCase().trim();

    const existing = await kvGet(`staff-email:${emailNorm}`);
    if (existing) {
      return res.status(409).json({ ok: false, error: 'Email already exists' });
    }

    const id = makeId();
    const salt = makeSalt();
    const passwordHash = hashPassword(password, salt);
    const rolePerms = (ROLES[role] || {}).permissions || [];

    const record = {
      id, name, email: emailNorm,
      salt, passwordHash,
      role,
      permissions: rolePerms,
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: session.staffId
    };

    await kvSet(`staff:${id}`, record);
    await kvSet(`staff-email:${emailNorm}`, id);

    return res.status(200).json({ ok: true, staff: { id, name, email: emailNorm, role, permissions: rolePerms, status: 'active' } });
  }

  if (req.method === 'PUT') {
    const id = req.query.id;
    if (!id) return res.status(400).json({ ok: false, error: 'id required' });

    const record = await kvGet(`staff:${id}`);
    if (!record) return res.status(404).json({ ok: false, error: 'Staff not found' });

    const { name, role, status, password } = req.body || {};

    if (name) record.name = name;
    if (role && ROLES[role]) {
      record.role = role;
      record.permissions = ROLES[role].permissions;
    }
    if (status) record.status = status;
    if (password) {
      record.salt = makeSalt();
      record.passwordHash = hashPassword(password, record.salt);
    }

    await kvSet(`staff:${id}`, record);
    return res.status(200).json({ ok: true, staff: { id: record.id, name: record.name, role: record.role, status: record.status } });
  }

  if (req.method === 'DELETE') {
    const id = req.query.id;
    if (!id) return res.status(400).json({ ok: false, error: 'id required' });
    if (id === session.staffId) return res.status(400).json({ ok: false, error: 'Cannot delete yourself' });

    const record = await kvGet(`staff:${id}`);
    if (!record) return res.status(404).json({ ok: false, error: 'Staff not found' });

    await kvDel(`staff:${id}`);
    await kvDel(`staff-email:${record.email}`);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
