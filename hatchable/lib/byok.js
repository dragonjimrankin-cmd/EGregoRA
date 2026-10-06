/**
 * Bring your own key — drawing on somebody else's account, by invitation.
 *
 * The order's own routes are free and open-weights, which is the point of
 * them, but they are also the busiest and the slowest. Anyone who holds a
 * key of their own can hand it over for a single picture: it travels with
 * the request, is used once, and is never written to the database, never
 * logged, and never stored on disk. Nothing here keeps it after the
 * response has been sent.
 *
 * Five dialects are understood, which between them cover almost everything
 * a person is likely to hold:
 *
 *   openai      /v1/images/generations — OpenAI itself, and the many
 *               services that copy its shape (base URL is editable)
 *   stability   Stability AI's own v2beta endpoint — Stable Diffusion 3.5
 *   huggingface the Inference API, any text-to-image repo
 *   replicate   a model slug, run synchronously by waiting on the prediction
 *   fal         fal.ai's queue, polled to completion
 */

const TIMEOUT = 120000;

function abortable(ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, done: () => clearTimeout(timer) };
}

const b64 = (bytes) => Buffer.from(bytes).toString('base64');

async function asBytes(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('the finished image could not be fetched (HTTP ' + r.status + ')');
  return new Uint8Array(await r.arrayBuffer());
}

/* ------------------------------------------------------------------ *
 * The dialects
 * ------------------------------------------------------------------ */

async function viaOpenAI({ key, model, base, prompt, size }) {
  const root = (base || 'https://api.openai.com').replace(/\/+$/, '');
  const a = abortable(TIMEOUT);
  try {
    const r = await fetch(root + '/v1/images/generations', {
      method: 'POST',
      signal: a.signal,
      headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' },
      body: JSON.stringify({ model: model || 'gpt-image-1', prompt, size: size || '1024x1024', n: 1 })
    });
    const text = await r.text();
    if (!r.ok) throw new Error('the provider refused it (' + r.status + '): ' + text.slice(0, 180));
    const data = JSON.parse(text);
    const one = data && data.data && data.data[0];
    if (one && one.b64_json) return { base64: one.b64_json, contentType: 'image/png' };
    if (one && one.url) return { bytes: await asBytes(one.url), contentType: 'image/png' };
    throw new Error('the provider returned no image');
  } finally { a.done(); }
}

async function viaStability({ key, model, prompt }) {
  /* Stable Diffusion 3.5 through Stability's own API. The endpoint takes a
     multipart body even when there is no init image. */
  const form = new FormData();
  form.append('prompt', prompt);
  form.append('output_format', 'png');
  form.append('model', model || 'sd3.5-large');
  form.append('mode', 'text-to-image');
  const a = abortable(TIMEOUT);
  try {
    const r = await fetch('https://api.stability.ai/v2beta/stable-image/generate/sd3', {
      method: 'POST',
      signal: a.signal,
      headers: { authorization: 'Bearer ' + key, accept: 'image/*' },
      body: form
    });
    if (!r.ok) {
      throw new Error('Stability refused it (' + r.status + '): ' + (await r.text()).slice(0, 180));
    }
    const bytes = new Uint8Array(await r.arrayBuffer());
    if (bytes.length < 2048) throw new Error('Stability returned an empty image');
    return { bytes, contentType: r.headers.get('content-type') || 'image/png' };
  } finally { a.done(); }
}

async function viaHuggingFace({ key, model, prompt }) {
  const repo = model || 'stabilityai/stable-diffusion-3.5-large';
  const a = abortable(TIMEOUT);
  try {
    const r = await fetch('https://api-inference.huggingface.co/models/' + repo, {
      method: 'POST',
      signal: a.signal,
      headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json', accept: 'image/png' },
      body: JSON.stringify({ inputs: prompt, options: { wait_for_model: true } })
    });
    if (!r.ok) {
      throw new Error('Hugging Face refused it (' + r.status + '): ' + (await r.text()).slice(0, 180));
    }
    const type = r.headers.get('content-type') || 'image/png';
    if (!/^image\//i.test(type)) throw new Error('Hugging Face returned ' + type + ', not an image');
    return { bytes: new Uint8Array(await r.arrayBuffer()), contentType: type };
  } finally { a.done(); }
}

async function viaReplicate({ key, model, prompt }) {
  const slug = model || 'stability-ai/stable-diffusion-3.5-large';
  const a = abortable(TIMEOUT);
  try {
    const r = await fetch('https://api.replicate.com/v1/models/' + slug + '/predictions', {
      method: 'POST',
      signal: a.signal,
      headers: {
        authorization: 'Bearer ' + key,
        'content-type': 'application/json',
        prefer: 'wait=60'
      },
      body: JSON.stringify({ input: { prompt } })
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error('Replicate refused it (' + r.status + '): ' + JSON.stringify(data).slice(0, 180));

    let out = data;
    const get = (data.urls && data.urls.get) || null;
    /* `prefer: wait` usually returns the finished prediction; poll if not. */
    for (let i = 0; i < 40 && out.status && !['succeeded', 'failed', 'canceled'].includes(out.status); i++) {
      await new Promise((go) => setTimeout(go, 3000));
      const p = await fetch(get, { headers: { authorization: 'Bearer ' + key } });
      out = await p.json().catch(() => out);
    }
    if (out.status !== 'succeeded') throw new Error('Replicate did not finish: ' + (out.error || out.status));
    const url = Array.isArray(out.output) ? out.output[0] : out.output;
    if (!url) throw new Error('Replicate returned no image');
    return { bytes: await asBytes(url), contentType: 'image/png' };
  } finally { a.done(); }
}

async function viaFal({ key, model, prompt }) {
  const route = model || 'fal-ai/stable-diffusion-v35-large';
  const a = abortable(TIMEOUT);
  try {
    const r = await fetch('https://fal.run/' + route, {
      method: 'POST',
      signal: a.signal,
      headers: { authorization: 'Key ' + key, 'content-type': 'application/json' },
      body: JSON.stringify({ prompt, num_images: 1 })
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error('fal refused it (' + r.status + '): ' + JSON.stringify(data).slice(0, 180));
    const img = data.images && data.images[0];
    if (!img || !img.url) throw new Error('fal returned no image');
    return { bytes: await asBytes(img.url), contentType: img.content_type || 'image/png' };
  } finally { a.done(); }
}

const DIALECTS = {
  openai: { fn: viaOpenAI, label: 'your own OpenAI-compatible endpoint' },
  stability: { fn: viaStability, label: 'your own Stability AI account' },
  huggingface: { fn: viaHuggingFace, label: 'your own Hugging Face account' },
  replicate: { fn: viaReplicate, label: 'your own Replicate account' },
  fal: { fn: viaFal, label: 'your own fal.ai account' }
};

/** What the page offers in the provider menu. */
export const BYOK_PROVIDERS = Object.keys(DIALECTS);

/**
 * Draw one picture on the asker's own account.
 * @returns {Promise<{bytes?:Uint8Array, base64?:string, contentType:string, provider:string}|{error:string}>}
 */
export async function drawWithOwnKey(byok, prompt) {
  const want = String((byok && byok.provider) || '').toLowerCase();
  const dialect = DIALECTS[want];
  if (!dialect) return { error: 'That provider is not one this page knows how to call.' };

  const key = String((byok && byok.key) || '').trim();
  if (key.length < 8) return { error: 'That key looks too short to be a key.' };

  try {
    const out = await dialect.fn({
      key,
      model: String((byok && byok.model) || '').trim() || null,
      base: String((byok && byok.base) || '').trim() || null,
      size: String((byok && byok.size) || '').trim() || null,
      prompt
    });
    return Object.assign(out, {
      provider: (byok.model ? byok.model + ' \u00b7 ' : '') + dialect.label,
      hardware: 'Your own account \u2014 ' + dialect.label + '; the provider does not name the card'
    });
  } catch (err) {
    const why = (err && err.name === 'AbortError')
      ? 'it took longer than two minutes and was given up on'
      : (err && err.message) || 'it failed without saying why';
    return { error: 'Your own provider could not draw it: ' + why };
  }
}
