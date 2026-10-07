/**
 * POST /api/media — the publishing door behind /podcast/ and /videos/.
 *
 * Until now an episode was published by committing an MP3 to the repo and
 * hand-editing a JSON file, which means publishing required a laptop, a
 * clone and a push. This is the other way in: sign in with the order's
 * passcode, hand over a file, let the browser clean it up, and it joins the
 * list on the page.
 *
 * The master goes into the project's object storage; this is only the
 * catalogue in front of it. Storage URLs are signed and expire, so a fresh
 * one is minted every time the list is read rather than written down.
 *
 * A browser cannot hand over an hour of audio in one request, so an upload
 * arrives in pieces: 'begin', then 'chunk' as many times as it takes, then
 * 'finish', which glues them together and puts the whole thing away.
 *
 * Actions
 *   { action: 'list', kind }                       published items \u2014 no passcode
 *   { action: 'shelf', kind, pass }                everything, drafts included
 *   { action: 'begin', pass, upload, mime }        start an upload
 *   { action: 'chunk', pass, upload, seq, part }   one piece, base64
 *   { action: 'finish', pass, upload, kind, \u2026 }    glue, store, catalogue
 *   { action: 'publish'|'unpublish', pass, id }    show it, or take it down
 *   { action: 'edit', pass, id, \u2026 }                change the writing
 *   { action: 'delete', pass, id }                 remove it entirely
 */
import { db, storage } from 'hatchable';
import { adminDoor } from '../lib/door.js';

export const access = 'public';
export const methods = ['POST'];

const MAX_BYTES = 220 * 1024 * 1024;      /* a long episode, comfortably */
const MAX_CHUNK = 1.4 * 1024 * 1024;      /* base64, per request */
const TTL = 604800;                        /* a week; re-signed on every read */

const clean = (v, n) => String(v == null ? '' : v).trim().slice(0, n);

async function dress(row) {
  let url = null;
  if (row.storage_key) {
    try { url = await storage.url(row.storage_key, { ttl: TTL }); } catch { url = null; }
  }
  return {
    id: Number(row.id),
    kind: row.kind,
    title: row.title,
    summary: row.summary || '',
    number: row.number || '',
    length: row.length_text || '',
    seconds: row.seconds || null,
    tags: (row.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
    treatment: row.treatment || '',
    bytes: Number(row.bytes) || null,
    original_bytes: Number(row.original_bytes) || null,
    mime: row.mime || '',
    state: row.state,
    date: row.created_at ? new Date(row.created_at).toISOString().slice(0, 10) : '',
    url
  };
}

export default async function (req, res) {
  const body = req.body || {};
  const action = clean(body.action || 'list', 24);

  /* The one action anybody may call: what is published. */
  if (action === 'list') {
    const kind = clean(body.kind, 8) === 'video' ? 'video' : 'audio';
    try {
      const { rows } = await db.query(
        `SELECT * FROM media WHERE kind = $1 AND state = 'published'
          ORDER BY created_at DESC LIMIT 200`, [kind]);
      const items = [];
      for (const r of rows || []) items.push(await dress(r));
      return res.json({ ok: true, items });
    } catch (err) {
      console.error('media: the shelf could not be read', err && err.message);
      return res.json({ ok: true, items: [] });
    }
  }

  /* Everything else is behind the passcode. */
  const door = await adminDoor(req, body.pass);
  if (!door.ok) return res.status(door.status).json({ error: door.error });

  try {
    switch (action) {
      case 'shelf': {
        const kind = clean(body.kind, 8) === 'video' ? 'video' : 'audio';
        const { rows } = await db.query(
          'SELECT * FROM media WHERE kind = $1 ORDER BY created_at DESC LIMIT 200', [kind]);
        const items = [];
        for (const r of rows || []) items.push(await dress(r));
        return res.json({ ok: true, items });
      }

      case 'begin': {
        const upload = clean(body.upload, 64);
        if (!upload) return res.status(400).json({ error: 'No upload name.' });
        await db.query('DELETE FROM media_chunks WHERE upload_id = $1', [upload]);
        /* Anything half-sent and then abandoned an hour ago is swept up, so
           a failed upload does not sit in the table for ever. */
        await db.query("DELETE FROM media_chunks WHERE at < NOW() - INTERVAL '2 hours'").catch(() => {});
        return res.json({ ok: true, upload, chunk_max: Math.floor(MAX_CHUNK) });
      }

      case 'chunk': {
        const upload = clean(body.upload, 64);
        const seq = Number(body.seq);
        const part = String(body.part || '');
        if (!upload || !Number.isFinite(seq)) return res.status(400).json({ error: 'A piece with no place.' });
        if (part.length > MAX_CHUNK * 1.1) return res.status(413).json({ error: 'That piece is too large.' });
        await db.query(
          `INSERT INTO media_chunks (upload_id, seq, part) VALUES ($1, $2, $3)
           ON CONFLICT (upload_id, seq) DO UPDATE SET part = EXCLUDED.part`,
          [upload, seq, part]);
        return res.json({ ok: true, seq });
      }

      case 'finish': {
        const upload = clean(body.upload, 64);
        const kind = clean(body.kind, 8) === 'video' ? 'video' : 'audio';
        const title = clean(body.title, 200);
        if (!upload) return res.status(400).json({ error: 'No upload name.' });
        if (!title) return res.status(400).json({ error: 'It needs a title before it can be published.' });

        const { rows } = await db.query(
          'SELECT seq, part FROM media_chunks WHERE upload_id = $1 ORDER BY seq ASC', [upload]);
        if (!rows || !rows.length) return res.status(400).json({ error: 'Nothing arrived. Try the upload again.' });

        const whole = Buffer.concat(rows.map((r) => Buffer.from(r.part, 'base64')));
        if (!whole.length) return res.status(400).json({ error: 'The file came through empty.' });
        if (whole.length > MAX_BYTES) {
          await db.query('DELETE FROM media_chunks WHERE upload_id = $1', [upload]);
          return res.status(413).json({ error: 'That file is larger than the ' +
            Math.round(MAX_BYTES / 1048576) + ' MB the shelf will take.' });
        }

        const mime = clean(body.mime, 80) || (kind === 'video' ? 'video/webm' : 'audio/mpeg');
        const ext = mime.includes('mpeg') ? 'mp3'
          : mime.includes('wav') ? 'wav'
            : mime.includes('ogg') ? 'ogg'
              : mime.includes('mp4') ? 'mp4'
                : mime.includes('webm') ? 'webm' : 'bin';
        const key = (kind === 'video' ? 'films/' : 'episodes/') +
          Date.now() + '-' + Math.random().toString(36).slice(2, 10) + '.' + ext;

        await storage.put(key, whole, mime);
        await db.query('DELETE FROM media_chunks WHERE upload_id = $1', [upload]);

        const { rows: made } = await db.query(
          `INSERT INTO media (kind, title, summary, number, length_text, seconds, tags,
                              storage_key, mime, bytes, original_bytes, treatment, state, who)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
          [kind, title, clean(body.summary, 2000), clean(body.number, 12),
            clean(body.length, 32), Number(body.seconds) || null, clean(body.tags, 300),
            key, mime, whole.length, Number(body.original_bytes) || null,
            clean(body.treatment, 600), body.publish === false ? 'draft' : 'published', door.who]);

        return res.json({ ok: true, item: await dress(made[0]) });
      }

      case 'publish':
      case 'unpublish': {
        const id = Number(body.id);
        if (!id) return res.status(400).json({ error: 'Which one?' });
        await db.query('UPDATE media SET state = $1, updated_at = NOW() WHERE id = $2',
          [action === 'publish' ? 'published' : 'draft', id]);
        return res.json({ ok: true });
      }

      case 'edit': {
        const id = Number(body.id);
        if (!id) return res.status(400).json({ error: 'Which one?' });
        await db.query(
          `UPDATE media SET title = COALESCE($2, title), summary = COALESCE($3, summary),
                            number = COALESCE($4, number), length_text = COALESCE($5, length_text),
                            tags = COALESCE($6, tags), updated_at = NOW()
            WHERE id = $1`,
          [id, body.title == null ? null : clean(body.title, 200),
            body.summary == null ? null : clean(body.summary, 2000),
            body.number == null ? null : clean(body.number, 12),
            body.length == null ? null : clean(body.length, 32),
            body.tags == null ? null : clean(body.tags, 300)]);
        return res.json({ ok: true });
      }

      case 'delete': {
        const id = Number(body.id);
        if (!id) return res.status(400).json({ error: 'Which one?' });
        const { rows } = await db.query('SELECT storage_key FROM media WHERE id = $1', [id]);
        const k = rows && rows[0] && rows[0].storage_key;
        if (k && storage.delete) await storage.delete(k).catch(() => {});
        await db.query('DELETE FROM media WHERE id = $1', [id]);
        return res.json({ ok: true });
      }

      default:
        return res.status(400).json({ error: 'No such action.' });
    }
  } catch (err) {
    console.error('media:', err && err.message);
    return res.status(500).json({ error: 'The shelf refused that: ' + ((err && err.message) || 'unknown') });
  }
}
