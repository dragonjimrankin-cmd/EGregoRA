/** POST /api/account-start — begin joining or signing in: email a six-digit code. */
import { cleanEmail, findOrCreate, issueCode, sendCode } from '../lib/accounts.js';
import { db } from 'hatchable';

export const access = 'public';
export const methods = ['POST'];

export default async function (req, res) {
  const body = req.body || {};
  const addr = cleanEmail(body.email);
  const name = String(body.name || '').trim().slice(0, 80) || null;
  if (!addr) return res.status(400).json({ error: 'That does not look like an email address.' });

  try {
    // light rate limit: five codes per address per hour
    const { rows: recent } = await db.query(
      `SELECT count(*)::int AS n FROM member_codes c JOIN members m ON m.id = c.member_id
        WHERE m.email = $1 AND c.created_at > NOW() - interval '1 hour'`, [addr]);
    if (recent[0] && recent[0].n >= 5) {
      return res.status(429).json({ error: 'Too many codes sent to that address in the last hour. Wait a little.' });
    }

    const member = await findOrCreate(addr, name);
    const purpose = member.verified ? 'signin' : 'verify';
    const code = await issueCode(member, purpose);
    await sendCode(member, code, purpose);

    res.json({
      ok: true,
      purpose,
      returning: Boolean(member.verified),
      message: `A six-digit code is on its way to ${addr}. It lasts fifteen minutes.`
    });
  } catch (err) {
    console.error('account-start failed', err && err.message);
    res.status(500).json({ error: 'The code could not be sent. Try again in a moment.' });
  }
}
