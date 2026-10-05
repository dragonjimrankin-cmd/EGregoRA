/** POST /api/account-verify — exchange the emailed code for a session. */
import { db } from 'hatchable';
import { cleanEmail, checkCode, startSession, SESSION_DAYS } from '../lib/accounts.js';

export const access = 'public';
export const methods = ['POST'];

export default async function (req, res) {
  const body = req.body || {};
  const addr = cleanEmail(body.email);
  const code = String(body.code || '').replace(/\D/g, '');
  if (!addr || code.length !== 6) {
    return res.status(400).json({ error: 'Give the address and the six digits from the email.' });
  }

  try {
    const { rows } = await db.query('SELECT id, email, name, verified FROM members WHERE email = $1', [addr]);
    const member = rows[0];
    if (!member) return res.status(404).json({ error: 'No one has asked to join with that address.' });

    const ok = (await checkCode(member.id, code, 'verify')) || (await checkCode(member.id, code, 'signin'));
    if (!ok) return res.status(401).json({ error: 'That code is wrong, used, or older than fifteen minutes.' });

    const token = await startSession(member.id, 'email');
    res.json({
      ok: true,
      token,
      expires_days: SESSION_DAYS,
      member: { id: member.id, email: member.email, name: member.name, verified: true }
    });
  } catch (err) {
    console.error('account-verify failed', err && err.message);
    res.status(500).json({ error: 'The code could not be checked. Try again.' });
  }
}
