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
 *   { action: 'replace', pass, id, upload, … }     a new master for an
 *                                                  existing item: what a cut
 *                                                  or a merge saves
 *   { action: 'attach', pass, id, upload, role }   a cover, or a plate cued
 *                                                  to a moment in the sound
 *   { action: 'cue'|'drop-image', pass, image_id } move or remove a plate
 *   { action: 'one', pass, id }                    one item, freshly signed
 *   { action: 'pin'|'unpin', pass, id }            hold it at the top of the
 *                                                  page — three at most
 */
import { db, storage } from 'hatchable';
import { adminDoor } from '../lib/door.js';

export const access = 'public';
export const methods = ['POST'];

const MAX_BYTES = 220 * 1024 * 1024;      /* a long episode, comfortably */
const MAX_CHUNK = 1.4 * 1024 * 1024;      /* base64, per request */
const TTL = 604800;                        /* a week; re-signed on every read */

const clean = (v, n) => String(v == null ? '' : v).trim().slice(0, n);

const safeList = (raw) => {
  if (!raw) return [];
  try { const v = JSON.parse(raw); return Array.isArray(v) ? v : []; } catch { return []; }
};

/* An episode number nobody has to think about: the highest on the shelf or
   in the committed run, plus one. */
async function nextNumber(after) {
  let top = Number(after) || 0;
  try {
    const { rows } = await db.query("SELECT number FROM media WHERE kind = 'audio' AND number <> ''");
    for (const r of rows || []) {
      const n = parseInt(String(r.number).replace(/\D/g, ''), 10);
      if (Number.isFinite(n) && n > top) top = n;
    }
  } catch { /* an empty shelf is a fine answer */ }
  return String(top + 1).padStart(3, '0');
}

async function sign(key) {
  if (!key) return null;
  try { return await storage.url(key, { ttl: TTL }); } catch { return null; }
}

async function dress(row) {
  const url = await sign(row.storage_key);
  const cover = await sign(row.cover_key);
  let images = [];
  try {
    const { rows } = await db.query(
      'SELECT id, at_seconds, storage_key, caption FROM media_images WHERE media_id = $1 ORDER BY at_seconds ASC',
      [row.id]);
    for (const i of rows || []) {
      images.push({
        id: Number(i.id),
        at: Number(i.at_seconds) || 0,
        caption: i.caption || '',
        url: await sign(i.storage_key)
      });
    }
  } catch { images = []; }
  return {
    cover,
    images,
    id: Number(row.id),
    kind: row.kind,
    title: row.title,
    summary: row.summary || '',
    number: row.number || '',
    length: row.length_text || '',
    seconds: row.seconds || null,
    tags: (row.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
    links: safeList(row.links),
    topics: safeList(row.topics),
    transcript_len: row.transcript ? String(row.transcript).length : 0,
    treatment: row.treatment || '',
    bytes: Number(row.bytes) || null,
    original_bytes: Number(row.original_bytes) || null,
    mime: row.mime || '',
    state: row.state,
    pinned: Number(row.pinned) || 0,
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
          'SELECT * FROM media WHERE kind = $1 ORDER BY pinned DESC, created_at DESC LIMIT 200', [kind]);
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

        /* No number typed? Take the next one in the run. */
        const number = kind === 'audio'
          ? (clean(body.number, 12) || await nextNumber(body.after))
          : clean(body.number, 12);

        const { rows: made } = await db.query(
          `INSERT INTO media (kind, title, summary, number, length_text, seconds, tags,
                              storage_key, mime, bytes, original_bytes, treatment, state, who,
                              transcript, links, topics)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
          [kind, title, clean(body.summary, 2000), number,
            clean(body.length, 32), Number(body.seconds) || null, clean(body.tags, 300),
            key, mime, whole.length, Number(body.original_bytes) || null,
            clean(body.treatment, 600), body.publish === false ? 'draft' : 'published', door.who,
            body.transcript ? String(body.transcript).slice(0, 400000) : null,
            Array.isArray(body.links) ? JSON.stringify(body.links.slice(0, 10)) : null,
            Array.isArray(body.topics) ? JSON.stringify(body.topics.slice(0, 20)) : null]);

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

      /* Up to three held at the top of the page. A fourth pin pushes the
         oldest pin off rather than refusing \u2014 the limit is the point of
         the feature, and an error message would just be in the way. */
      case 'pin':
      case 'unpin': {
        const id = Number(body.id);
        if (!id) return res.status(400).json({ error: 'Which one?' });
        const { rows: found } = await db.query('SELECT kind FROM media WHERE id = $1', [id]);
        if (!found || !found[0]) return res.status(404).json({ error: 'There is no such item.' });
        const kind = found[0].kind;

        if (action === 'unpin') {
          await db.query('UPDATE media SET pinned = 0, updated_at = NOW() WHERE id = $1', [id]);
        } else {
          const { rows: pins } = await db.query(
            'SELECT id FROM media WHERE kind = $1 AND pinned > 0 AND id <> $2 ORDER BY pinned DESC',
            [kind, id]);
          const keep = (pins || []).slice(0, 2).map((r) => Number(r.id));
          const drop = (pins || []).slice(2).map((r) => Number(r.id));
          for (const old of drop) {
            await db.query('UPDATE media SET pinned = 0 WHERE id = $1', [old]);
          }
          /* Newest pin on top, the two it keeps below it. */
          await db.query('UPDATE media SET pinned = 3, updated_at = NOW() WHERE id = $1', [id]);
          if (keep[0]) await db.query('UPDATE media SET pinned = 2 WHERE id = $1', [keep[0]]);
          if (keep[1]) await db.query('UPDATE media SET pinned = 1 WHERE id = $1', [keep[1]]);
        }
        const { rows } = await db.query(
          'SELECT * FROM media WHERE kind = $1 ORDER BY pinned DESC, created_at DESC LIMIT 200', [kind]);
        const items = [];
        for (const r of rows || []) items.push(await dress(r));
        return res.json({ ok: true, items });
      }

      case 'next-number':
        return res.json({ ok: true, number: await nextNumber(body.after) });

      case 'edit': {
        const id = Number(body.id);
        if (!id) return res.status(400).json({ error: 'Which one?' });
        if (Array.isArray(body.links)) {
          await db.query('UPDATE media SET links = $2 WHERE id = $1',
            [id, JSON.stringify(body.links.slice(0, 10))]);
        }
        if (Array.isArray(body.topics)) {
          await db.query('UPDATE media SET topics = $2 WHERE id = $1',
            [id, JSON.stringify(body.topics.slice(0, 20))]);
        }
        if (body.transcript) {
          await db.query('UPDATE media SET transcript = $2 WHERE id = $1',
            [id, String(body.transcript).slice(0, 400000)]);
        }
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

      /* A new master for an item that already exists \u2014 what a cut or a
         merge produces when it is saved over the original rather than
         published beside it. */
      case 'replace': {
        const id = Number(body.id);
        const upload = clean(body.upload, 64);
        if (!id || !upload) return res.status(400).json({ error: 'Which one, and from what?' });

        const { rows } = await db.query('SELECT storage_key, kind FROM media WHERE id = $1', [id]);
        const was = rows && rows[0];
        if (!was) return res.status(404).json({ error: 'There is no such item.' });

        const { rows: parts } = await db.query(
          'SELECT part FROM media_chunks WHERE upload_id = $1 ORDER BY seq ASC', [upload]);
        if (!parts || !parts.length) return res.status(400).json({ error: 'Nothing arrived.' });
        const whole = Buffer.concat(parts.map((r) => Buffer.from(r.part, 'base64')));
        if (whole.length > MAX_BYTES) return res.status(413).json({ error: 'That is too large for the shelf.' });

        const mime = clean(body.mime, 80) || (was.kind === 'video' ? 'video/webm' : 'audio/mpeg');
        const ext = mime.includes('mpeg') ? 'mp3' : mime.includes('wav') ? 'wav'
          : mime.includes('webm') ? 'webm' : mime.includes('mp4') ? 'mp4' : 'bin';
        const key = (was.kind === 'video' ? 'films/' : 'episodes/') +
          Date.now() + '-' + Math.random().toString(36).slice(2, 10) + '.' + ext;

        await storage.put(key, whole, mime);
        await db.query('DELETE FROM media_chunks WHERE upload_id = $1', [upload]);
        await db.query(
          `UPDATE media SET storage_key = $2, mime = $3, bytes = $4, seconds = COALESCE($5, seconds),
                            length_text = COALESCE($6, length_text),
                            treatment = COALESCE($7, treatment), updated_at = NOW()
            WHERE id = $1`,
          [id, key, mime, whole.length, Number(body.seconds) || null,
            clean(body.length, 32) || null, clean(body.treatment, 600) || null]);
        if (was.storage_key && storage.delete) await storage.delete(was.storage_key).catch(() => {});

        const { rows: now } = await db.query('SELECT * FROM media WHERE id = $1', [id]);
        return res.json({ ok: true, item: await dress(now[0]) });
      }

      /* A picture: either the item's cover, or a plate cued to a moment in
         it, which the player raises as the recording reaches it. */
      case 'attach': {
        const id = Number(body.id);
        const upload = clean(body.upload, 64);
        if (!id || !upload) return res.status(400).json({ error: 'Which one, and from what?' });
        const role = clean(body.role, 8) === 'cover' ? 'cover' : 'cue';

        const { rows: parts } = await db.query(
          'SELECT part FROM media_chunks WHERE upload_id = $1 ORDER BY seq ASC', [upload]);
        if (!parts || !parts.length) return res.status(400).json({ error: 'No picture arrived.' });
        const whole = Buffer.concat(parts.map((r) => Buffer.from(r.part, 'base64')));
        if (whole.length > 12 * 1024 * 1024) return res.status(413).json({ error: 'That picture is over 12 MB.' });

        const mime = clean(body.mime, 60) || 'image/jpeg';
        const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp'
          : mime.includes('gif') ? 'gif' : 'jpg';
        const key = 'media-art/' + Date.now() + '-' + Math.random().toString(36).slice(2, 10) + '.' + ext;
        await storage.put(key, whole, mime);
        await db.query('DELETE FROM media_chunks WHERE upload_id = $1', [upload]);

        if (role === 'cover') {
          const { rows: old } = await db.query('SELECT cover_key FROM media WHERE id = $1', [id]);
          await db.query('UPDATE media SET cover_key = $2, updated_at = NOW() WHERE id = $1', [id, key]);
          const prev = old && old[0] && old[0].cover_key;
          if (prev && storage.delete) await storage.delete(prev).catch(() => {});
        } else {
          await db.query(
            'INSERT INTO media_images (media_id, at_seconds, storage_key, mime, caption) VALUES ($1,$2,$3,$4,$5)',
            [id, Math.max(0, Number(body.at) || 0), key, mime, clean(body.caption, 300)]);
        }

        const { rows: now } = await db.query('SELECT * FROM media WHERE id = $1', [id]);
        return res.json({ ok: true, item: await dress(now[0]) });
      }

      case 'drop-image': {
        const imageId = Number(body.image_id);
        if (!imageId) return res.status(400).json({ error: 'Which picture?' });
        const { rows } = await db.query('SELECT storage_key FROM media_images WHERE id = $1', [imageId]);
        const k = rows && rows[0] && rows[0].storage_key;
        await db.query('DELETE FROM media_images WHERE id = $1', [imageId]);
        if (k && storage.delete) await storage.delete(k).catch(() => {});
        return res.json({ ok: true });
      }

      case 'cue': {
        const imageId = Number(body.image_id);
        if (!imageId) return res.status(400).json({ error: 'Which picture?' });
        await db.query('UPDATE media_images SET at_seconds = $2, caption = COALESCE($3, caption) WHERE id = $1',
          [imageId, Math.max(0, Number(body.at) || 0), body.caption == null ? null : clean(body.caption, 300)]);
        return res.json({ ok: true });
      }

      case 'one': {
        const id = Number(body.id);
        const { rows } = await db.query('SELECT * FROM media WHERE id = $1', [id]);
        if (!rows || !rows[0]) return res.status(404).json({ error: 'There is no such item.' });
        return res.json({ ok: true, item: await dress(rows[0]) });
      }

      default:
        return res.status(400).json({ error: 'No such action.' });
    }
  } catch (err) {
    console.error('media:', err && err.message);
    return res.status(500).json({ error: 'The shelf refused that: ' + ((err && err.message) || 'unknown') });
  }
}
