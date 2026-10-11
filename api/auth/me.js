import { getSession } from '../_lib/auth.js';

export default async function handler(req, res) {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ ok: false, error: 'Not authenticated' });
  return res.status(200).json({ ok: true, staff: session });
}