/** GET/POST /api/account-me — who is signed in, what they hold, what they have made. */
import { db } from 'hatchable';
import { whoAmI } from '../lib/accounts.js';

export const access = 'public';
export const methods = ['GET', 'POST'];

export default async function (req, res) {
  const me = await whoAmI(req);
  if (!me) return res.json({ signed_in: false });

  const safe = (q, p) => db.query(q, p).then((r) => r.rows).catch(() => []);

  const [keys, sessions, letters, videos] = await Promise.all([
    safe('SELECT id, label, created_at, last_used FROM member_passkeys WHERE member_id = $1 ORDER BY id', [me.id]),
    safe('SELECT count(*)::int AS n FROM member_sessions WHERE member_id = $1 AND expires_at > NOW()', [me.id]),
    safe('SELECT count(*)::int AS n FROM letters WHERE email = $1', [me.email]),
    safe("SELECT count(*)::int AS n FROM videos WHERE status = 'ready'", [])
  ]);

  db.query('UPDATE members SET last_seen = NOW() WHERE id = $1', [me.id]).catch(() => {});

  res.json({
    signed_in: true,
    member: {
      id: me.id,
      email: me.email,
      name: me.name,
      verified: me.verified,
      legal_name: me.legal_name || null,
      age_verified: Boolean(me.age_verified),
      id_status: me.id_status || 'none',
      id_doc_type: me.id_doc_type || null,
      joined: me.created_at || null,
      checked: me.verified_at || null
    },
    studio: Boolean(me.verified && me.age_verified && me.id_status === 'verified'),
    method: me.method,
    session: { started: me.session_started || null, expires: me.expires_at || null },
    counts: {
      passkeys: keys.length,
      sessions: (sessions[0] && sessions[0].n) || 1,
      letters: (letters[0] && letters[0].n) || 0,
      clips: (videos[0] && videos[0].n) || 0
    },
    passkeys: keys
  });
}
