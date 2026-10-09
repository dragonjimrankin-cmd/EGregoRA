/**
 * POST /api/twin-member — the mirror between EGregoRA and The Two Infinities.
 *
 * Called only by the twin site, signed with the shared secret. Two actions:
 *   lookup  { email }  → what this project knows about the address
 *   upsert  { email, name?, verified?, subscribed?, age_verified?, id_status? }
 *
 * Nothing here issues a session or a code, so a stolen signature cannot sign
 * anybody in; the worst it could do is mark an address as a member, which is
 * what joining does anyway.
 */
import { db } from 'hatchable';
import { cleanEmail } from '../lib/accounts.js';
import { verifySignature, HOME } from '../lib/twin.js';

export const access = 'public';
export const methods = ['POST'];

export default async function (req, res) {
  if (!verifySignature(req)) {
    return res.status(401).json({ error: 'Not signed by the twin.' });
  }

  const body = req.body || {};
  const email = cleanEmail(body.email);
  if (!email) return res.status(400).json({ error: 'No address given.' });

  try {
    if (body.action === 'lookup') {
      const { rows } = await db.query(
        `SELECT name, verified, age_verified, id_status, subscribed
           FROM members WHERE email = $1`, [email]);
      const m = rows[0];
      return res.json({
        ok: true,
        site: HOME.key,
        known: Boolean(m),
        name: m ? m.name : null,
        verified: m ? Boolean(m.verified) : false,
        age_verified: m ? Boolean(m.age_verified) : false,
        id_status: m ? m.id_status : null,
        subscribed: m ? m.subscribed !== false : false
      });
    }

    if (body.action === 'upsert') {
      /* Create the member if this side has never seen the address. Flags only
         ever move forward here — the twin can confirm a member, never undo one
         — except the mailing list, which must be able to travel both ways so
         that one unsubscribe is enough for both sites. */
      await db.query(
        `INSERT INTO members (email, name) VALUES ($1, $2)
           ON CONFLICT (email) DO UPDATE SET name = COALESCE(members.name, EXCLUDED.name)`,
        [email, body.name || null]);

      const sets = ['twin_synced_at = NOW()'];
      const args = [email];
      const put = (sql, val) => { args.push(val); sets.push(sql.replace('$n', `$${args.length}`)); };

      if (body.verified === true) sets.push('verified = TRUE');
      if (body.age_verified === true) sets.push('age_verified = TRUE');
      if (body.id_status === 'verified') {
        sets.push("id_status = 'verified'");
        sets.push('verified_at = COALESCE(verified_at, NOW())');
      }
      if (typeof body.subscribed === 'boolean') {
        put('subscribed = $n', body.subscribed);
        sets.push(body.subscribed
          ? 'subscribed_at = COALESCE(subscribed_at, NOW()), unsubscribed_at = NULL'
          : 'unsubscribed_at = NOW()');
      }
      if (body.name) put('name = COALESCE(members.name, $n)', String(body.name).slice(0, 80));

      await db.query(`UPDATE members SET ${sets.join(', ')} WHERE email = $1`, args);
      return res.json({ ok: true, site: HOME.key, mirrored: email });
    }

    return res.status(400).json({ error: 'Unknown action.' });
  } catch (err) {
    console.error('twin-member failed', err && err.message);
    return res.status(500).json({ error: 'The mirror did not take.' });
  }
}
