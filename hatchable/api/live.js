/**
 * POST /api/live — the order's camera, and the people allowed to watch it.
 *
 * What this is, said plainly: there is no media server behind this site and
 * no money for one, so a "live feed" here is the camera recording two
 * seconds at a time and the watchers playing those segments as they land.
 * It runs a handful of seconds behind the room. That is the honest cost of
 * doing it with a database and nothing else, and it is said on the page as
 * well as here.
 *
 * Who may watch: a signed-up member of this site **and** the holder of the
 * watchword the broadcaster typed before the countdown. Two locks, because
 * either alone is the wrong shape \u2014 an account is not an invitation, and
 * a shared word is not an identity.
 *
 * Actions
 *   { action: 'open',   pass, title, word, note? }   begin a feed
 *   { action: 'push',   pass, id, seq, part, head }  one segment
 *   { action: 'close',  pass, id }                   end it
 *   { action: 'mine',   pass }                       the broadcaster's view
 *   { action: 'list' }                               what is live, titles only
 *   { action: 'join',   id, word }                   members: may I watch?
 *   { action: 'pull',   id, word, since }            the next segments
 *   { action: 'say',    id, word, body }             a line in the room
 *   { action: 'room',   id, word, since }            chat, people, cameras
 *   { action: 'cam',    id, word, on }               raise or lower your own
 *                                                    camera in the room
 *   { action: 'cam-push', id, word, cam, seq, part } your camera's segments
 *   { action: 'people', pass, id }                   the broadcaster's table
 *   { action: 'allow',  pass, person, field, value } tick a box in it
 */
import { db } from 'hatchable';
import { adminDoor } from '../lib/door.js';
import { requireStudio } from '../lib/accounts.js';

export const access = 'public';
export const methods = ['POST'];

const KEEP_SECONDS = 180;      /* how far back a late watcher can reach */
const MAX_PART = 2.2 * 1024 * 1024;
const STALE_MIN = 3;           /* no segment for this long and it is over */

const clean = (v, n) => String(v == null ? '' : v).trim().slice(0, n);

async function hash(word) {
  const bytes = new TextEncoder().encode('egregora-live:' + word);
  const sum = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(sum)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/* A feed whose camera stopped talking is over, whatever the row says. */
async function sweep() {
  await db.query(
    `UPDATE live_feeds SET state = 'ended', ended_at = NOW()
      WHERE state = 'live' AND beat_at < NOW() - INTERVAL '${STALE_MIN} minutes'`).catch(() => {});
  await db.query(
    `DELETE FROM live_chunks
      WHERE is_head = FALSE AND at < NOW() - INTERVAL '${KEEP_SECONDS} seconds'`).catch(() => {});
  await db.query(
    `DELETE FROM live_chunks WHERE feed_id IN (
       SELECT id FROM live_feeds WHERE state = 'ended' AND ended_at < NOW() - INTERVAL '1 hour')`)
    .catch(() => {});
}


/* Who this member is in this room, and what they are allowed to do. A row
   is made the first time they look in. */
async function person(feedId, me) {
  const name = (me && (me.display_name || me.name || me.email)) || 'a member';
  const { rows } = await db.query(
    `INSERT INTO live_people (feed_id, member_id, who) VALUES ($1, $2, $3)
     ON CONFLICT (feed_id, member_id) DO UPDATE SET last_seen = NOW(), who = EXCLUDED.who
     RETURNING *`, [feedId, me && me.id ? me.id : null, String(name).slice(0, 80)]);
  return rows && rows[0];
}

export default async function (req, res) {
  const body = req.body || {};
  const action = clean(body.action || 'list', 12);

  try {
    /* ------------------------------------------------------- the watchers */
    if (action === 'list') {
      await sweep();
      const { rows } = await db.query(
        `SELECT id, title, note, started_at, watchers FROM live_feeds
          WHERE state = 'live' AND parent_id IS NULL ORDER BY started_at DESC LIMIT 20`);
      return res.json({
        ok: true,
        feeds: (rows || []).map((r) => ({
          id: Number(r.id),
          title: r.title,
          note: r.note || '',
          since: r.started_at,
          watchers: r.watchers || 0
        }))
      });
    }

    if (action === 'join' || action === 'pull') {
      /* Both locks. The member check first, because it is the one that
         carries a name. */
      const door = await requireStudio(req);
      if (!door.ok) return res.status(door.status).json({ error: door.error, gate: door.reason });

      const id = Number(body.id);
      const word = clean(body.word, 120);
      if (!id || !word) return res.status(400).json({ error: 'Which feed, and the watchword?' });

      const { rows } = await db.query('SELECT * FROM live_feeds WHERE id = $1', [id]);
      const feed = rows && rows[0];
      if (!feed) return res.status(404).json({ error: 'There is no such feed.' });
      if (feed.word_hash !== await hash(word)) {
        return res.status(401).json({ error: 'That is not the watchword for this feed.' });
      }

      if (action === 'join') {
        await db.query('UPDATE live_feeds SET watchers = watchers + 1 WHERE id = $1', [id]).catch(() => {});
        return res.json({
          ok: true,
          title: feed.title, note: feed.note || '', mime: feed.mime || 'video/webm',
          state: feed.state, since: feed.started_at
        });
      }

      const since = Number(body.since);
      const from = Number.isFinite(since) ? since : -1;
      /* The header segment always comes first for a watcher who has not had
         it; without it the rest is undecodable. */
      const want = from < 0
        ? await db.query(
          `SELECT seq, is_head, part FROM live_chunks
            WHERE feed_id = $1 AND (is_head = TRUE OR at > NOW() - INTERVAL '20 seconds')
            ORDER BY seq ASC LIMIT 20`, [id])
        : await db.query(
          'SELECT seq, is_head, part FROM live_chunks WHERE feed_id = $1 AND seq > $2 ORDER BY seq ASC LIMIT 20',
          [id, from]);

      return res.json({
        ok: true,
        state: feed.state,
        mime: feed.mime || 'video/webm',
        parts: (want.rows || []).map((r) => ({ seq: r.seq, head: r.is_head, part: r.part }))
      });
    }

    /* ------------------------------------------------------- the live room
       Chat, the people in it, and the members who have raised a camera of
       their own. Every one of these needs a member account and the
       watchword, exactly as watching does. */
    if (action === 'say' || action === 'room' || action === 'cam' || action === 'cam-push') {
      const door = await requireStudio(req);
      if (!door.ok) return res.status(door.status).json({ error: door.error, gate: door.reason });

      const id = Number(body.id);
      const word = clean(body.word, 120);
      const { rows } = await db.query('SELECT * FROM live_feeds WHERE id = $1', [id]);
      const feed = rows && rows[0];
      if (!feed) return res.status(404).json({ error: 'There is no such feed.' });
      if (feed.word_hash !== await hash(word)) {
        return res.status(401).json({ error: 'That is not the watchword for this feed.' });
      }

      const me = await person(id, door.member);
      if (me.blocked) {
        return res.status(403).json({ error: 'The broadcaster has closed this room to you.' });
      }

      if (action === 'say') {
        if (!me.can_chat) return res.status(403).json({ error: 'Your voice in the chat is turned off.' });
        const line = clean(body.body, 600);
        if (!line) return res.status(400).json({ error: 'Nothing to say.' });
        await db.query('INSERT INTO live_chat (feed_id, member_id, who, body) VALUES ($1,$2,$3,$4)',
          [id, me.member_id, me.who, line]);
        return res.json({ ok: true });
      }

      if (action === 'cam') {
        if (body.on === false) {
          await db.query(
            "UPDATE live_feeds SET state = 'ended', ended_at = NOW() WHERE parent_id = $1 AND who = $2",
            [id, me.who]);
          return res.json({ ok: true, cam: null });
        }
        if (!me.can_cam) {
          return res.status(403).json({
            error: 'The broadcaster has not opened the floor to you yet. Ask in the chat.'
          });
        }
        const { rows: made } = await db.query(
          `INSERT INTO live_feeds (title, who, word_hash, mime, state, parent_id)
           VALUES ($1, $2, $3, $4, 'live', $5) RETURNING id`,
          [me.who + ' in the room', me.who, feed.word_hash,
            clean(body.mime, 80) || 'video/webm', id]);
        return res.json({ ok: true, cam: Number(made[0].id) });
      }

      if (action === 'cam-push') {
        if (!me.can_cam) return res.status(403).json({ error: 'Your camera is not open.' });
        const cam = Number(body.cam);
        const seq = Number(body.seq);
        const part = String(body.part || '');
        if (!cam || !Number.isFinite(seq) || !part) return res.status(400).json({ error: 'A segment with no place.' });
        if (part.length > MAX_PART) return res.status(413).json({ error: 'That segment is too large.' });
        const { rows: mine } = await db.query(
          'SELECT id FROM live_feeds WHERE id = $1 AND parent_id = $2 AND who = $3', [cam, id, me.who]);
        if (!mine || !mine[0]) return res.status(403).json({ error: 'That is not your camera.' });
        await db.query(
          `INSERT INTO live_chunks (feed_id, seq, is_head, part) VALUES ($1,$2,$3,$4)
           ON CONFLICT (feed_id, seq) DO NOTHING`, [cam, seq, body.head === true, part]);
        await db.query('UPDATE live_feeds SET seq = GREATEST(seq, $2), beat_at = NOW() WHERE id = $1', [cam, seq]);
        return res.json({ ok: true });
      }

      /* action === 'room' */
      const since = Number(body.since) || 0;
      const { rows: lines } = await db.query(
        `SELECT id, who, body, is_order, at FROM live_chat
          WHERE feed_id = $1 AND id > $2 AND hidden = FALSE ORDER BY id ASC LIMIT 80`, [id, since]);
      const { rows: folk } = await db.query(
        `SELECT who, can_chat, can_cam, blocked FROM live_people
          WHERE feed_id = $1 AND last_seen > NOW() - INTERVAL '2 minutes' ORDER BY joined_at ASC LIMIT 100`,
        [id]);
      const { rows: cams } = await db.query(
        "SELECT id, who FROM live_feeds WHERE parent_id = $1 AND state = 'live' ORDER BY started_at ASC LIMIT 8",
        [id]);
      return res.json({
        ok: true,
        state: feed.state,
        you: { who: me.who, can_chat: me.can_chat, can_cam: me.can_cam },
        lines: (lines || []).map((l) => ({
          id: Number(l.id), who: l.who, body: l.body, order: l.is_order, at: l.at
        })),
        people: folk || [],
        cams: (cams || []).map((c) => ({ id: Number(c.id), who: c.who }))
      });
    }

    /* ---------------------------------------------------- the broadcaster */
    const admin = await adminDoor(req, body.pass);
    if (!admin.ok) return res.status(admin.status).json({ error: admin.error });

    if (action === 'open') {
      const title = clean(body.title, 160);
      const word = clean(body.word, 120);
      if (!title) return res.status(400).json({ error: 'Give the feed a title.' });
      if (word.length < 3) return res.status(400).json({ error: 'The watchword needs at least three characters.' });

      await sweep();
      const { rows } = await db.query(
        `INSERT INTO live_feeds (title, note, word_hash, mime, state)
         VALUES ($1, $2, $3, $4, 'live') RETURNING id, started_at`,
        [title, clean(body.note, 400), await hash(word), clean(body.mime, 80) || 'video/webm']);
      return res.json({ ok: true, id: Number(rows[0].id), started: rows[0].started_at });
    }

    if (action === 'push') {
      const id = Number(body.id);
      const seq = Number(body.seq);
      const part = String(body.part || '');
      if (!id || !Number.isFinite(seq) || !part) return res.status(400).json({ error: 'A segment with no place.' });
      if (part.length > MAX_PART) return res.status(413).json({ error: 'That segment is too large. Use a lower quality.' });

      await db.query(
        `INSERT INTO live_chunks (feed_id, seq, is_head, part) VALUES ($1, $2, $3, $4)
         ON CONFLICT (feed_id, seq) DO NOTHING`, [id, seq, body.head === true, part]);
      await db.query('UPDATE live_feeds SET seq = GREATEST(seq, $2), beat_at = NOW() WHERE id = $1', [id, seq]);
      if (seq % 10 === 0) await sweep();
      return res.json({ ok: true, seq });
    }

    if (action === 'close') {
      const id = Number(body.id);
      if (!id) return res.status(400).json({ error: 'Which feed?' });
      await db.query("UPDATE live_feeds SET state = 'ended', ended_at = NOW() WHERE id = $1", [id]);
      await db.query('DELETE FROM live_chunks WHERE feed_id = $1', [id]).catch(() => {});
      return res.json({ ok: true });
    }

    if (action === 'people') {
      const id = Number(body.id);
      if (!id) return res.status(400).json({ error: 'Which feed?' });
      const { rows } = await db.query(
        `SELECT id, who, can_chat, can_cam, blocked, last_seen FROM live_people
          WHERE feed_id = $1 ORDER BY joined_at ASC LIMIT 200`, [id]);
      const { rows: cams } = await db.query(
        "SELECT id, who FROM live_feeds WHERE parent_id = $1 AND state = 'live'", [id]);
      return res.json({
        ok: true,
        people: (rows || []).map((r) => ({
          id: Number(r.id), who: r.who, can_chat: r.can_chat, can_cam: r.can_cam,
          blocked: r.blocked, seen: r.last_seen,
          on_camera: (cams || []).some((c) => c.who === r.who)
        }))
      });
    }

    /* One tickbox at a time, which is how the table is actually used. */
    if (action === 'allow') {
      const who = Number(body.person);
      const field = clean(body.field, 10);
      if (!who || ['can_chat', 'can_cam', 'blocked'].indexOf(field) < 0) {
        return res.status(400).json({ error: 'Which person, and which box?' });
      }
      await db.query('UPDATE live_people SET ' + field + ' = $2 WHERE id = $1', [who, body.value === true]);
      /* Taking the camera away takes the picture down with it. */
      if (field === 'can_cam' && body.value !== true) {
        const { rows } = await db.query('SELECT feed_id, who FROM live_people WHERE id = $1', [who]);
        const row = rows && rows[0];
        if (row) {
          await db.query(
            "UPDATE live_feeds SET state = 'ended', ended_at = NOW() WHERE parent_id = $1 AND who = $2",
            [row.feed_id, row.who]);
        }
      }
      if (field === 'blocked' && body.value === true) {
        const { rows } = await db.query('SELECT feed_id, who FROM live_people WHERE id = $1', [who]);
        const row = rows && rows[0];
        if (row) {
          await db.query('UPDATE live_people SET can_cam = FALSE, can_chat = FALSE WHERE id = $1', [who]);
          await db.query(
            "UPDATE live_feeds SET state = 'ended', ended_at = NOW() WHERE parent_id = $1 AND who = $2",
            [row.feed_id, row.who]);
        }
      }
      return res.json({ ok: true });
    }

    /* The order's own line in the chat, marked as the order's. */
    if (action === 'order-say') {
      const id = Number(body.id);
      const line = clean(body.body, 600);
      if (!id || !line) return res.status(400).json({ error: 'Which feed, and what?' });
      await db.query(
        "INSERT INTO live_chat (feed_id, who, body, is_order) VALUES ($1, 'The Order', $2, TRUE)",
        [id, line]);
      return res.json({ ok: true });
    }

    if (action === 'hide-line') {
      await db.query('UPDATE live_chat SET hidden = TRUE WHERE id = $1', [Number(body.line)]);
      return res.json({ ok: true });
    }

    if (action === 'mine') {
      await sweep();
      const { rows } = await db.query(
        `SELECT id, title, state, watchers, started_at, ended_at, seq FROM live_feeds
          WHERE parent_id IS NULL ORDER BY started_at DESC LIMIT 20`);
      return res.json({
        ok: true,
        feeds: (rows || []).map((r) => ({
          id: Number(r.id), title: r.title, state: r.state, watchers: r.watchers || 0,
          segments: r.seq, since: r.started_at, until: r.ended_at
        }))
      });
    }

    return res.status(400).json({ error: 'No such action.' });
  } catch (err) {
    console.error('live:', err && err.message);
    return res.status(500).json({ error: (err && err.message) || 'The feed failed.' });
  }
}
