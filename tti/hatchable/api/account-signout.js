/** POST /api/account-signout — end this session. */
import { db } from 'hatchable';
import { bearer } from '../lib/accounts.js';

export const access = 'public';
export const methods = ['POST'];

export default async function (req, res) {
  const token = bearer(req);
  if (token) await db.query('DELETE FROM member_sessions WHERE token = $1', [token]);
  res.json({ ok: true });
}
