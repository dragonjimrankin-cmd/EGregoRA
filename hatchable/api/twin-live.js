/**
 * POST /api/twin-live — the live room, opened from the other house.
 *
 * Called only by the twin, signed with the shared secret. Five actions:
 *
 *   open    { twin_key, title, note, word_hash, mime, who }  a feed has begun
 *   chunk   { twin_key, seq, head, part }                    two seconds more
 *   close   { twin_key }                                     the feed is over
 *   air     { on, note, back_at }                            the sign over the door
 *   cursor  { twin_key, x, y, name }                         the director's mouse
 *
 * Unlike the shelf, the bytes do cross here — but only two seconds at a time,
 * and only while the camera is running. That is the difference between "on air
 * in both houses" and "a link to somewhere else": a watcher on this side is
 * watching the same broadcast, a few seconds behind, from this house's own
 * room.
 *
 * The watchword never crosses. Both houses salt the hash with the same fixed
 * string, so word_hash alone lets a watcher here in with the same word.
 *
 * The same two rules hold as on the shelf: a feed that arrived from the twin
 * carries twin_origin and is never relayed back, and nothing in here can
 * touch a feed this house opened itself.
 */
import { db } from 'hatchable';
import { verifySignature } from '../lib/twin.js';

export const access = 'public';
export const methods = ['POST'];

const clean = (v, n) => String(v == null ? '' : v).trim().slice(0, n);

/* The same ceiling the local broadcaster is held to: a segment larger than
   this means the camera is set too high, not that the relay should stretch. */
const MAX_PART = 2.2 * 1024 * 1024;

/* twin_key -> feed id, so a stream of segments costs one lookup and not one
   per two seconds. Bounded, because feeds come and go. */
const KNOWN = new Map();
const KNOWN_MAX = 200;

async function feedOf(key) {
  if (KNOWN.has(key)) return KNOWN.get(key);
  const { rows } = await db.query(
    'SELECT id, twin_origin, state FROM live_feeds WHERE twin_key = $1', [key]);
  const row = rows[0];
  if (!row) return null;
  const found = { id: Number(row.id), twin_origin: row.twin_origin, state: row.state };
  if (KNOWN.size >= KNOWN_MAX) KNOWN.delete(KNOWN.keys().next().value);
  KNOWN.set(key, found);
  return found;
}

export default async function (req, res) {
  if (!verifySignature(req)) {
    return res.status(401).json({ error: 'Not signed by the twin.' });
  }

  const body = req.body || {};
  const action = clean(body.action, 12);
  const from = clean(body.from, 24) || 'twin';

  try {
    /* The sign over the door belongs to the whole house, not to one feed, so
       it is the one action that needs no twin_key. */
    if (action === 'air') {
      const on = body.on === true;
      await db.query(
        `INSERT INTO live_air (only_row, on_air, note, back_at, at)
         VALUES (TRUE, $1, $2, $3, NOW())
         ON CONFLICT (only_row) DO UPDATE
           SET on_air = EXCLUDED.on_air, note = EXCLUDED.note,
               back_at = EXCLUDED.back_at, at = NOW()`,
        [on, clean(body.note, 300), clean(body.back_at, 80)]);
      return res.json({ ok: true, on });
    }

    const key = clean(body.twin_key, 80);
    if (!key) return res.status(400).json({ error: 'No twin_key.' });

    if (action === 'open') {
      const title = clean(body.title, 160);
      const wordHash = clean(body.word_hash, 64);
      if (!title) return res.status(400).json({ error: 'It needs a title.' });
      if (!wordHash) return res.status(400).json({ error: 'No watchword to check watchers against.' });

      const { rows: have } = await db.query(
        'SELECT id, twin_origin FROM live_feeds WHERE twin_key = $1', [key]);
      const row = have[0];

      /* A letter from the twin cannot take over a feed this house opened. */
      if (row && !row.twin_origin) {
        return res.status(409).json({ error: 'That feed belongs to this house.' });
      }

      if (row) {
        /* The twin reopened the same feed — put it back on air here too. */
        await db.query(
          `UPDATE live_feeds SET title = $2, note = $3, mime = $4, state = 'live',
                                 beat_at = NOW(), ended_at = NULL, twin_origin = $5
             WHERE id = $1`,
          [row.id, title, clean(body.note, 400), clean(body.mime, 80) || 'video/webm', from]);
        KNOWN.set(key, { id: Number(row.id), twin_origin: from, state: 'live' });
        return res.json({ ok: true, updated: true, id: Number(row.id) });
      }

      const { rows: made } = await db.query(
        `INSERT INTO live_feeds (title, note, word_hash, mime, state, who, twin_key, twin_origin)
         VALUES ($1, $2, $3, $4, 'live', $5, $6, $7) RETURNING id`,
        [title, clean(body.note, 400), wordHash, clean(body.mime, 80) || 'video/webm',
          clean(body.who, 80) || ('twin:' + from), key, from]);
      const id = Number(made[0].id);
      KNOWN.set(key, { id, twin_origin: from, state: 'live' });
      return res.json({ ok: true, created: true, id });
    }

    const feed = await feedOf(key);
    if (!feed) {
      return res.status(404).json({ error: 'No feed here by that name.' });
    }
    /* Nothing from the twin can move a feed this house is broadcasting. */
    if (!feed.twin_origin) {
      return res.status(409).json({ error: 'That feed belongs to this house.' });
    }

    if (action === 'chunk') {
      const seq = Number(body.seq);
      const part = String(body.part || '');
      if (!Number.isFinite(seq) || !part) {
        return res.status(400).json({ error: 'A segment with no place.' });
      }
      if (part.length > MAX_PART) {
        return res.status(413).json({ error: 'That segment is too large.' });
      }
      await db.query(
        `INSERT INTO live_chunks (feed_id, seq, is_head, part) VALUES ($1, $2, $3, $4)
         ON CONFLICT (feed_id, seq) DO NOTHING`, [feed.id, seq, body.head === true, part]);
      await db.query(
        "UPDATE live_feeds SET seq = GREATEST(seq, $2), beat_at = NOW(), state = 'live' WHERE id = $1",
        [feed.id, seq]);
      return res.json({ ok: true, seq });
    }

    if (action === 'close') {
      await db.query(
        "UPDATE live_feeds SET state = 'ended', ended_at = NOW() WHERE id = $1", [feed.id]);
      await db.query('DELETE FROM live_chunks WHERE feed_id = $1', [feed.id]).catch(() => {});
      await db.query('DELETE FROM live_cursor WHERE feed_id = $1', [feed.id]).catch(() => {});
      KNOWN.delete(key);
      return res.json({ ok: true, closed: true, id: feed.id });
    }

    if (action === 'cursor') {
      const x = Math.min(1, Math.max(0, Number(body.x) || 0));
      const y = Math.min(1, Math.max(0, Number(body.y) || 0));
      await db.query(
        `INSERT INTO live_cursor (feed_id, x, y, name, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (feed_id) DO UPDATE
           SET x = EXCLUDED.x, y = EXCLUDED.y, name = EXCLUDED.name, updated_at = NOW()`,
        [feed.id, x, y, clean(body.name, 80) || 'the director']);
      return res.json({ ok: true });
    }

    return res.status(400).json({ error: 'Unknown action.' });
  } catch (err) {
    console.error('twin-live failed', err && err.message);
    return res.status(500).json({ error: 'The relay did not take.' });
  }
}
