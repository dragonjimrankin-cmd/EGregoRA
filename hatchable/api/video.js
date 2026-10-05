/**
 * /api/video — the fox's film camera.
 *
 *   POST { prompt, aspect?, name? }  → queues a 480p HunyuanVideo 1.5 clip,
 *                                      returns { id, status: 'queued' }.
 *   GET  ?id=123                     → { status, url?, error? }
 *
 * Generation takes about three minutes, which no web request should sit
 * through, so the browser polls. Finished clips are copied into this
 * project's own storage by lib/videogen.js.
 */
import { db } from 'hatchable';
import { submitVideo, pollVideo } from '../lib/videogen.js';
import { requireStudio } from '../lib/accounts.js';

export const access = 'public';
export const methods = ['GET', 'POST'];

const MAX_PROMPT = 1200;

export default async function (req, res) {
  const body = req.body || {};
  const query = req.query || {};
  const id = Number(query.id || body.id || 0);

  /* ---- status ---- */
  if (req.method === 'GET' || (!body.prompt && id)) {
    if (!id) return res.status(400).json({ error: 'No clip id given.' });
    const { rows } = await db.query(
      'SELECT id, prompt, provider, model, request_id, status_url, response_url, status, url, error FROM videos WHERE id = $1',
      [id]
    );
    const row = rows[0];
    if (!row) return res.status(404).json({ error: 'No such clip.' });
    if (row.status === 'ready' || row.status === 'failed') {
      return res.json({ id: row.id, status: row.status, url: row.url, error: row.error, model: row.model, prompt: row.prompt });
    }

    const out = await pollVideo(row);
    if (out.status === 'ready') {
      await db.query('UPDATE videos SET status = $1, url = $2, storage_key = $3, updated_at = NOW() WHERE id = $4',
        ['ready', out.url, out.key || null, id]);
    } else if (out.status === 'failed') {
      await db.query('UPDATE videos SET status = $1, error = $2, updated_at = NOW() WHERE id = $3',
        ['failed', out.error || 'failed', id]);
    } else if (row.status === 'queued') {
      await db.query("UPDATE videos SET status = 'running', updated_at = NOW() WHERE id = $1", [id]);
    }
    return res.json({ id, status: out.status, url: out.url, error: out.error, model: row.model, prompt: row.prompt });
  }

  /* ---- submit ---- */
  const door = await requireStudio(req);
  if (!door.ok) return res.status(door.status).json({ error: door.error, gate: door.reason });

  const prompt = String(body.prompt || '').trim();
  const name = String(body.name || '').trim().slice(0, 80);
  const aspect = body.aspect === '9:16' ? '9:16' : '16:9';

  if (prompt.length < 3) return res.status(400).json({ error: 'Say what the clip should show.' });
  if (prompt.length > MAX_PROMPT) {
    return res.status(400).json({ error: `Trim the prompt to ${MAX_PROMPT} characters.` });
  }

  const job = await submitVideo(prompt, { aspect });
  if (job.error) return res.status(503).json({ error: job.error });

  const { rows } = await db.query(
    `INSERT INTO videos (prompt, provider, model, request_id, status_url, response_url, status, asker_name)
     VALUES ($1, $2, $3, $4, $5, $6, 'queued', $7) RETURNING id`,
    [prompt, job.provider, job.model, job.requestId, job.statusUrl, job.responseUrl, name || null]
  );

  res.json({
    id: rows[0].id,
    status: 'queued',
    model: job.model,
    note: 'About three minutes for five seconds of 480p. The page will keep checking.'
  });
}
