/**
 * GET/POST /api/forum — the shared forum of EGregoRA and The Two Infinities.
 *
 * One room, two doors. The threads live in this project's database; the twin
 * site renders and posts to them through this API. Sign-in is by bearer
 * token (never cookies), so a member of either house may post: local tokens
 * are checked here, foreign tokens are vouched for by the twin's signed
 * whois door.
 *
 * The four construct-moderators listen. When a human member posts, one of
 * them may answer — through the oracle's own model stack, grounded in the
 * house's written body, abstaining when there is nothing honest to say.
 */
import { db, storage } from 'hatchable';
import { whoAmI, bearer } from '../lib/accounts.js';
import { askTwinWhois } from '../lib/twin.js';
import { BOTS, compose } from '../lib/forum-mind.js';

export const access = 'public';
export const methods = ['GET', 'POST', 'OPTIONS'];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, authorization'
};

const clean = (v, n) => {
  const s = String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, ' ').trim();
  return s.slice(0, n || 4000);
};

async function avatarUrl(key) {
  if (!key) return null;
  try { return await storage.url(key, { ttl: 604800 }); } catch { return null; }
}

/* Who is posting? A local member, or a member the twin vouches for. */
async function identity(req) {
  const me = await whoAmI(req).catch(() => null);
  if (me) {
    const { rows } = await db.query(
      'SELECT display_name, bio, avatar_key FROM forum_profiles WHERE member_id = $1', [me.id]);
    const p = rows[0] || {};
    return {
      id: me.id, home: 'egregora', kind: me.kind === 'bot' ? 'bot' : 'human',
      name: p.display_name || me.name || me.email,
      tag: me.kind === 'bot' ? 'moderator · construct' : null,
      bio: p.bio || null, avatar: await avatarUrl(p.avatar_key),
      /* Carried so the door below can be judged without a second lookup. */
      email: me.email || null, privilege: me.privilege || null, membership: null
    };
  }
  const token = bearer(req);
  if (token) {
    const t = await askTwinWhois(token);
    if (t.known && t.member) {
      return {
        id: 'twin-' + t.member.id, home: 'two-infinities', kind: 'human',
        name: t.member.display_name || t.member.name || 'a member of the twin',
        tag: 'twin member', bio: t.member.bio || null, avatar: t.member.avatar_url || null,
        /* The twin vouches for the standing as well as the name, because this
           house has no row of theirs to read. */
        email: t.member.email || null, privilege: t.member.privilege || null,
        membership: t.member.membership || null
      };
    }
  }
  return null;
}

/**
 * Who may actually speak here.
 *
 * The forum is readable by anyone — the link is on every page and the threads
 * are open. Taking part is narrower: an owner, an administrator, or a member
 * whose membership is still inside its period. Everyone else can read, and is
 * told plainly what would let them write, rather than being handed a box that
 * refuses them after they have typed.
 *
 * The house's own constructs are exempt: they are the room's furniture, not
 * guests, and shutting them out would leave the forum talking to itself.
 */
async function canTakePart(who) {
  if (!who) {
    return { ok: false, reason: 'sign-in',
      error: 'Sign in to take part \u2014 one account covers both houses.' };
  }
  if (who.kind === 'bot') return { ok: true, by: 'construct' };
  if (who.privilege === 'owner' || who.privilege === 'admin') {
    return { ok: true, by: who.privilege };
  }
  /* A twin member arrives vouched: their standing crossed with the name, and
     this house has no row of theirs to read. */
  if (who.membership) return { ok: true, by: 'member' };
  if (who.email) {
    const { rows } = await db.query(
      'SELECT state, period_end FROM memberships WHERE email = $1', [who.email]);
    const m = rows[0];
    const live = m && m.state === 'active' &&
      (!m.period_end || new Date(m.period_end).getTime() > Date.now());
    if (live) return { ok: true, by: 'member' };
  }
  return {
    ok: false, reason: 'membership',
    error: 'The forum is open to read. Writing needs a membership, or the order\u2019s ' +
           'own key \u2014 both are on the membership page.'
  };
}

async function authorRow(who) {
  /* snapshot for the post row */
  return {
    kind: who.kind === 'bot' ? 'bot' : 'member',
    id: typeof who.id === 'number' ? who.id : null,
    name: who.name, home: who.home, avatar: who.avatar, tag: who.tag
  };
}

/* ------------------------------------------------------------- reads */

async function listThreads() {
  const { rows } = await db.query(
    `SELECT t.id, t.title, t.blurb, t.author_kind, t.author_name, t.author_home, t.pinned,
            t.created_at, t.last_at,
            (SELECT COUNT(*)::int FROM forum_posts p WHERE p.thread_id = t.id) AS post_count,
            (SELECT author_name FROM forum_posts p WHERE p.thread_id = t.id
              ORDER BY p.created_at DESC LIMIT 1) AS last_name
       FROM forum_threads t
      ORDER BY t.pinned DESC, t.last_at DESC
      LIMIT 120`);
  return rows;
}

async function readThread(id) {
  const { rows: [t] } = await db.query(
    'SELECT * FROM forum_threads WHERE id = $1', [String(id)]);
  if (!t) return null;
  const { rows: posts } = await db.query(
    `SELECT id, author_kind, author_id, author_name, author_home, author_avatar,
            author_tag, body, created_at
       FROM forum_posts WHERE thread_id = $1 ORDER BY created_at ASC, id ASC`, [String(id)]);
  /* fresh avatar urls for local members */
  const ids = [...new Set(posts.filter((p) => p.author_id).map((p) => p.author_id))];
  const urls = {};
  if (ids.length) {
    const { rows: prof } = await db.query(
      `SELECT fp.member_id, fp.avatar_key, fp.display_name FROM forum_profiles fp
        WHERE fp.member_id = ANY($1)`, [ids]);
    for (const r of prof) urls[r.member_id] = await avatarUrl(r.avatar_key);
  }
  for (const p of posts) {
    if (p.author_id && urls[p.author_id]) p.author_avatar = urls[p.author_id];
    if (p.author_kind === 'oracle') {
      p.author_avatar = p.author_home === 'two-infinities'
        ? 'https://egregora.hatchable.site/assets/img/shakdrah.png'
        : 'https://egregora.hatchable.site/assets/img/gink.png';
    }
  }
  return { thread: t, posts };
}

/* --------------------------------------------------- the bots listen */

function botsListen(threadId, title, body) {
  /* fire and forget; a slow model must never block a member's post */
  (async () => {
    try {
      const { rows: recent } = await db.query(
        `SELECT 1 FROM forum_posts
          WHERE thread_id = $1 AND author_kind IN ('bot', 'oracle')
            AND created_at > NOW() - interval '2 hours' LIMIT 1`, [threadId]);
      if (recent.length) return;
      const { rows: counts } = await db.query(
        `SELECT author_name, COUNT(*)::int AS n FROM forum_posts
          WHERE thread_id = $1 AND author_kind = 'bot' GROUP BY author_name`, [threadId]);
      const done = new Map(counts.map((c) => [c.author_name, c.n]));
      const bot = BOTS.slice().sort((a, b) => (done.get(a.name) || 0) - (done.get(b.name) || 0))[0];
      const { rows: [m] } = await db.query(
        "SELECT id FROM members WHERE email = $1", [bot.key + '@forum.egregora']);
      const text = await compose(bot, title, body);
      if (!text) return;
      await db.query(
        `INSERT INTO forum_posts (thread_id, author_kind, author_id, author_name, author_home,
                                  author_tag, body)
         VALUES ($1, 'bot', $2, $3, 'egregora', $4, $5)`,
        [threadId, m ? m.id : null, bot.name, bot.tag, text]);
      await db.query('UPDATE forum_threads SET last_at = NOW() WHERE id = $1', [threadId]);
    } catch (e) {
      console.error('forum bot stayed silent:', e && e.message);
    }
  })();
}

/* ------------------------------------------------------------ handler */

export default async function (req, res) {
  for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const body = req.body || {};
  const action = String(body.action || (req.method === 'GET' ? (body.thread_id ? 'thread' : 'threads') : ''));
  try {
    if (action === 'threads') return res.json({ ok: true, threads: await listThreads() });
    if (action === 'thread') {
      const got = await readThread(body.thread_id || body.id);
      if (!got) return res.status(404).json({ error: 'There is no such thread.' });
      return res.json({ ok: true, ...got });
    }
    if (action === 'me') {
      const who = await identity(req);
      /* The page asks this before it draws the composer, so it can say what is
         missing rather than let somebody type a post that will be refused. */
      const door = await canTakePart(who);
      return res.json({
        ok: true, member: who,
        can_post: door.ok, reason: door.ok ? null : door.reason, why: door.error
      });
    }

    if (action === 'new' || action === 'post') {
      const who = await identity(req);
      const door = await canTakePart(who);
      if (!door.ok) {
        /* 401 when nobody is signed in at all, 403 when they are and simply
           may not write — the page reads the two differently. */
        return res.status(door.reason === 'sign-in' ? 401 : 403)
          .json({ error: door.error, reason: door.reason });
      }
      const text = clean(body.body, 6000);
      if (!text) return res.status(400).json({ error: 'Say the thing itself.' });

      let threadId = String(body.thread_id == null ? '' : body.thread_id);
      if (action === 'new') {
        const title = clean(body.title, 180);
        if (!title) return res.status(400).json({ error: 'A thread needs a title.' });
        const a = await authorRow(who);
        const { rows } = await db.query(
          `INSERT INTO forum_threads (title, author_kind, author_id, author_name, author_home)
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [title, a.kind === 'bot' ? 'bot' : 'member', a.id, a.name, a.home]);
        threadId = rows[0].id;
      } else {
        const { rows: [t] } = await db.query('SELECT locked FROM forum_threads WHERE id = $1', [threadId]);
        if (!t) return res.status(404).json({ error: 'There is no such thread.' });
        if (t.locked) return res.status(403).json({ error: 'That thread is at rest.' });
      }
      const a = await authorRow(who);
      const { rows: made } = await db.query(
        `INSERT INTO forum_posts (thread_id, author_kind, author_id, author_name, author_home,
                                  author_avatar, author_tag, body)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, created_at`,
        [threadId, a.kind, a.id, a.name, a.home, a.avatar, a.tag, text]);
      await db.query('UPDATE forum_threads SET last_at = NOW() WHERE id = $1', [threadId]);
      if (who.kind === 'human') botsListen(threadId, String(body.title || ''), text);
      return res.json({ ok: true, id: made[0].id, thread_id: threadId, at: made[0].created_at });
    }

    return res.status(400).json({ error: 'The forum does not know that action.' });
  } catch (err) {
    console.error('forum:', err && err.message);
    return res.status(500).json({ error: 'The forum stumbled. Try once more.' });
  }
}
