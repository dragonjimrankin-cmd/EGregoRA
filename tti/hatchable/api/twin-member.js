/**
 * POST /api/twin-member — the mirror between EGregoRA and The Two Infinities.
 *
 * Called only by the twin site, signed with the shared secret. Two actions:
 *   whois   { token }  → who a session token signs in here (the forum's vouch)
 *   lookup  { email }  → what this project knows about the address
 *   upsert  { email, name?, verified?, subscribed?, age_verified?, id_status? }
 *
 * Nothing here issues a session or a code, so a stolen signature cannot sign
 * anybody in; the worst it could do is mark an address as a member, which is
 * what joining does anyway.
 */
import { db, storage } from 'hatchable';
import { cleanEmail, whoAmI } from '../lib/accounts.js';
import { verifySignature, HOME } from '../lib/twin.js';

export const access = 'public';
export const methods = ['POST'];

export default async function (req, res) {
  if (!verifySignature(req)) {
    return res.status(401).json({ error: 'Not signed by the twin.' });
  }

  const body = req.body || {};
  const email = cleanEmail(body.email);

  try {
    /* whois — the forum's vouching door. The twin hands us one of ITS
       members' session tokens; we say whether it signs someone in here and
       what they have chosen to be called. No session is issued, no
       credential accepted: a stolen signature cannot sign anybody in. */
    if (body.action === 'whois') {
      const me = await whoAmI({ headers: {}, body: { token: body.token || '' }, method: 'POST' })
        .catch(() => null);
      if (!me) return res.json({ ok: true, site: HOME.key, known: false });
      const { rows } = await db.query(
        'SELECT display_name, bio, avatar_key FROM forum_profiles WHERE member_id = $1', [me.id]);
      const p = rows[0] || {};
      let avatar_url = null;
      if (p.avatar_key) { try { avatar_url = await storage.url(p.avatar_key, { ttl: 604800 }); } catch {} }
      /* The shared forum has to decide whether this member may write, and it
         cannot ask our database from over there. So the standing travels with
         the vouching: privilege, and whether a membership is still inside its
         period. Neither is a secret the twin is entitled to keep — the member
         is asking to post under their own name. */
      let membership = null;
      try {
        const { rows: mm } = await db.query(
          'SELECT tier, period_end FROM memberships WHERE email = $1 AND state = $2',
          [me.email, 'active']);
        const m = mm[0];
        if (m && (!m.period_end || new Date(m.period_end).getTime() > Date.now())) {
          membership = m.tier || 'member';
        }
      } catch { /* a house without the ledger yet simply vouches for the name */ }
      return res.json({
        ok: true, site: HOME.key, known: true,
        member: {
          id: me.id, name: me.name, email: me.email,
          kind: me.kind === 'bot' ? 'bot' : 'human',
          privilege: me.privilege || null, membership,
          display_name: p.display_name || null, bio: p.bio || null, avatar_url
        }
      });
    }

    if (!email) return res.status(400).json({ error: 'No address given.' });

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

      /* The chosen face and words travel with the member. */
      if (body.display_name || body.bio != null) {
        const { rows: [mine] } = await db.query('SELECT id FROM members WHERE email = $1', [email]);
        if (mine) {
          await db.query(
            `INSERT INTO forum_profiles (member_id, display_name, bio, home)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (member_id) DO UPDATE SET
               display_name = COALESCE(EXCLUDED.display_name, forum_profiles.display_name),
               bio = COALESCE(EXCLUDED.bio, forum_profiles.bio),
               updated_at = NOW()`,
            [mine.id, body.display_name || null,
             body.bio != null ? String(body.bio).slice(0, 4000) : null,
             HOME.key === 'egregora' ? 'two-infinities' : 'egregora']);
        }
      }
      return res.json({ ok: true, site: HOME.key, mirrored: email });
    }

    return res.status(400).json({ error: 'Unknown action.' });
  } catch (err) {
    console.error('twin-member failed', err && err.message);
    return res.status(500).json({ error: 'The mirror did not take.' });
  }
}
