/**
 * Kaggle as the order's GPU.
 *
 * Kaggle gives a verified account about thirty hours of free GPU time a week
 * — a T4 or a P100 — and its Notebooks API can be driven entirely over HTTP:
 * push a script, it is queued, it runs, and whatever it leaves in
 * /kaggle/working can be downloaded. That is slow and strange compared with
 * a proper inference endpoint, but it is a real GPU and it costs nothing.
 *
 *   push   → POST /api/v1/kernels/push      (the script, with machine_shape)
 *   status → GET  /api/v1/kernels/status    (QUEUED | RUNNING | COMPLETE | ERROR)
 *   output → GET  /api/v1/kernels/output    (a list of files with URLs)
 *
 * One kernel runs at a time per account, so this module also owns the lock:
 * video has first claim on the GPU and images only borrow it when no clip is
 * being made.
 */
import { config, db } from 'hatchable';
import { storedKaggleToken } from './key-store.js';

const API = 'https://www.kaggle.com/api/v1';
export const MACHINE = 'NvidiaTeslaT4';

export function kaggleToken() {
  try {
    const v = config.get('KAGGLE_API_TOKEN');
    if (v && String(v).trim()) return String(v).trim();
  } catch { /* not configured — fall through */ }
  return storedKaggleToken();
}

export function kaggleUser() {
  try {
    const v = config.get('KAGGLE_USERNAME');
    if (v && String(v).trim()) return String(v).trim();
  } catch { /* fall through */ }
  return null;
}

async function call(path, { method = 'GET', body = null, query = null, timeout = 45000 } = {}) {
  const token = kaggleToken();
  if (!token) return { error: 'No Kaggle token configured.' };

  let url = API + path;
  if (query) {
    const q = new URLSearchParams(query).toString();
    if (q) url += '?' + q;
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const r = await fetch(url, {
      method,
      signal: ctrl.signal,
      headers: Object.assign(
        { authorization: 'Bearer ' + token, accept: 'application/json' },
        body ? { 'content-type': 'application/json' } : {}
      ),
      body: body ? JSON.stringify(body) : undefined
    });
    const text = await r.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* not JSON */ }
    if (!r.ok) {
      return { error: `Kaggle ${path} returned ${r.status}: ` + String(text).slice(0, 200), status: r.status };
    }
    return json || { raw: text };
  } catch (err) {
    return { error: 'Kaggle ' + path + ' failed: ' + (err && err.message) };
  } finally {
    clearTimeout(timer);
  }
}

/* The account the bundled token belongs to, confirmed by introspection on
   the deploy runner. Used when nothing else answers. */
const KNOWN_USER = 'shakradragon';
let cachedUser = null;

/**
 * Who the token belongs to — needed because every kernel slug is
 * username/kernel. `kernels/list` has no "mine" filter, so the answer comes
 * from the OAuth introspection endpoint, which returns the username for a
 * KGAT token.
 */
export async function whoAmI() {
  const fixed = kaggleUser();
  if (fixed) return fixed;
  if (cachedUser) return cachedUser;

  const token = kaggleToken();
  if (!token) return null;
  try {
    const r = await fetch(API + '/oauth2/introspect', {
      method: 'POST',
      headers: {
        authorization: 'Bearer ' + token,
        'content-type': 'application/x-www-form-urlencoded',
        accept: 'application/json'
      },
      body: 'token=' + encodeURIComponent(token)
    });
    if (r.ok) {
      const j = await r.json();
      if (j && j.active && j.username) {
        cachedUser = String(j.username);
        return cachedUser;
      }
    }
  } catch (err) {
    console.error('kaggle: introspection failed', err && err.message);
  }
  return KNOWN_USER;
}

/**
 * Push a script to Kaggle and start it on a GPU.
 * @returns {Promise<{slug:string,url:string,version:number}|{error:string}>}
 */
export async function pushKernel({ slug, title, code, internet = true }) {
  const user = await whoAmI();
  if (!user) {
    return { error: 'Could not work out the Kaggle username for this token. Set KAGGLE_USERNAME.' };
  }
  const full = `${user}/${slug}`;
  /* Kaggle slugs a kernel from its title, so the title must be the slug
     verbatim or the push lands on a different kernel than the one polled. */
  const out = await call('/kernels/push', {
    method: 'POST',
    body: {
      slug: full,
      new_title: slug,
      text: code,
      language: 'python',
      kernel_type: 'script',
      is_private: true,
      enable_internet: internet,
      machine_shape: MACHINE,
      enable_gpu: true
    },
    timeout: 90000
  });
  if (out.error) return out;
  if (out.error_message) return { error: String(out.error_message).slice(0, 300) };
  return { slug: full, url: out.url || `https://www.kaggle.com/code/${full}`, version: out.versionNumber || out.version_number || 0 };
}

/** QUEUED | RUNNING | COMPLETE | ERROR | CANCEL_* */
export async function kernelStatus(fullSlug) {
  const [userName, kernelSlug] = String(fullSlug).split('/');
  const out = await call('/kernels/status', { query: { userName, kernelSlug } });
  if (out.error) return out;
  return {
    status: String(out.status || out.state || '').toUpperCase(),
    message: out.failureMessage || out.failure_message || null
  };
}

/** The files a finished kernel left behind. */
export async function kernelOutput(fullSlug) {
  const [userName, kernelSlug] = String(fullSlug).split('/');
  const out = await call('/kernels/output', { query: { userName, kernelSlug } });
  if (out.error) return out;
  const files = out.files || out.Files || [];
  return {
    files: files.map((f) => ({
      name: f.fileName || f.name || '',
      url: f.url || f.fileUrl || ''
    })).filter((f) => f.url),
    log: out.log || null
  };
}

/** Download one of those files as bytes. */
export async function fetchOutput(url) {
  const token = kaggleToken();
  const r = await fetch(url, { headers: { authorization: 'Bearer ' + token } });
  if (!r.ok) return { error: 'Kaggle output download returned ' + r.status };
  const buf = new Uint8Array(await r.arrayBuffer());
  return { bytes: buf, contentType: r.headers.get('content-type') || 'application/octet-stream' };
}

/* ------------------------------------------------------------- the lock
 *
 * One GPU, one kernel. Video has the first claim on it; the image generator
 * only reaches for Kaggle when nothing is being filmed.
 */

export async function gpuBusy() {
  const { rows } = await db.query(
    `SELECT kind, slug, started_at FROM gpu_jobs
      WHERE status IN ('queued','running') AND started_at > NOW() - interval '45 minutes'
      ORDER BY started_at DESC LIMIT 1`
  ).catch(() => ({ rows: [] }));
  return rows[0] || null;
}

export async function claimGpu(kind, slug) {
  const held = await gpuBusy();
  if (held) return { ok: false, held };
  await db.query(
    "INSERT INTO gpu_jobs (kind, slug, status) VALUES ($1, $2, 'queued')",
    [kind, slug]
  ).catch(() => {});
  return { ok: true };
}

export async function releaseGpu(slug, status = 'done') {
  await db.query(
    'UPDATE gpu_jobs SET status = $1, finished_at = NOW() WHERE slug = $2',
    [status, slug]
  ).catch(() => {});
}
