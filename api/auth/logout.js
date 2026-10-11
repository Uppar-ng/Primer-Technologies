import { parseCookies, kvDel } from '../_lib/auth.js';

export default async function handler(req, res) {
  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies.zaure_admin_session;
  if (token) await kvDel(`session:${token}`);
  res.setHeader('Set-Cookie', 'zaure_admin_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax');
  return res.status(200).json({ ok: true });
}