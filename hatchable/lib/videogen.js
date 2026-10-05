/**
 * Video for the oracle — HunyuanVideo 1.5, 480p.
 *
 * Tencent's HunyuanVideo 1.5 is an open-weights model (8.3B parameters,
 * published code and weights) that makes roughly five seconds of 480p video
 * from a written prompt. A generation takes about three minutes, which is far
 * longer than a web request may sit open, so the work is done as a job:
 *
 *   submitVideo()  hands the prompt to the provider's queue and returns a
 *                  request id immediately;
 *   pollVideo()    asks the provider whether it is finished, and on success
 *                  copies the finished mp4 into this project's own storage so
 *                  the clip does not vanish when the provider's link expires.
 *
 * Two routes, both running the same open model: fal.ai (FAL_KEY) and
 * Replicate (REPLICATE_API_TOKEN). Neither is keyless — video is expensive to
 * run and nobody gives it away — so with no key configured the oracle says so
 * plainly rather than pretending.
 */
import { storage, config } from 'hatchable';

const FAL_MODEL = 'fal-ai/hunyuan-video-v1.5/text-to-video';
const FAL_QUEUE = 'https://queue.fal.run/';
const REPLICATE_MODEL = 'tencent/hunyuan-video-1.5';
const TIMEOUT = 30000;

async function key(name) {
  try { return (await config.get(name)) || null; } catch { return null; }
}

async function call(url, opts) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
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

/* ------------------------------------------------------------- submitting */

/**
 * Queue one clip.
 * @returns {Promise<{provider,model,requestId,statusUrl,responseUrl}|{error:string}>}
 */
export async function submitVideo(prompt, opts = {}) {
  const text = String(prompt || '').trim().slice(0, 1500);
  if (text.length < 3) return { error: 'Say what the clip should show.' };

  const aspect = opts.aspect === '9:16' ? '9:16' : '16:9';
  const frames = Math.max(49, Math.min(121, Number(opts.frames) || 121));

  const falKey = await key('FAL_KEY');
  if (falKey) {
    const r = await call(FAL_QUEUE + FAL_MODEL, {
      method: 'POST',
      headers: { authorization: 'Key ' + falKey, 'content-type': 'application/json' },
      body: JSON.stringify({
        prompt: text,
        resolution: '480p',
        aspect_ratio: aspect,
        num_frames: frames,
        num_inference_steps: 28,
        enable_prompt_expansion: true
      })
    });
    if (r.ok && r.json && (r.json.request_id || r.json.requestId)) {
      const id = r.json.request_id || r.json.requestId;
      return {
        provider: 'fal',
        model: 'HunyuanVideo 1.5 · 480p',
        requestId: id,
        statusUrl: r.json.status_url || (FAL_QUEUE + FAL_MODEL + '/requests/' + id + '/status'),
        responseUrl: r.json.response_url || (FAL_QUEUE + FAL_MODEL + '/requests/' + id)
      };
    }
    console.error('videogen: fal submit failed', r.status, String(r.text).slice(0, 300));
  }

  const repKey = await key('REPLICATE_API_TOKEN');
  if (repKey) {
    const r = await call('https://api.replicate.com/v1/models/' + REPLICATE_MODEL + '/predictions', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + repKey, 'content-type': 'application/json' },
      body: JSON.stringify({
        input: { prompt: text, resolution: '480p', aspect_ratio: aspect, num_frames: frames }
      })
    });
    if (r.ok && r.json && r.json.id) {
      return {
        provider: 'replicate',
        model: 'HunyuanVideo 1.5 · 480p',
        requestId: r.json.id,
        statusUrl: (r.json.urls && r.json.urls.get) || ('https://api.replicate.com/v1/predictions/' + r.json.id),
        responseUrl: (r.json.urls && r.json.urls.get) || ('https://api.replicate.com/v1/predictions/' + r.json.id)
      };
    }
    console.error('videogen: replicate submit failed', r.status, String(r.text).slice(0, 300));
  }

  return {
    error:
      'No video generator is connected to this project yet. HunyuanVideo 1.5 is open-weights but it still ' +
      'has to run on somebody\'s GPU: paste a FAL_KEY (or a REPLICATE_API_TOKEN) on the Hatchable setup ' +
      'page and the fox can film.'
  };
}

/* --------------------------------------------------------------- polling */

function findVideoUrl(json) {
  if (!json) return null;
  if (typeof json.video === 'string') return json.video;
  if (json.video && json.video.url) return json.video.url;
  if (Array.isArray(json.output)) {
    const hit = json.output.find((o) => typeof o === 'string' && /\.(mp4|webm)(\?|$)/i.test(o));
    if (hit) return hit;
  }
  if (typeof json.output === 'string' && /\.(mp4|webm)(\?|$)/i.test(json.output)) return json.output;
  if (json.output && json.output.video) return json.output.video;
  return null;
}

/**
 * Ask the provider how a job is getting on, and store the clip when it lands.
 * @returns {Promise<{status:'running'|'ready'|'failed', url?:string, key?:string, error?:string}>}
 */
export async function pollVideo(row) {
  if (!row || !row.request_id) return { status: 'failed', error: 'No job to check.' };

  const headers = {};
  if (row.provider === 'fal') {
    const k = await key('FAL_KEY');
    if (!k) return { status: 'failed', error: 'The video key has been removed from this project.' };
    headers.authorization = 'Key ' + k;
  } else {
    const k = await key('REPLICATE_API_TOKEN');
    if (!k) return { status: 'failed', error: 'The video key has been removed from this project.' };
    headers.authorization = 'Bearer ' + k;
  }

  const s = await call(row.status_url, { headers });
  if (!s.ok || !s.json) return { status: 'running' };

  const state = String(s.json.status || '').toUpperCase();
  if (state === 'FAILED' || state === 'ERROR' || state === 'CANCELED' || state === 'CANCELLED') {
    return { status: 'failed', error: String(s.json.error || 'The generator gave up on that one.').slice(0, 300) };
  }

  let payload = s.json;
  let url = findVideoUrl(payload);

  if (!url && (state === 'COMPLETED' || state === 'SUCCEEDED')) {
    const r = await call(row.response_url, { headers });
    payload = r.json;
    url = findVideoUrl(payload);
  }

  if (!url) return { status: 'running' };

  // copy it into our own storage so the clip outlives the provider's link
  try {
    const got = await call(url, {});
    if (got.ok) {
      const bin = await fetch(url);
      const bytes = new Uint8Array(await bin.arrayBuffer());
      if (bytes.length > 4096) {
        const skey = `oracle-videos/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.mp4`;
        await storage.put(skey, bytes, 'video/mp4');
        const signed = await storage.url(skey, { ttl: 604800 });
        return { status: 'ready', url: signed, key: skey };
      }
    }
  } catch (err) {
    console.error('videogen: could not re-store clip', err && err.message);
  }

  return { status: 'ready', url };
}
