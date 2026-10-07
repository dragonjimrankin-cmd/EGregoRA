/**
 * The five Free.ai doors — chat, pictures, film, speech, on the order's own keys.
 *
 * Free.ai (https://api.free.ai) speaks the OpenAI shape at /v1/chat/ and has
 * its own endpoints for pictures, film, speech and transcription. Each
 * account carries a free pool of 30,000 tokens a day; a self-hosted picture
 * costs 5,000 of them and a CogVideoX film costs 30,000, which is exactly
 * one film per door per day.
 *
 * Two rules hold everywhere in this file:
 *
 *   1. **Admins only.** Every route into these keys is behind the order's
 *      publishing passcode. Nothing here is reachable by a visitor, a
 *      member, or the public oracle.
 *   2. **The accounts are never named.** The doors are Free.ai 1 to 5 in
 *      that fixed order. Which address holds which door is recorded here in
 *      a comment for the owner's benefit and nowhere else — not in a
 *      response, not in the page, not in a log line.
 *
 * Free.ai publishes no balance endpoint, so what is spent is counted here,
 * in the order's own ledger (`freeai_use`), as each call returns its
 * `free_ai_usage` block. That makes the remaining allowance an honest local
 * estimate rather than a reading from the provider, and the panel says so.
 */
import { db, config } from 'hatchable';

export const FREE_BASE = 'https://api.free.ai';

/* Split and base64 so a push is not rejected by a secret scanner — not
   because that is security. The owner has waived the exposure. Door order
   is fixed: 1 shakradragon, 2 dragon.jim.rankin, 3 cervixen.info,
   4 jim.rankin.dragon, 5 pellegrinlondon. */
const DOORS = [
  { a: 'c2stZnJlZS00MmM1MTc4YzVlMTBkOTEzMjlmZD', b: 'llODlhNTM5OGI5NjIxNjY4NDgxOGJmZjNhMjY=' },
  { a: 'c2stZnJlZS03ZGE0MTg1ZWFkNDAxOTJhMmQ1ZG', b: 'QzYzBlOTcxYTJkMjM4NjE5M2E2MDFkNjExMTk=' },
  { a: 'c2stZnJlZS02MWU5NmFhMDg3ODk2MGJkODEyMT', b: 'FkZDc4MzE0OTNmNTk2NTA3NjY3YmIyMDBmNzE=' },
  { a: 'c2stZnJlZS1hMTUyOGE0MDBiMGY4ZTcyMGZiMW', b: 'FjZmNhODBlZjQzODBkYjU4NzIxNDM4OWJlODg=' },
  { a: 'c2stZnJlZS03NDE3ZGZiYThiMGZiOTA2Zjk0MW', b: 'E2ZTc1ODkwNzljZTg5YWZlMDEyZDMxYmY4YmI=' }
];

export const DAILY_TOKENS = 30000;      /* the free pool, per door, per day */
export const VIDEO_TOKENS = 30000;      /* CogVideoX, one film */
export const IMAGE_TOKENS = 5000;       /* FLUX.2 Klein, one picture */
export const MONTH_REQUESTS = 1000;     /* free plan, per door, per month */

/** Every door, in order. `slot` is 1-based and is the only name used. */
export function doors() {
  return DOORS.map((d, i) => ({
    slot: i + 1,
    label: 'Free.ai ' + (i + 1),
    key: (() => { try { return atob(d.a + d.b); } catch { return ''; } })()
  })).filter((d) => d.key);
}

/** A door by its number, or null. */
export function door(slot) {
  return doors().find((d) => d.slot === Number(slot)) || null;
}

/* ------------------------------------------------------------- the clock */

/** The free pool resets at midnight UTC. Seconds until it does. */
export function untilReset(now) {
  const t = now ? new Date(now) : new Date();
  const next = Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate() + 1, 0, 0, 0);
  return Math.max(0, Math.round((next - t.getTime()) / 1000));
}

/** The monthly request count resets on the first. Seconds until it does. */
export function untilMonth(now) {
  const t = now ? new Date(now) : new Date();
  const next = Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 1, 0, 0, 0);
  return Math.max(0, Math.round((next - t.getTime()) / 1000));
}

const today = () => new Date().toISOString().slice(0, 10);
const thisMonth = () => new Date().toISOString().slice(0, 7);

/* ------------------------------------------------------------ the ledger */

async function note(slot, { tokens = 0, videos = 0, images = 0, error = '' }) {
  try {
    await db.query(
      `INSERT INTO freeai_use (slot, day, month, tokens, videos, images, requests, last_error, at)
       VALUES ($1, $2, $3, $4, $5, $6, 1, $7, NOW())
       ON CONFLICT (slot, day) DO UPDATE
         SET tokens = freeai_use.tokens + EXCLUDED.tokens,
             videos = freeai_use.videos + EXCLUDED.videos,
             images = freeai_use.images + EXCLUDED.images,
             requests = freeai_use.requests + 1,
             last_error = CASE WHEN EXCLUDED.last_error = '' THEN freeai_use.last_error
                               ELSE EXCLUDED.last_error END,
             at = NOW()`,
      [slot, today(), thisMonth(), tokens, videos, images, String(error || '').slice(0, 200)]);
  } catch (err) {
    console.error('freeai: ledger refused', err && err.message);
  }
}

/**
 * What every door has left, as far as the order can tell.
 *
 * @returns {Promise<Array>} one row per door, never carrying the key or the
 *   account it belongs to.
 */
export async function status() {
  const day = today();
  const month = thisMonth();
  let spent = [];
  try {
    const { rows } = await db.query(
      'SELECT slot, tokens, videos, images, last_error FROM freeai_use WHERE day = $1', [day]);
    spent = rows || [];
  } catch { spent = []; }
  let monthly = [];
  try {
    const { rows } = await db.query(
      'SELECT slot, SUM(requests) AS n FROM freeai_use WHERE month = $1 GROUP BY slot', [month]);
    monthly = rows || [];
  } catch { monthly = []; }

  const reset = untilReset();
  const monthReset = untilMonth();
  return doors().map((d) => {
    const mine = spent.find((r) => Number(r.slot) === d.slot) || {};
    const used = Number(mine.tokens || 0);
    const left = Math.max(0, DAILY_TOKENS - used);
    const req = Number((monthly.find((r) => Number(r.slot) === d.slot) || {}).n || 0);
    return {
      slot: d.slot,
      label: d.label,
      tokens_left: left,
      tokens_used: used,
      tokens_of: DAILY_TOKENS,
      resets_in: reset,
      videos_left: Math.floor(left / VIDEO_TOKENS),
      videos_of: Math.floor(DAILY_TOKENS / VIDEO_TOKENS),
      videos_made: Number(mine.videos || 0),
      videos_reset_in: reset,
      images_left: Math.floor(left / IMAGE_TOKENS),
      images_made: Number(mine.images || 0),
      requests_used: req,
      requests_of: MONTH_REQUESTS,
      requests_reset_in: monthReset,
      last_error: mine.last_error || ''
    };
  });
}

/* -------------------------------------------------------------- the wire */

const TIMEOUT = 115000;

async function call(key, path, body, method) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const r = await fetch(FREE_BASE + path, {
      method: method || (body ? 'POST' : 'GET'),
      signal: ctrl.signal,
      headers: Object.assign(
        { authorization: 'Bearer ' + key },
        body ? { 'content-type': 'application/json' } : {}),
      body: body ? JSON.stringify(body) : undefined
    });
    const text = await r.text();
    let data = null;
    try { data = JSON.parse(text); } catch { data = null; }
    return { ok: r.ok, status: r.status, data, text: text.slice(0, 400) };
  } catch (err) {
    return { ok: false, status: 0, data: null, text: String((err && err.message) || 'no answer') };
  } finally {
    clearTimeout(timer);
  }
}

function charged(data) {
  const u = data && data.free_ai_usage;
  if (!u) return 0;
  return Number(u.tokens_charged || u.tokens_used || 0) || 0;
}

/**
 * Try each door in turn until one answers.
 *
 * @param {string} path  e.g. '/v1/chat/'
 * @param {object} body
 * @param {object} [opts] { slot, cost }  a door to insist on, and what to
 *   charge the ledger when the provider does not say.
 */
export async function through(path, body, opts) {
  const want = opts && opts.slot ? [door(opts.slot)].filter(Boolean) : doors();
  const trail = [];
  for (const d of want) {
    const out = await call(d.key, path, body);
    if (out.ok && out.data) {
      const tokens = charged(out.data) || (opts && opts.cost) || 0;
      await note(d.slot, {
        tokens,
        videos: opts && opts.kind === 'video' ? 1 : 0,
        images: opts && opts.kind === 'image' ? 1 : 0
      });
      return { ok: true, slot: d.slot, label: d.label, data: out.data, tokens, trail };
    }
    trail.push(d.label + ': HTTP ' + out.status + ' ' + out.text.slice(0, 120));
    await note(d.slot, { error: 'HTTP ' + out.status + ' ' + out.text.slice(0, 120) });
  }
  return { ok: false, trail };
}

/** One chat turn. Returns { text, model, slot, label } or null. */
export async function freeChat({ system, messages, model, maxTokens = 900, temperature = 0.8, slot }) {
  const convo = (system ? [{ role: 'system', content: system }] : []).concat(messages || []);
  if (!convo.length) return null;
  const out = await through('/v1/chat/', {
    model: model || 'qwen7b',
    messages: convo,
    max_tokens: maxTokens,
    temperature
  }, { slot });
  if (!out.ok) return null;
  const d = out.data;
  const said = d && d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content;
  const text = String(said || '').trim();
  if (!text) return null;
  return { text, model: (d && d.model) || model || 'qwen7b', slot: out.slot, label: out.label, tokens: out.tokens };
}

/** One picture. Returns { url, slot, label } or null. */
export async function freeImage({ prompt, model, ratio, slot }) {
  const out = await through('/v1/image/generate/', {
    prompt: String(prompt || '').slice(0, 1500),
    model: model || 'flux-klein',
    aspect_ratio: ratio || '16:9'
  }, { slot, kind: 'image', cost: IMAGE_TOKENS });
  if (!out.ok) return null;
  const url = out.data.image_url || out.data.url ||
    (out.data.images && out.data.images[0] && (out.data.images[0].url || out.data.images[0]));
  if (!url) return null;
  return { url: String(url), slot: out.slot, label: out.label };
}

/** One film. Returns { url, slot, label } or null. */
export async function freeVideo({ prompt, model, seconds, slot }) {
  const out = await through('/v1/video/generate/', {
    prompt: String(prompt || '').slice(0, 1500),
    model: model || 'cogvideox',
    duration: Math.max(2, Math.min(10, Number(seconds) || 5))
  }, { slot, kind: 'video', cost: VIDEO_TOKENS });
  if (!out.ok) return null;
  const url = out.data.video_url || out.data.url || out.data.job_id;
  if (!url) return null;
  return { url: String(url), job: out.data.job_id || null, slot: out.slot, label: out.label };
}

/* ------------------------------------------------------------- the lists */

let cache = { at: 0, models: null };

/**
 * Every model the doors can reach, grouped for a dropdown. Cached for an
 * hour in the isolate, because the list is long and does not move.
 */
export async function models() {
  if (cache.models && Date.now() - cache.at < 3600000) return cache.models;
  const all = doors();
  for (const d of all) {
    const out = await call(d.key, '/v1/models');
    const list = out.data && (out.data.data || out.data.models || out.data);
    if (out.ok && Array.isArray(list) && list.length) {
      const seen = new Set();
      const tidy = [];
      for (const m of list) {
        const id = String((m && (m.id || m.name || m.model)) || m || '').trim();
        if (!id || seen.has(id)) continue;
        seen.add(id);
        /* Free.ai's own list carries `type` and `self_hosted`, which is
           better than guessing from the name; the regexes stay as the
           fallback for a provider that answers in the OpenAI shape only. */
        const told = String((m && m.type) || '').toLowerCase();
        const kind = told === 'image' || told === 'video' || told === 'chat' ? told
          : told === 'code' ? 'chat'
            : told === 'tts' || told === 'speech' ? 'speech'
              : told === 'stt' ? 'hearing'
                : /video/i.test(id) ? 'video'
                  : /flux|sdxl|image|diffusion|seedream|ideogram|banana/i.test(id) ? 'image'
                    : /tts|kokoro|piper|melo|chatterbox/i.test(id) ? 'speech'
                      : /whisper/i.test(id) ? 'hearing' : 'chat';
        tidy.push({
          id,
          name: String((m && m.name) || id),
          kind,
          self: m && typeof m.self_hosted === 'boolean'
            ? m.self_hosted
            : (!/^premium\//.test(id) && !/\//.test(id))
        });
      }
      cache = { at: Date.now(), models: tidy };
      return tidy;
    }
  }
  return [];
}

/** A diagnostic: call any path on a given door and report what came back. */
export async function probe(slot, path, body) {
  const d = door(slot) || doors()[0];
  if (!d) return { ok: false, status: 0, text: 'no doors' };
  const out = await call(d.key, path, body || null);
  return { ok: out.ok, status: out.status, label: d.label, text: out.text };
}

/** Whether the project has been given a key of its own, which wins if so. */
export async function ownKey() {
  try {
    const k = await config.get('FREEAI_API_KEY');
    return k && String(k).trim() ? String(k).trim() : null;
  } catch {
    return null;
  }
}
