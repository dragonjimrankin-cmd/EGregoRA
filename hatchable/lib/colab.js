/**
 * Colab workers.
 *
 * Google Colab has no API an application can log into — a notebook is opened
 * by a human, in a browser, under their own Google account. So the connection
 * runs the other way round: the notebook in `colab/egregora-gpu.ipynb` starts a
 * small HTTP server on the Colab machine, opens a public tunnel to it, and
 * registers that URL here. From then on this project can send it work exactly
 * as if it were any other inference provider, and the account it belongs to
 * never has to be handed over.
 *
 * A worker is considered alive if it has been heard from in the last six
 * minutes — the notebook heartbeats every two. Jobs go to the live worker with
 * the fewest jobs behind it, so several accounts share the load.
 */
import { db, config } from 'hatchable';

const ALIVE_MINUTES = 6;
const TIMEOUT = 25000;

export async function colabSecret() {
  try { return (await config.get('COLAB_SECRET')) || null; } catch { return null; }
}

async function call(url, opts = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeout || TIMEOUT);
  try {
    const r = await fetch(url, Object.assign({ signal: ctrl.signal }, opts));
    const text = await r.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { /* not json */ }
    return { ok: r.ok, status: r.status, json, text };
  } catch (err) {
    return { ok: false, status: 0, json: null, text: (err && err.message) || 'network error' };
  } finally {
    clearTimeout(timer);
  }
}

/** Announce a worker, or refresh one already known by the same endpoint. */
export async function registerWorker({ label, endpoint, gpu, account }) {
  const url = String(endpoint || '').replace(/\/+$/, '');
  if (!/^https:\/\/[\w.-]+/.test(url)) return { error: 'That is not a usable endpoint.' };
  const rows = await db.query(
    `INSERT INTO colab_workers (label, endpoint, gpu, account)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (endpoint) DO UPDATE
       SET last_seen = NOW(), gpu = EXCLUDED.gpu, label = EXCLUDED.label
     RETURNING id, label, endpoint, gpu, account, last_seen`,
    [String(label || 'Colab').slice(0, 60), url, String(gpu || '').slice(0, 80),
     String(account || '').slice(0, 120)]
  );
  return { worker: (rows && rows[0]) || null };
}

export async function heartbeat(endpoint) {
  const url = String(endpoint || '').replace(/\/+$/, '');
  await db.query('UPDATE colab_workers SET last_seen = NOW() WHERE endpoint = $1', [url]);
  return { ok: true };
}

export async function retireWorker(endpoint) {
  await db.query('DELETE FROM colab_workers WHERE endpoint = $1',
    [String(endpoint || '').replace(/\/+$/, '')]);
  return { ok: true };
}

export async function liveWorkers() {
  const rows = await db.query(
    `SELECT id, label, endpoint, gpu, account, jobs, last_seen
       FROM colab_workers
      WHERE last_seen > NOW() - INTERVAL '${ALIVE_MINUTES} minutes'
      ORDER BY jobs ASC, last_seen DESC`
  );
  return rows || [];
}

/** Hand a clip to the least-busy live worker. */
export async function submitToColab(payload) {
  const workers = await liveWorkers();
  if (!workers.length) return null;
  const secret = await colabSecret();

  for (const w of workers) {
    const r = await call(w.endpoint + '/submit', {
      method: 'POST',
      headers: Object.assign({ 'content-type': 'application/json' },
        secret ? { 'x-egregora-secret': secret } : {}),
      body: JSON.stringify(payload)
    });
    if (r.ok && r.json && r.json.id) {
      await db.query('UPDATE colab_workers SET jobs = jobs + 1 WHERE id = $1', [w.id]);
      return { worker: w, jobId: r.json.id };
    }
    console.error('colab: worker refused', w.endpoint, r.status, String(r.text).slice(0, 200));
  }
  return null;
}

/** Ask a worker how a job is getting on. */
export async function colabStatus(endpoint, jobId) {
  const r = await call(endpoint + '/job?id=' + encodeURIComponent(jobId));
  if (!r.ok || !r.json) return { status: 'running' };
  return r.json;
}

/** Pull the finished file off a worker. */
export async function colabFile(endpoint, jobId) {
  try {
    const res = await fetch(endpoint + '/file?id=' + encodeURIComponent(jobId));
    if (!res.ok) return { error: 'HTTP ' + res.status };
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.length < 4096) return { error: 'The worker returned an empty file.' };
    return { bytes, contentType: res.headers.get('content-type') || 'video/mp4' };
  } catch (err) {
    return { error: (err && err.message) || 'network error' };
  }
}
