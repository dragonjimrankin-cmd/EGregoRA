/** POST /api/account-verify — exchange the emailed code for a session. */
import { db } from 'hatchable';
import { cleanEmail, checkCode, startSession, SESSION_DAYS } from '../lib/accounts.js';
import { sendWelcome } from '../lib/mailing.js';
import { mirror } from '../lib/twin.js';

export const access = 'public';
export const methods = ['POST'];

export default async function (req, res) {
  const body = req.body || {};
  const addr = cleanEmail(body.email);
  const code = String(body.code || '').replace(/\D/g, '');
  if (!addr || code.length !== 6) {
    return res.status(400).json({ error: 'Give the address and the six digits from the email.' });
  }

  /* A six-digit code is small enough to guess at, so wrong guesses are
     counted: five in fifteen minutes and the door rests until a fresh code
     is asked for. */
  try {
    const { rows: tries } = await db.query(
      `SELECT count(*)::int AS n FROM code_tries
        WHERE email = $1 AND at > NOW() - INTERVAL '15 minutes'`, [addr]);
    if (tries[0] && tries[0].n >= 5) {
      return res.status(429).json({
        error: 'Too many wrong codes in a row. Ask for a fresh one at the join — the door rests until ' +
               new Date(Date.now() + 15 * 60000).toTimeString().slice(0, 5) + '.'
      });
    }
  } catch { /* the count must never block a right code */ }

  try {
    const { rows } = await db.query('SELECT id, email, name, verified FROM members WHERE email = $1', [addr]);
    const member = rows[0];
    if (!member) return res.status(404).json({ error: 'No one has asked to join with that address.' });

    const ok = (await checkCode(member.id, code, 'verify')) || (await checkCode(member.id, code, 'signin'));
    if (!ok) {
      await db.query(`INSERT INTO code_tries (email, at) VALUES ($1, NOW())`, [addr]).catch(() => {});
      await db.query(`DELETE FROM code_tries WHERE at < NOW() - INTERVAL '1 hour'`).catch(() => {});
      return res.status(401).json({ error: 'That code is wrong, used, or older than fifteen minutes.' });
    }
    await db.query(`DELETE FROM code_tries WHERE email = $1`, [addr]).catch(() => {});

    const token = await startSession(member.id, 'email');

    /* First time through: welcome them, and put them on the list. The letter
       itself says they are on it and carries the way off at its foot. */
    if (!member.verified) {
      const { rows: fresh } = await db.query(
        'SELECT id, email, name, unsub_token, welcomed FROM members WHERE id = $1', [member.id]
      );
      await db.query(
        'UPDATE members SET subscribed = TRUE, subscribed_at = COALESCE(subscribed_at, NOW()) WHERE id = $1',
        [member.id]
      );
      sendWelcome(fresh[0] || member).catch(() => {});
    }

    /* One membership, two sites. The twin is told the address is good and on
       the list, so signing in over there finds an account already waiting. */
    mirror(member.email, { name: member.name, verified: true, subscribed: true })
      .catch(() => {});
    res.json({
      ok: true,
      token,
      expires_days: SESSION_DAYS,
      member: { id: member.id, email: member.email, name: member.name, verified: true },
      subscribed: !member.verified ? true : undefined
    });
  } catch (err) {
    console.error('account-verify failed', err && err.message);
    res.status(500).json({ error: 'The code could not be checked. Try again.' });
  }
}