/**
 * POST /api/keeper — the keeper's key.
 *
 * A small door for whoever is minding the order's machines. It is opened
 * with a passcode typed into the page, and behind it are the only two
 * questions worth asking when a generation is stuck: *who asked for this*,
 * and *may I let the GPU go?*
 *
 * The passcode lives in config as KEEPER_PASSCODE and falls back to the one
 * the order was given. It is checked here, on the server, and never sent to
 * the browser — the page only ever learns whether it was right.
 *
 * Actions
 *   { action: 'open',   pass }            who asked for what, and the state
 *                                         of every GPU the order can reach
 *   { action: 'release', pass, id? }      free the Kaggle lock: one job by
 *                                         id, or whatever is holding it
 */
import { db, config } from 'hatchable';
import { gpuBusy, releaseGpu } from '../lib/kaggle.js';
import { liveWorkers, sortByFree } from '../lib/colab.js';

export const access = 'public';
export const methods = ['POST'];

const FALLBACK = '1133';

async function passcode() {
  try {
    const set = await config.get('KEEPER_PASSCODE');
    if (set && String(set).trim()) return String(set).trim();
  } catch { /* not configured */ }
  return FALLBACK;
}

const when = (t) => (t ? new Date(t).toISOString().replace('T', ' ').slice(0, 19) + ' UTC' : null);
const ago = (t) => (t ? Math.round((Date.now() - new Date(t).getTime()) / 1000) : null);

/** Everything generated lately, and who asked for it. */
async function recent(limit) {
  const out = [];
  try {
    const { rows } = await db.query(
      `SELECT id, kind, prompt, provider, model, status, asker_name, created_at, updated_at, error
         FROM videos ORDER BY created_at DESC LIMIT $1`, [limit]
    );
    for (const r of rows || []) {
      out.push({
        id: r.id,
        kind: r.kind || 'video',
        who: r.asker_name || 'not given',
        asked: String(r.prompt || '').slice(0, 160),
        provider: r.provider || null,
        model: r.model || null,
        status: r.status,
        error: r.error || null,
        at: when(r.created_at),
        age_s: ago(r.created_at)
      });
    }
  } catch (err) {
    console.error('keeper: could not read the job log', err && err.message);
  }
  return out;
}

/** The pictures drawn on the quick routes, which never become jobs. */
async function drawings(limit) {
  try {
    const { rows } = await db.query(
      `SELECT id, asker_name, question, created_at FROM questions
        WHERE limb = 'image' ORDER BY created_at DESC LIMIT $1`, [limit]
    );
    return (rows || []).map((r) => ({
      id: r.id,
      who: r.asker_name || 'not given',
      asked: String(r.question || '').slice(0, 160),
      at: when(r.created_at),
      age_s: ago(r.created_at)
    }));
  } catch {
    return [];
  }
}

export default async function (req, res) {
  const body = req.body || {};
  const given = String(body.pass || '').trim();
  const want = await passcode();

  if (!given) return res.status(400).json({ error: 'The key is needed.' });
  if (given !== want) {
    /* Slow a guesser down a little without locking the keeper out. */
    await new Promise((go) => setTimeout(go, 900));
    return res.status(403).json({ error: 'That is not the key.' });
  }

  const action = String(body.action || 'open');

  if (action === 'release') {
    const held = await gpuBusy();
    const id = body.id ? Number(body.id) : null;
    if (!held && !id) {
      return res.json({ ok: true, freed: false, message: 'The GPU was not being held \u2014 nothing to free.' });
    }
    try {
      if (id) {
        await db.query("UPDATE gpu_jobs SET status = 'cancelled', finished_at = NOW() WHERE id = $1", [id]);
      } else {
        await releaseGpu(held.slug, 'cancelled');
        /* Belt and braces: anything else still marked live is cleared too,
           because a half-finished row is exactly what wedges the lock. */
        await db.query(
          "UPDATE gpu_jobs SET status = 'cancelled', finished_at = NOW() WHERE status IN ('queued','running')"
        );
      }
      return res.json({
        ok: true,
        freed: true,
        message: 'The Kaggle GPU is free. Anything that was actually running on Kaggle will finish on its ' +
          'own and be ignored; the next request can claim the machine straight away.'
      });
    } catch (err) {
      return res.status(500).json({ error: 'Could not free it: ' + ((err && err.message) || 'unknown') });
    }
  }

  /* action: open */
  const held = await gpuBusy();
  let workers = [];
  try {
    const live = await liveWorkers();
    const { free, rest } = await sortByFree(live, { timeout: 3500 });
    const tag = (w, state) => ({
      label: w.label, gpu: w.gpu, account: w.account || null,
      caps: w.caps || 'video', jobs: w.jobs, state
    });
    workers = free.map((w) => tag(w, 'free')).concat(rest.map((w) => tag(w, 'busy or silent')));
    if (live.length === 1) workers = live.map((w) => tag(w, 'awake'));
  } catch (err) {
    console.error('keeper: could not read the worker pool', err && err.message);
  }

  res.json({
    ok: true,
    kaggle: held
      ? {
          held: true, kind: held.kind, slug: held.slug,
          since: when(held.started_at), age_s: ago(held.started_at),
          stale: ago(held.started_at) > 2700
        }
      : { held: false },
    workers,
    jobs: await recent(12),
    drawings: await drawings(12)
  });
}
