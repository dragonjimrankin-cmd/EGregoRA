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

/* The order's own generator: FLUX.1-schnell, Apache-2.0 open weights, reached
   through the keyless Pollinations endpoint. It is tried first so the oracle
   can draw on a project with no provider key at all; the proprietary models
   below are only a fallback. */
const OPEN_MODEL = 'flux';
const OPEN_ENDPOINT = 'https://image.pollinations.ai/prompt/';
const OPEN_TIMEOUT = 45000;

/* Optional second open-source route: Stable Diffusion XL on Hugging Face's
   inference API, used when the owner has pasted HUGGINGFACE_API_KEY. */
const HF_MODEL = 'stabilityai/stable-diffusion-xl-base-1.0';

/* House style. The fox draws photographs unless it is told otherwise:
   real optics, real light, no illustration, no text burned into the frame. */
const PHOTO_STYLE = [
  'A single photorealistic photograph, 2D, no collage, no grid, no borders, no caption.',
  'Shot on a full-frame camera with a fast prime lens; natural light, true-to-life colour,',
  'correct depth of field, fine surface detail, subtle film grain, no digital over-sharpening.',
  'No text, no watermark, no signature, no lettering anywhere in the image.',
  'Not an illustration, not a painting, not 3D render, not CGI, not cartoon.'
].join(' ');

const STYLE_OVERRIDE =
  /\b(illustrat|paint|drawing|drawn|sketch|woodcut|engrav|etching|diagram|cartoon|anime|watercolou?r|ink|render|3d|pixel|poster|icon|logo|stained glass|tapestry|fresco|mosaic)\b/i;

function fullPrompt(subject) {
  const s = String(subject || '').trim();
  // If the asker explicitly wants a style, honour it rather than forcing a photograph.
  if (STYLE_OVERRIDE.test(s)) {
    return s + ' Single standalone 2D image. No text, no watermark, no lettering.';
  }
  return s + '\n\n' + PHOTO_STYLE;
}

/** FLUX.1-schnell (open weights) — no key required. */
async function viaOpenSource(prompt) {
  const url = OPEN_ENDPOINT + encodeURIComponent(prompt.slice(0, 1800)) +
    '?width=1024&height=1024&nologo=true&safe=true&model=' + OPEN_MODEL +
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
    return { bytes: buf, contentType: type, provider: 'flux-schnell (open weights)' };
  } catch (err) {
    console.error('imagegen: open-source route failed', err && err.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Stable Diffusion XL via Hugging Face, when a token is configured. */
async function viaHuggingFace(prompt) {
  let token = null;
  try { token = await config.get('HUGGINGFACE_API_KEY'); } catch { return null; }
  if (!token) return null;
  const r = await fetch('https://api-inference.huggingface.co/models/' + HF_MODEL, {
    method: 'POST',
    headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json', accept: 'image/png' },
    body: JSON.stringify({ inputs: prompt.slice(0, 1800), options: { wait_for_model: true } })
  });
  if (!r || !r.ok) return null;
  const type = (r.headers && r.headers.get && r.headers.get('content-type')) || 'image/png';
  if (!/^image\//i.test(type)) return null;
  const buf = new Uint8Array(await r.arrayBuffer());
  if (buf.length < 2048) return null;
  return { bytes: buf, contentType: type, provider: 'stable-diffusion-xl (open weights)' };
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
 * Draw one image.
 * @param {string} subject what to draw, in plain words
 * @returns {Promise<{url?:string, prompt:string, provider?:string, error?:string}>}
 */
export async function generateImage(subject) {
  const subj = String(subject || '').trim().slice(0, 1200);
  if (subj.length < 3) return { prompt: subj, error: 'Nothing to draw — say what the picture should show.' };

  const prompt = fullPrompt(subj);
  const attempts = [viaOpenSource, viaHuggingFace, viaGoogle, viaOpenAI];
  let lastErr = '';

  for (const attempt of attempts) {
    try {
      const out = await attempt(prompt);
      if (!out) continue;
      const ext = out.contentType.includes('jpeg') ? 'jpg' : 'png';
      const key = `oracle-images/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
      await storage.put(key, out.bytes || out.base64, out.contentType);
      const url = await storage.url(key, { ttl: 604800 });
      return { url, key, prompt: subj, provider: out.provider };
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
