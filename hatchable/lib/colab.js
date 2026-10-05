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
 * A worker is considered alive if it has been heard from in the last fifteen
 * minutes — the notebook heartbeats every two. Jobs go to the live worker with
 * the fewest jobs behind it, so several accounts share the load.
 */
import { db, config } from 'hatchable';
import { healthMap, markFailure, markSuccess } from './pool.js';

const ALIVE_MINUTES = 15;
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
export async function registerWorker({ label, endpoint, gpu, account, caps, model }) {
  const url = String(endpoint || '').replace(/\/+$/, '');
  if (!/^https:\/\/[\w.-]+/.test(url)) return { error: 'That is not a usable endpoint.' };
  const { rows } = await db.query(
    `INSERT INTO colab_workers (label, endpoint, gpu, account, caps, model)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (endpoint) DO UPDATE
       SET last_seen = NOW(), gpu = EXCLUDED.gpu, label = EXCLUDED.label,
           caps = EXCLUDED.caps, model = EXCLUDED.model
     RETURNING id, label, endpoint, gpu, account, caps, model, last_seen`,
    [String(label || 'Colab').slice(0, 60), url, String(gpu || '').slice(0, 80),
     String(account || '').slice(0, 120), String(caps || 'video').slice(0, 40),
     String(model || '').slice(0, 120) || null]
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

/**
 * The workers that are awake, in the order they should be tried.
 *
 * Two things shape that order. First capability: a notebook says what it can
 * do when it registers — video, image, chat, or all three — and a job only
 * goes to a machine that claims it. Second fairness and memory: workers are
 * ranked by how recently their *account* failed, then by queue depth, then
 * round-robin across distinct Google accounts, so two runtimes opened under
 * one login do not both get hammered while another account sits idle.
 *
 * A worker whose account is cooling off is moved to the back rather than
 * dropped — a cooled account is still better than no picture at all.
 */
export async function liveWorkers(opts = {}) {
  const caps = opts.caps ? String(opts.caps) : null;
  const { rows } = await db.query(
    `SELECT id, label, endpoint, gpu, account, caps, model, jobs, fails, last_seen
       FROM colab_workers
      WHERE last_seen > NOW() - INTERVAL '${ALIVE_MINUTES} minutes'
      ORDER BY jobs ASC, last_seen DESC`
  );
  let list = rows || [];
  if (caps) {
    list = list.filter((w) => {
      const have = String(w.caps || 'video').split(/[\s,]+/).filter(Boolean);
      return have.includes(caps) || have.includes('all');
    });
  }
  if (list.length < 2) return list;

  const health = await healthMap('colab');
  const now = Date.now();
  const scored = list.map((w, i) => {
    const key = String(w.account || w.endpoint);
    const h = health.get(key) || {};
    const cool = h.cooldown_until ? new Date(h.cooldown_until).getTime() : 0;
    return { w, i, key, cooling: cool > now ? cool : 0, fails: Number(h.fails) || 0 };
  }).sort((a, b) => (a.cooling - b.cooling) || (a.fails - b.fails) || (a.i - b.i));

  /* Interleave by account: one from each login before a second from any. */
  const byAccount = new Map();
  for (const s of scored) {
    if (!byAccount.has(s.key)) byAccount.set(s.key, []);
    byAccount.get(s.key).push(s.w);
  }
  const queues = [...byAccount.values()];
  const out = [];
  for (let round = 0; out.length < list.length; round++) {
    for (const q of queues) if (q[round]) out.push(q[round]);
    if (round > list.length) break;
  }
  return out;
}

/** Live workers that will serve a chat model. */
export async function chatWorkers() {
  return liveWorkers({ caps: 'chat' });
}

/** Live workers that will draw a still image. */
export async function imageWorkers() {
  return liveWorkers({ caps: 'image' });
}

const workerAccount = (w) => String(w.account || w.endpoint);

/**
 * One chat turn on the order's own GPU, OpenAI dialect, tools and all.
 * Returns null when no worker is awake, so callers simply move on.
 */
export async function colabChat({ system, messages, tools, temperature, maxTokens }) {
  const workers = await chatWorkers();
  if (!workers.length) return null;
  const secret = await colabSecret();

  for (const w of workers) {
    const r = await call(w.endpoint + '/v1/chat/completions', {
      method: 'POST',
      timeout: 180000,
      headers: Object.assign({ 'content-type': 'application/json' },
        secret ? { 'x-egregora-secret': secret } : {}),
      body: JSON.stringify({
        messages: [{ role: 'system', content: system }].concat(messages),
        tools: tools || undefined,
        temperature: typeof temperature === 'number' ? temperature : 0.7,
        max_tokens: maxTokens || 1200
      })
    });
    const msg = r.json && r.json.choices && r.json.choices[0] && r.json.choices[0].message;
    if (msg) {
      await markSuccess('colab', workerAccount(w));
      return { message: msg, model: w.model || 'open-weights', worker: w };
    }
    await noteWorkerFailure(w, 'chat ' + r.status + ' ' + String(r.text).slice(0, 120));
  }
  return null;
}

/** Remember that a worker let us down, and put its account on a cooldown. */
export async function noteWorkerFailure(w, why) {
  console.error('colab: worker failed', w.endpoint, String(why).slice(0, 200));
  await db.query('UPDATE colab_workers SET fails = fails + 1 WHERE id = $1', [w.id]).catch(() => {});
  await markFailure('colab', workerAccount(w), why);
}

/**
 * Hand a job to a live worker — a clip by default, a still if the payload
 * says `kind: 'image'`.
 *
 * Every suitable worker is tried in turn: a reclaimed Colab runtime that has
 * not yet timed out of the register will refuse or hang, and the next
 * account should pick the job up without the visitor ever knowing.
 */
export async function submitToColab(payload) {
  const workers = await liveWorkers({ caps: (payload && payload.kind === 'image') ? 'image' : 'video' });
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
      await markSuccess('colab', workerAccount(w));
      return { worker: w, jobId: r.json.id };
    }
    await noteWorkerFailure(w, 'refused ' + r.status + ' ' + String(r.text).slice(0, 120));
  }
  return null;
}

/**
 * A still image on the order's own GPU, start to finish.
 *
 * Unlike a clip, a picture is quick enough to wait for: the job is submitted,
 * polled for up to `budgetMs`, and the PNG comes back as bytes. If the worker
 * dies mid-render the next account is tried, which is the whole point of
 * keeping more than one notebook open.
 */
export async function colabImage(prompt, { budgetMs = 95000, model = 'flux-schnell' } = {}) {
  const workers = await imageWorkers();
  if (!workers.length) return null;
  const secret = await colabSecret();
  const headers = Object.assign({ 'content-type': 'application/json' },
    secret ? { 'x-egregora-secret': secret } : {});
  const started = Date.now();

  for (const w of workers) {
    const left = budgetMs - (Date.now() - started);
    if (left < 15000) break;
    const r = await call(w.endpoint + '/submit', {
      method: 'POST', headers,
      body: JSON.stringify({ prompt, model, kind: 'image' })
    });
    if (!r.ok || !r.json || !r.json.id) {
      await noteWorkerFailure(w, 'image refused ' + r.status);
      continue;
    }
    const id = r.json.id;
    let failed = null;
    while (Date.now() - started < budgetMs) {
      await new Promise((go) => setTimeout(go, 3000));
      const s = await colabStatus(w.endpoint, id);
      if (s && s.status === 'done') {
        const f = await colabFile(w.endpoint, id);
        if (f.bytes) {
          await markSuccess('colab', workerAccount(w));
          return { bytes: f.bytes, contentType: f.contentType || 'image/png', worker: w };
        }
        failed = f.error || 'empty file';
        break;
      }
      if (s && s.status === 'error') { failed = s.error || 'render failed'; break; }
    }
    await noteWorkerFailure(w, failed || 'image timed out');
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
    if (bytes.length < 2048) return { error: 'The worker returned an empty file.' };
    return { bytes, contentType: res.headers.get('content-type') || 'video/mp4' };
  } catch (err) {
    return { error: (err && err.message) || 'network error' };
  }
}
