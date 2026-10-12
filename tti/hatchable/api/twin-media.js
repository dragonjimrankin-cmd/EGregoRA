/**
 * POST /api/twin-media — the shelf the two houses keep as one shelf.
 *
 * Called only by the twin, signed with the shared secret. Three actions:
 *
 *   upsert  { twin_key, kind, title, … , file_url }  a listing to hold
 *   state   { twin_key, state }                      published, draft, archived
 *   remove  { twin_key }                             the twin took it down
 *
 * The bytes never cross. A recording is stored once, on the house that
 * published it, and what lands here is a listing that points at that house's
 * own /api/media-file endpoint — so this shelf plays the twin's recording
 * without holding a second copy of it.
 *
 * Two rules keep the mirror from running away with itself:
 *
 *   · A row this house received carries twin_origin. Such a row is never
 *     mirrored back, or the two houses would keep telling each other about the
 *     same change until the queue was full of echoes.
 *   · `remove` only ever touches a row that came from the twin. A letter from
 *     the other side cannot delete a recording this house owns.
 */
import { db } from 'hatchable';
import { verifySignature } from '../lib/twin.js';

export const access = 'public';
export const methods = ['POST'];

const clean = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
const STATES = ['draft', 'published', 'archived'];

/* Held as text in the column; the editor sends either shape. */
const asJson = (v) => {
  if (v == null || v === '') return null;
  if (typeof v === 'string') return v.slice(0, 20000);
  try { return JSON.stringify(v).slice(0, 20000); } catch { return null; }
};

export default async function (req, res) {
  if (!verifySignature(req)) {
    return res.status(401).json({ error: 'Not signed by the twin.' });
  }

  const body = req.body || {};
  const key = clean(body.twin_key, 80);
  if (!key) return res.status(400).json({ error: 'No twin_key.' });

  try {
    const { rows: have } = await db.query(
      'SELECT id, twin_origin FROM media WHERE twin_key = $1', [key]);
    const row = have[0];

    /* A letter from the twin cannot touch a recording this house owns. */
    if (row && !row.twin_origin) {
      return res.status(409).json({ error: 'That episode belongs to this house.' });
    }

    if (body.action === 'remove') {
      if (!row) return res.json({ ok: true, removed: false });
      await db.query('DELETE FROM media WHERE id = $1', [row.id]);
      return res.json({ ok: true, removed: true, id: Number(row.id) });
    }

    if (body.action === 'state') {
      const state = STATES.indexOf(clean(body.state, 12)) >= 0 ? clean(body.state, 12) : 'published';
      if (!row) return res.json({ ok: true, changed: false });
      await db.query('UPDATE media SET state = $2, updated_at = NOW() WHERE id = $1',
        [row.id, state]);
      return res.json({ ok: true, changed: true, id: Number(row.id), state });
    }

    if (body.action === 'upsert') {
      const kind = clean(body.kind, 8) === 'video' ? 'video' : 'audio';
      const title = clean(body.title, 200);
      if (!title) return res.status(400).json({ error: 'It needs a title.' });
      const state = STATES.indexOf(clean(body.state, 12)) >= 0 ? clean(body.state, 12) : 'published';
      const fileUrl = clean(body.file_url, 600);
      if (!fileUrl) return res.status(400).json({ error: 'No address to play it from.' });

      const values = [
        kind, title, clean(body.summary, 2000), clean(body.number, 12),
        clean(body.length, 32), Number(body.seconds) || null, clean(body.tags, 300),
        clean(body.mime, 80) || null, state,
        fileUrl, key, clean(body.from, 24) || 'twin',
        body.transcript ? String(body.transcript).slice(0, 400000) : null,
        asJson(body.links), asJson(body.topics),
        clean(body.purported_date, 24) || null
      ];

      if (row) {
        await db.query(
          `UPDATE media SET kind = $2, title = $3, summary = $4, number = $5,
                            length_text = $6, seconds = $7, tags = $8, mime = $9,
                            state = $10, remote_url = $11, twin_origin = $13,
                            transcript = COALESCE($14, transcript),
                            links = COALESCE($15, links),
                            topics = COALESCE($16, topics),
                            purported_date = COALESCE($17::date, purported_date),
                            updated_at = NOW()
             WHERE id = $1`,
          [row.id].concat(values));
        return res.json({ ok: true, updated: true, id: Number(row.id) });
      }

      const { rows: made } = await db.query(
        `INSERT INTO media (kind, title, summary, number, length_text, seconds, tags,
                            mime, state, remote_url, twin_key, twin_origin,
                            transcript, links, topics, purported_date, who, storage_key)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::date,$17,NULL)
         RETURNING id`,
        values.concat(['twin:' + (clean(body.from, 24) || 'twin')]));
      return res.json({ ok: true, created: true, id: Number(made[0].id) });
    }

    return res.status(400).json({ error: 'Unknown action.' });
  } catch (err) {
    console.error('twin-media failed', err && err.message);
    return res.status(500).json({ error: 'The mirror did not take.' });
  }
}
