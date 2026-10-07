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
import { submitVideo, pollVideo, VIDEO_MODELS } from '../lib/videogen.js';
import { requireStudio } from '../lib/accounts.js';
import {
  readSheet, extendSheet, composePrompt, describeSheet, seedFor, normaliseSheet, isEmptySheet
} from '../lib/continuity.js';

export const access = 'public';
export const methods = ['GET', 'POST'];

const MAX_PROMPT = 1200;

export default async function (req, res) {
  const body = req.body || {};
  const query = req.query || {};
  const id = Number(query.id || body.id || 0);

  /* ---- the models on offer ---- */
  if (req.method === 'GET' && (query.models === '1' || query.models === 'true')) {
    return res.json({
      models: Object.entries(VIDEO_MODELS).map(([key, m]) => ({
        key, label: m.label, note: m.note, own_gpu: Boolean(m.kaggle)
      }))
    });
  }

  /* ---- status ---- */
  if (req.method === 'GET' || (!body.prompt && id)) {
    if (!id) return res.status(400).json({ error: 'No clip id given.' });
    const { rows } = await db.query(
      `SELECT id, prompt, provider, model, request_id, status_url, response_url, status, url,
              error, kind, sheet, seed, parent_id, progress, hardware, created_at
         FROM videos WHERE id = $1`,
      [id]
    );
    const row = rows[0];
    if (!row) return res.status(404).json({ error: 'No such clip.' });

    const sheet = parseSheet(row.sheet);
    const base = {
      id: row.id,
      model: row.model,
      prompt: row.prompt,
      kind: row.kind || 'video',
      hardware: row.hardware || null,
      sheet,
      carried: sheet ? describeSheet(sheet) : null,
      seed: row.seed ? Number(row.seed) : null,
      parent: row.parent_id ? Number(row.parent_id) : null
    };

    if (row.status === 'ready' || row.status === 'failed') {
      return res.json({ ...base, status: row.status, url: row.url, error: row.error,
        progress: row.status === 'ready' ? 100 : (row.progress || 0), measured: true });
    }

    const out = await pollVideo(row, body.byok || null);
    const pct = out.status === 'ready' ? 100
      : Math.max(Number(row.progress) || 0, Number(out.progress) || 0);   // never goes backwards

    if (out.status === 'ready') {
      await db.query(
        'UPDATE videos SET status = $1, url = $2, storage_key = $3, progress = 100, updated_at = NOW() WHERE id = $4',
        ['ready', out.url, out.key || null, id]);
    } else if (out.status === 'failed') {
      await db.query('UPDATE videos SET status = $1, error = $2, updated_at = NOW() WHERE id = $3',
        ['failed', out.error || 'failed', id]);
    } else {
      await db.query(
        `UPDATE videos SET status = CASE WHEN status = 'queued' THEN 'running' ELSE status END,
                           progress = $2,
                           hardware = COALESCE($3, hardware),
                           updated_at = NOW()
          WHERE id = $1`,
        [id, pct, out.hardware || null]);
    }

    return res.json({
      ...base,
      status: out.status,
      url: out.url,
      error: out.error,
      progress: pct,
      measured: Boolean(out.measured),
      stage: out.stage || null,
      hardware: out.hardware || row.hardware || null
    });
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

  /* ---- continuation -----------------------------------------------------
     `from` is the id of the shot this one grows out of, `frame` the picture
     the page captured from it. The characters, the place, the camera and the
     light come across verbatim from the parent's sheet; only the action here
     is new; the seed is inherited so the noise does not change the world. */
  const fromId = Number(body.from || 0) || null;
  let parent = null;
  if (fromId) {
    const { rows: pr } = await db.query(
      'SELECT id, prompt, sheet, seed, url, kind FROM videos WHERE id = $1', [fromId]);
    parent = pr[0] || null;
  }

  let sheet = parent
    ? extendSheet(parseSheet(parent.sheet) || readSheet(parent.prompt), prompt)
    : (body.sheet && !isEmptySheet(body.sheet) ? normaliseSheet(body.sheet) : readSheet(prompt));

  const sent = parent ? composePrompt(sheet, prompt, { continuesFrom: true }) : prompt;
  const seed = parent ? seedFor(sheet, parent.seed) : seedFor(sheet, body.seed);
  const initUrl = String(body.frame || (parent && parent.kind === 'image' ? parent.url : '') || '').trim() || null;

  const job = await submitVideo(sent, {
    aspect, model: body.model, seed, initUrl, frames: body.frames, byok: body.byok
  });
  if (job.error) return res.status(503).json({ error: job.error });

  const { rows } = await db.query(
    `INSERT INTO videos (prompt, provider, model, request_id, status_url, response_url, status,
                         asker_name, sheet, parent_id, seed, init_url, hardware, progress)
     VALUES ($1, $2, $3, $4, $5, $6, 'queued', $7, $8, $9, $10, $11, $12, 1) RETURNING id`,
    [sent, job.provider, job.model, job.requestId, job.statusUrl, job.responseUrl, name || null,
     JSON.stringify(sheet), parent ? parent.id : null, seed, initUrl, job.hardware || null]
  );

  res.json({
    id: rows[0].id,
    status: 'queued',
    model: job.model,
    hardware: job.hardware || null,
    progress: 1,
    seed,
    sheet,
    carried: parent ? describeSheet(sheet) : null,
    prompt: sent,
    from_frame: Boolean(initUrl),
    note: 'About three minutes for five seconds of 480p. The page will keep checking.'
  });
}

/** The sheet is stored as JSON text; a bad row must never break a poll. */
function parseSheet(raw) {
  if (!raw) return null;
  try {
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return isEmptySheet(obj) ? null : normaliseSheet(obj);
  } catch { return null; }
}
