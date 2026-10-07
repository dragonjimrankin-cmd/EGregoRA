/**
 * Image generation for the fox.
 *
 * The oracle can draw. One call in, one finished 2D image out, stored in the
 * project's object storage and handed back as a signed URL the browser can
 * show immediately.
 *
 * Two providers are tried in order through `ai.fetch`, which injects the
 * buyer's own key server-side — Google's Gemini image model first because it
 * is fast and cheap, then OpenAI's images endpoint. Nothing here throws: a
 * failure comes back as `{ error }` so the oracle can say so in plain words
 * instead of pretending it drew something.
 */
import { ai, storage, config } from 'hatchable';
import { openaiImage } from './openai.js';
import { colabImage } from './colab.js';
import { huggingFaceAccounts, acrossAccounts } from './pool.js';

/* The order's own generator: FLUX.1-schnell, Apache-2.0 open weights, reached
   through the keyless Pollinations endpoint. It is tried first so the oracle
   can draw on a project with no provider key at all; the proprietary models
   below are only a fallback. */
const OPEN_MODEL = 'flux';
/* The image-to-image sibling, used only when a sketch has been drawn. */
const OPEN_I2I_MODEL = 'kontext';
const OPEN_ENDPOINT = 'https://image.pollinations.ai/prompt/';
const OPEN_TIMEOUT = 45000;

/* The Stable Diffusion route, on Hugging Face's inference API, used when a
   HUGGINGFACE_API_KEY is configured. Newest first: SD 3.5 Large is the
   current official release (8.1B, MMDiT), Large Turbo is its four-step
   sibling, Medium runs where the big one will not, and SDXL is kept at the
   end because it is the one that is always available. Each repo is tried in
   turn, so a model that has been moved, gated or retired costs one attempt
   rather than the whole route. */
const HF_MODELS = [
  'stabilityai/stable-diffusion-3.5-large',
  'stabilityai/stable-diffusion-3.5-large-turbo',
  'stabilityai/stable-diffusion-3.5-medium',
  'stabilityai/stable-diffusion-xl-base-1.0'
];

/* House style.
 *
 * Written positively, and kept short. These models read the prompt with a
 * T5 text encoder, which handles negation badly: a string of "no text, no
 * collage, not a painting" reliably puts text, collages and paintings into
 * the frame, because the encoder sees the nouns and loses the "no". The
 * old house style was eighty words of that, appended to whatever the asker
 * typed, and it was drowning short requests — which is exactly the
 * complaint. The subject now comes first, in the asker's own words, and
 * the style is a brief positive tail. */
const PHOTO_STYLE =
  'Photorealistic photograph, full-frame camera, fast prime lens, natural light, ' +
  'true colour, shallow depth of field, fine detail, clean single frame.';

const STYLE_OVERRIDE =
  /\b(illustrat|paint|drawing|drawn|sketch|woodcut|engrav|etching|diagram|cartoon|anime|watercolou?r|ink|render|3d|pixel|poster|icon|logo|stained glass|tapestry|fresco|mosaic|photo|photograph|realistic)\b/i;

/**
 * The wording used when a sketch has been drawn. The drawing is a
 * composition, not a style: the model is told to keep the arrangement and
 * the masses and to render them properly, rather than to reproduce the
 * wobbly lines of a mouse drawing.
 */
function sketchPrompt(subject) {
  const s = String(subject || '').trim();
  return s + '. Keep the composition, placement and proportions of the attached sketch, ' +
    'rendered properly.' + (STYLE_OVERRIDE.test(s) ? '' : ' ' + PHOTO_STYLE);
}

function fullPrompt(subject) {
  const s = String(subject || '').trim();
  /* If the asker has said what kind of picture they want, their words are
     the whole prompt. Nothing is added that could argue with them. */
  if (STYLE_OVERRIDE.test(s)) return s;
  return s + '. ' + PHOTO_STYLE;
}

/**
 * FLUX.1-schnell (open weights) — no key required.
 *
 * When the asker has drawn a sketch, the keyless endpoint is asked for its
 * image-to-image model and given the sketch as the starting frame. If that
 * model refuses, the caller falls through to a text-only attempt rather
 * than pretending the sketch was used.
 */
async function viaOpenSource(prompt, opts = {}) {
  const init = opts.initUrl || null;
  const wanted = opts.model || (init ? OPEN_I2I_MODEL : OPEN_MODEL);
  const url = OPEN_ENDPOINT + encodeURIComponent(prompt.slice(0, 1800)) +
    '?width=1024&height=1024&nologo=true&safe=true&model=' + wanted +
    (init ? '&image=' + encodeURIComponent(init) : '') +
    '&seed=' + Math.floor(Math.random() * 1e9);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), OPEN_TIMEOUT);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { accept: 'image/*' } });
    if (!r || !r.ok) return null;
    const type = (r.headers && r.headers.get && r.headers.get('content-type')) || 'image/jpeg';
    if (!/^image\//i.test(type)) return null;
    const buf = new Uint8Array(await r.arrayBuffer());
    if (buf.length < 2048) return null;
    return {
      bytes: buf, contentType: type,
      usedSketch: Boolean(init),
      provider: (opts.model && opts.model !== OPEN_MODEL ? opts.model : (init ? 'flux-kontext, image to image' : 'flux-schnell')) +
        ' (open weights)'
    };
  } catch (err) {
    console.error('imagegen: open-source route failed', err && err.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * The order's own GPU, through whichever Colab notebook is awake.
 *
 * This comes first when a worker has registered itself as able to draw:
 * it is the one route that belongs to the order rather than being borrowed,
 * it has no rate limit but the runtime's own, and the weights are open. If
 * every machine is busy, reclaimed or asleep the function returns null in
 * well under a second and the hosted routes below take over.
 */
async function viaColab(prompt, opts = {}) {
  const out = await colabImage(prompt, { initUrl: opts.initUrl || null });
  if (!out) return null;
  const who = (out.worker && (out.worker.label || out.worker.account)) || 'Colab';
  return {
    bytes: out.bytes,
    contentType: out.contentType || 'image/png',
    usedSketch: Boolean(opts.initUrl),
    provider: 'flux-schnell on the order\'s own GPU (' + who + ')',
    hardware: 'Google Colab ' + ((out.worker && out.worker.gpu) || 'GPU') + ' \u00b7 ' + who
  };
}

/**
 * Stable Diffusion XL on Hugging Face.
 *
 * Free inference credits are reckoned per account and run dry, so every
 * token the owner has configured is tried in turn — numbered
 * HUGGINGFACE_API_KEY_2, _3 … or several at once in HUGGINGFACE_ACCOUNTS.
 * A token that has just been refused is put on a short cooldown by the pool
 * and skipped next time rather than retried into the same wall.
 */
async function viaHuggingFace(prompt, opts = {}) {
  let accounts = await huggingFaceAccounts();
  if (!accounts.length) {
    let token = null;
    try { token = await config.get('HUGGINGFACE_API_KEY'); } catch { return null; }
    if (!token) return null;
    accounts = [{ id: 'primary', label: 'primary', secret: token }];
  }

  const won = await acrossAccounts('huggingface', accounts, async (account) => {
    let last = 'no model answered';
    for (const repo of (opts.repo ? [opts.repo] : HF_MODELS)) {
      /* Hugging Face moved inference behind the router in 2025 and the old
         api-inference host is a redirect at best; try the router first and
         keep the legacy path as a second chance. */
      let r = null;
      for (const base of [
        'https://router.huggingface.co/hf-inference/models/',
        'https://api-inference.huggingface.co/models/'
      ]) {
        r = await fetch(base + repo, {
          method: 'POST',
          headers: { authorization: 'Bearer ' + account.secret, 'content-type': 'application/json', accept: 'image/png' },
          body: JSON.stringify({ inputs: prompt.slice(0, 1800), options: { wait_for_model: true } })
        }).catch(() => null);
        if (r && r.ok) break;
        last = 'HTTP ' + (r && r.status) + ' from ' + repo;
      }
      if (!r || !r.ok) continue;
      const type = (r.headers && r.headers.get && r.headers.get('content-type')) || 'image/png';
      if (!/^image\//i.test(type)) { last = repo + ' returned ' + type; continue; }
      const buf = new Uint8Array(await r.arrayBuffer());
      if (buf.length < 2048) { last = repo + ' returned an empty image'; continue; }
      return {
        bytes: buf, contentType: type,
        provider: repo.split('/').pop().replace(/-/g, ' ') + ' (open weights)'
      };
    }
    throw new Error(last);
  });
  return won;
}

async function viaGoogle(prompt) {
  const r = await ai.fetch({
    provider: 'google',
    path: '/v1beta/models/gemini-2.5-flash-image-preview:generateContent',
    body: {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['IMAGE'] }
    },
    purpose: 'oracle-image'
  });
  if (!r || !r.ok) return null;
  const data = await r.json();
  const parts =
    data && data.candidates && data.candidates[0] &&
    data.candidates[0].content && data.candidates[0].content.parts;
  const part = (parts || []).find((p) => p && p.inlineData && p.inlineData.data);
  if (!part) return null;
  return {
    base64: part.inlineData.data,
    contentType: part.inlineData.mimeType || 'image/png',
    provider: 'google'
  };
}

async function viaOpenAI(prompt) {
  const r = await ai.fetch({
    provider: 'openai',
    path: '/v1/images/generations',
    body: { model: 'gpt-image-1', prompt, size: '1024x1024', n: 1 },
    purpose: 'oracle-image'
  });
  if (!r || !r.ok) return null;
  const data = await r.json();
  const b64 = data && data.data && data.data[0] && data.data[0].b64_json;
  if (!b64) return null;
  return { base64: b64, contentType: 'image/png', provider: 'openai' };
}


/**
 * Which machine actually drew it. The hosted services do not name the card
 * they used, and inventing one would be worse than saying so — but the page
 * should still be able to tell the visitor where the work happened.
 */
export function hardwareFor(provider) {
  const p = String(provider || '').toLowerCase();
  if (p.includes('own gpu') || p.includes('colab')) return 'Google Colab GPU, run by the order itself \u00b7 FLUX.1-schnell, open weights';
  if (p.includes('flux')) return 'Pollinations hosted GPU \u00b7 FLUX.1-schnell, open weights \u2014 the card is not disclosed';
  if (p.includes('stable diffusion') || p.includes('stable-diffusion')) return 'Hugging Face Inference GPU \u00b7 Stable Diffusion, open weights \u2014 the card is not disclosed';
  if (p.includes('google')) return 'Google hosted accelerator (TPU or GPU) \u2014 not disclosed';
  if (p.includes('openai')) return 'OpenAI hosted accelerator \u2014 not disclosed';
  return 'A hosted accelerator \u2014 the provider does not name it';
}

/**
 * Put a finished image into the project's storage and hand back a URL the
 * browser can show. Shared with the bring-your-own-key route so a picture
 * drawn on somebody's own account is kept exactly like any other.
 */
export async function storeImage(out) {
  try {
    const ext = String(out.contentType || '').includes('jpeg') ? 'jpg' : 'png';
    const key = `oracle-images/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
    await storage.put(key, out.bytes || out.base64, out.contentType || 'image/png');
    const url = await storage.url(key, { ttl: 604800 });
    return { url, key };
  } catch (err) {
    return { error: 'The picture was drawn but could not be stored: ' + ((err && err.message) || 'unknown') };
  }
}

/**
 * Draw one image.
 * @param {string} subject what to draw, in plain words
 * @returns {Promise<{url?:string, prompt:string, provider?:string, error?:string}>}
 */

/* ----------------------------------------------------------- the choice
 *
 * Every generator here is free to use. Some are keyless and will always
 * answer; some run on the order's own borrowed GPU; some need a Hugging
 * Face token, which is free to get but has to be configured. The page
 * offers them all and says which is which, and whatever is chosen is only
 * put at the front of the queue \u2014 if it refuses, the rest still try, and
 * the finished picture always says which one actually drew it.
 */
export const IMAGE_ENGINES = [
  { key: 'auto', label: 'Let the order choose', note: 'Own GPU first, then the keyless open-weights routes.', keyless: true },
  { key: 'sd35', label: 'Stable Diffusion 3.5 Large', note: 'Stability AI, open weights, on the order\u2019s own Hugging Face token. The house default.', keyless: true },
  { key: 'flux', label: 'FLUX.1-schnell', note: 'Black Forest Labs, open weights. The best all-round keyless model.', keyless: true },
  { key: 'turbo', label: 'SDXL-Turbo', note: 'Fast and keyless. Rougher, but seconds rather than half a minute.', keyless: true },
  { key: 'kontext', label: 'FLUX.1 Kontext', note: 'Image to image. The one that actually follows a sketch.', keyless: true },
  { key: 'flux-dev', label: 'FLUX.1-dev', note: 'Slower and more careful than schnell, and better at writing and hands.', keyless: true },
  { key: 'colab', label: 'The order\u2019s own GPU', note: 'FLUX on whichever Colab notebook is awake. Nothing borrowed, no queue but its own.', keyless: true },
  { key: 'sd35turbo', label: 'SD 3.5 Large Turbo', note: 'Four steps instead of thirty. Hugging Face token needed.', keyless: false },
  { key: 'sdxl', label: 'Stable Diffusion XL', note: 'The old reliable, and the best understood by prompt guides. Hugging Face token needed.', keyless: false },
  { key: 'flux-hf', label: 'FLUX.1-schnell on Hugging Face', note: 'The same weights as above on different hardware. Hugging Face token needed.', keyless: false },
  { key: 'playground', label: 'Playground v2.5', note: 'Strong on colour and composition for posters and covers. Hugging Face token needed.', keyless: false }
];

const ENGINE_ROUTE = {
  flux: { kind: 'open', model: 'flux' },
  turbo: { kind: 'open', model: 'turbo' },
  kontext: { kind: 'open', model: 'kontext' },
  'flux-dev': { kind: 'open', model: 'flux-dev' },
  colab: { kind: 'colab' },
  sd35: { kind: 'hf', repo: 'stabilityai/stable-diffusion-3.5-large' },
  sd35turbo: { kind: 'hf', repo: 'stabilityai/stable-diffusion-3.5-large-turbo' },
  sdxl: { kind: 'hf', repo: 'stabilityai/stable-diffusion-xl-base-1.0' },
  'flux-hf': { kind: 'hf', repo: 'black-forest-labs/FLUX.1-schnell' },
  playground: { kind: 'hf', repo: 'playgroundai/playground-v2.5-1024px-aesthetic' }
};

export async function generateImage(subject, opts = {}) {
  const subj = String(subject || '').trim().slice(0, 1200);
  if (subj.length < 3) return { prompt: subj, error: 'Nothing to draw — say what the picture should show.' };

  /* A sketch, if one was drawn in the page. Only some routes can follow it;
     the result says plainly whether it was used or ignored, because a
     drawing that quietly disregards what you drew is worse than one that
     admits it. */
  const initUrl = typeof opts.initUrl === 'string' && /^https?:\/\//.test(opts.initUrl)
    ? opts.initUrl : null;

  const prompt = initUrl ? sketchPrompt(subj) : fullPrompt(subj);
  /* Own GPU first, then the keyless open-weights route, then anything the
     owner has paid for. Each entry may itself span several accounts. */
  const attempts = initUrl
    /* Routes that can follow a sketch come first; the rest are the fallback
       and will draw from the words alone. */
    ? [viaColab, viaOpenSource, viaColab, viaOpenSource, viaHuggingFace, openaiImage, viaGoogle, viaOpenAI]
    : [viaColab, viaOpenSource, viaHuggingFace, openaiImage, viaGoogle, viaOpenAI];

  /* A generator the member picked goes to the front. It is a preference and
     not a demand: if it will not answer, the queue behind it still runs. */
  /* Stable Diffusion 3.5 Large is the house default now that the order has a
   Hugging Face token of its own; anything else is a preference the member
   states. It is still only a place in the queue, not a demand. */
const chosen = ENGINE_ROUTE[String(opts.engine || 'sd35')];
  if (chosen) {
    const first = chosen.kind === 'colab'
      ? (p, o) => viaColab(p, o)
      : chosen.kind === 'hf'
        ? (p, o) => viaHuggingFace(p, Object.assign({ repo: chosen.repo }, o))
        : (p, o) => viaOpenSource(p, Object.assign({ model: chosen.model }, o));
    attempts.unshift(first);
    /* If Stable Diffusion was asked for and Hugging Face will not serve it
       on a free token, keep the brush in the family: SDXL-Turbo is Stability
       AI's own model and runs keyless, so it tries before anything else. */
    if (/^sd/.test(String(opts.engine || 'sd35')) && chosen.kind === 'hf') {
      attempts.splice(1, 0, (p2, o2) => viaOpenSource(p2, Object.assign({ model: 'turbo' }, o2)));
    }
  }
  let lastErr = '';

  let sketchTried = 0;
  for (const attempt of attempts) {
    try {
      /* Each sketch-capable route gets one attempt with the sketch and, if
         that fails, one without it. */
      const useSketch = Boolean(initUrl) && sketchTried < 2;
      if (initUrl && (attempt === viaColab || attempt === viaOpenSource)) sketchTried++;
      const out = await attempt(prompt, useSketch ? { initUrl } : {});
      if (!out) continue;
      const ext = out.contentType.includes('jpeg') ? 'jpg' : 'png';
      const key = `oracle-images/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
      await storage.put(key, out.bytes || out.base64, out.contentType);
      const url = await storage.url(key, { ttl: 604800 });
      return {
        url, key, prompt: subj, provider: out.provider,
        account: out.account || null,
        sketch: initUrl ? Boolean(out.usedSketch) : null,
        hardware: out.hardware || hardwareFor(out.provider)
      };
    } catch (err) {
      if (err && err.code === 'SetupRequired') {
        return {
          prompt: subj,
          error:
            'No image provider key is configured for this project yet, so the drawing cannot be made. ' +
            'The owner can paste a Google or OpenAI key on the Hatchable setup page.'
        };
      }
      lastErr = (err && err.message) || 'unknown error';
      console.error('imagegen: provider failed', lastErr);
    }
  }

  return {
    prompt: subj,
    error: 'The drawing failed' + (lastErr ? ': ' + lastErr : ' — every generator refused.') +
      ' Say so plainly rather than describing a picture that was never made.'
  };
}
