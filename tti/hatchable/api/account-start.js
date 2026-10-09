/** POST /api/account-start — begin joining or signing in: email a six-digit code. */
import { cleanEmail, findOrCreate, issueCode, sendCode } from '../lib/accounts.js';
import { db } from 'hatchable';
import { solveCaptcha } from '../lib/captcha.js';
import { adoptFromTwin, TWIN } from '../lib/twin.js';

export const access = 'public';
export const methods = ['POST'];

export default async function (req, res) {
  const body = req.body || {};
  const addr = cleanEmail(body.email);
  const name = String(body.name || '').trim().slice(0, 80) || null;
  if (!addr) return res.status(400).json({ error: 'That does not look like an email address.' });

  /* The gate-word, before a single email is sent on anyone's behalf. */
  const gate = await solveCaptcha(body.captcha_token, body.captcha);
  if (!gate.ok) return res.status(400).json({ error: gate.error, captcha: true });

  try {
    // light rate limit: five codes per address per hour
    const { rows: recent } = await db.query(
      `SELECT count(*)::int AS n FROM member_codes c JOIN members m ON m.id = c.member_id
        WHERE m.email = $1 AND c.created_at > NOW() - interval '1 hour'`, [addr]);
    if (recent[0] && recent[0].n >= 5) {
      return res.status(429).json({ error: 'Too many codes sent to that address in the last hour. Wait a little.' });
    }

    let member = await findOrCreate(addr, name);

    /* Known on the other site but not here yet? Adopt what it knows — the
       name, the verified flag, the age check — so this is a sign-in rather
       than a second joining, and the studio does not ask twice. */
    let fromTwin = false;
    if (!member.verified) {
      const adopted = await adoptFromTwin(addr).catch(() => ({ adopted: false }));
      if (adopted.adopted && adopted.verified) {
        fromTwin = true;
        const { rows: again } = await db.query(
          'SELECT id, email, name, verified FROM members WHERE email = $1', [addr]);
        if (again[0]) member = again[0];
      }
    }

    const purpose = member.verified ? 'signin' : 'verify';
    const code = await issueCode(member, purpose);
    await sendCode(member, code, purpose);

    res.json({
      ok: true,
      purpose,
      returning: Boolean(member.verified),
      twin: fromTwin ? TWIN.label : undefined,
      message: fromTwin
        ? `Your ${TWIN.label} account covers this site too — welcome back. A six-digit code is on its way to ${addr}. It lasts fifteen minutes.`
        : `A six-digit code is on its way to ${addr}. It lasts fifteen minutes.`
    });
  } catch (err) {
    console.error('account-start failed', err && err.message);
    res.status(500).json({ error: 'The code could not be sent. Try again in a moment.' });
  }
}
