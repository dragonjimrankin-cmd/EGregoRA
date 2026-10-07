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

export default async function (req, res) {
  const body = req.body || {};
  const action = clean(body.action || 'list', 12);

  try {
    /* ------------------------------------------------------- the watchers */
    if (action === 'list') {
      await sweep();
      const { rows } = await db.query(
        `SELECT id, title, note, started_at, watchers FROM live_feeds
          WHERE state = 'live' ORDER BY started_at DESC LIMIT 20`);
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

    if (action === 'mine') {
      await sweep();
      const { rows } = await db.query(
        `SELECT id, title, state, watchers, started_at, ended_at, seq FROM live_feeds
          ORDER BY started_at DESC LIMIT 20`);
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
