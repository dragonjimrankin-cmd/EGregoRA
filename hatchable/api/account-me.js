/** GET/POST /api/account-me — who is signed in, and what keys they hold. */
import { db } from 'hatchable';
import { whoAmI } from '../lib/accounts.js';

export const access = 'public';
export const methods = ['GET', 'POST'];

export default async function (req, res) {
  const me = await whoAmI(req);
  if (!me) return res.json({ signed_in: false });
  const { rows } = await db.query(
    'SELECT id, label, created_at, last_used FROM member_passkeys WHERE member_id = $1 ORDER BY id',
    [me.id]
  );
  res.json({
    signed_in: true,
    member: { id: me.id, email: me.email, name: me.name, verified: me.verified },
    method: me.method,
    passkeys: rows
  });
}
