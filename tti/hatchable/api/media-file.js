/**
 * GET /api/media-file?id=N — the address the twin shelf plays an episode from.
 *
 * Store links are signed and expire in a week, so a shelf that stored one
 * would fall silent seven days later. This endpoint is stable instead: it is
 * asked at play time and answers with a freshly signed link to the file, or
 * with a redirect onward when the recording actually lives on the twin.
 *
 * Only what is published is served. A draft, an archived episode and anything
 * that has been taken down answer 404, so this is not a way around the shelf.
 */
import { db, storage } from 'hatchable';

export const access = 'public';
export const methods = ['GET'];

const TTL = 604800;   /* a week, the same as the shelf signs for itself */

export default async function (req, res) {
  const q = req.query || {};
  const id = Number(q.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: 'Which episode?' });
  }

  try {
    const { rows } = await db.query(
      `SELECT storage_key, remote_url, mime, state FROM media WHERE id = $1`, [id]);
    const row = rows && rows[0];

    if (!row || row.state !== 'published') {
      return res.status(404).json({ error: 'There is nothing published under that number.' });
    }

    /* The recording lives on the twin: pass the ask along rather than holding
       a copy here. One hop only — if the twin also points onward it is the
       twin's own shelf that resolves it. */
    if (!row.storage_key && row.remote_url) {
      res.setHeader('location', row.remote_url);
      return res.status(302).end();
    }
    if (!row.storage_key) {
      return res.status(410).json({ error: 'The file behind that episode is no longer here.' });
    }

    let url = null;
    try { url = await storage.url(row.storage_key, { ttl: TTL }); } catch { url = null; }
    if (!url) return res.status(502).json({ error: 'The store would not sign a link to it.' });

    res.setHeader('location', url);
    res.setHeader('cache-control', 'no-store');
    return res.status(302).end();
  } catch (err) {
    console.error('media-file failed', err && err.message);
    return res.status(500).json({ error: 'That could not be fetched.' });
  }
}
