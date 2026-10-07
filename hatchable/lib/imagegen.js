/**
 * Image generation for the fox.
 *
 * The oracle can draw. One call in, one finished 2D image out, stored in the
 * project's object storage and handed back as a signed URL the browser can
 * show immediately.
 *
 * The house generator is **Stable Diffusion**, text to image, run on hardware
 * the order controls: whichever Colab notebook is awake first, then a Kaggle
 * kernel as a queued job, and only then a hosted inference endpoint. Nothing
 * is drawn on a borrowed keyless service any more — that route is gone.
 * Nothing here throws: a failure comes back as `{ error }` so the oracle can
 * say so in plain words instead of pretending it drew something.
 */
import { ai, storage, config } from 'hatchable';
import { openaiImage } from './openai.js';
import { colabImage } from './colab.js';
import { huggingFaceAccounts, acrossAccounts } from './pool.js';

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
 * The order's own GPU, through whichever Colab notebook is awake.
 *
 * This comes first when a worker has registered itself as able to draw:
 * it is the one route that belongs to the order rather than being borrowed,
 * it has no rate limit but the runtime's own, and the weights are open. If
 * every machine is busy, reclaimed or asleep the function returns null in
 * well under a second and the hosted routes below take over.
 */
async function viaColab(prompt, opts = {}) {
  const out = await colabImage(prompt, { initUrl: opts.initUrl || null, model: opts.repo || null });
  if (!out) return null;
  const who = (out.worker && (out.worker.label || out.worker.account)) || 'Colab';
  return {
    bytes: out.bytes,
    contentType: out.contentType || 'image/png',
    usedSketch: Boolean(opts.initUrl),
    provider: 'Stable Diffusion on the order\'s own GPU (' + who + ')',
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
  if (p.includes('own gpu') || p.includes('colab')) return 'Google Colab GPU, run by the order itself \u00b7 Stable Diffusion, open weights';
  if (p.includes('kaggle')) return 'Kaggle GPU, run by the order itself \u00b7 Stable Diffusion, open weights';
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
 * Stable Diffusion, on hardware the order controls. The borrowed keyless
 * service that used to draw most of these pictures has been taken out
 * altogether: every route below is either one of the order's own GPUs \u2014 a
 * Colab notebook that is awake, or a Kaggle kernel queued as a job \u2014 or a
 * hosted endpoint reached with the order's own token. Whatever is chosen is
 * only put at the front of the queue; if it refuses, the rest still try, and
 * the finished picture always says which machine actually drew it.
 */
export const IMAGE_ENGINES = [
  { key: 'sd35', label: 'Stable Diffusion 3.5', note: 'Stability AI, open weights. The house default \u2014 the order\u2019s own GPU first, a hosted endpoint only if no machine of ours is awake.', keyless: true },
  { key: 'colab', label: 'The order\u2019s own GPU', note: 'Stable Diffusion on whichever Colab notebook is awake. Nothing borrowed, no queue but its own.', keyless: true },
  { key: 'kaggle', label: 'The order\u2019s Kaggle GPU', note: 'Stable Diffusion on a Kaggle kernel. Minutes rather than seconds, because the machine has to be woken and the weights fetched.', keyless: true },
  { key: 'sd3m', label: 'Stable Diffusion 3.5 Medium', note: 'The smaller 3.5. Runs where the large one will not, and is quicker.', keyless: true },
  { key: 'sd35turbo', label: 'SD 3.5 Large Turbo', note: 'Four steps instead of thirty. Rougher, and much faster.', keyless: true },
  { key: 'sdxl', label: 'Stable Diffusion XL', note: 'The old reliable, and the best understood by prompt guides.', keyless: true },
  { key: 'sdturbo', label: 'SD-Turbo', note: 'Stability\u2019s one-step model. For trying a composition out before committing to it.', keyless: true },
  { key: 'playground', label: 'Playground v2.5', note: 'Built on SDXL. Strong on colour and composition for posters and covers.', keyless: true }
];

/* Every engine is a Stable Diffusion checkpoint except the two that name a
   machine instead of a model; `repo` is what the hosted endpoint is asked
   for and what the order's own GPUs are told to load. */
const ENGINE_ROUTE = {
  colab: { kind: 'colab' },
  kaggle: { kind: 'kaggle' },
  sd35: { kind: 'hf', repo: 'stabilityai/stable-diffusion-3.5-large' },
  sd3m: { kind: 'hf', repo: 'stabilityai/stable-diffusion-3.5-medium' },
  sd35turbo: { kind: 'hf', repo: 'stabilityai/stable-diffusion-3.5-large-turbo' },
  sdxl: { kind: 'hf', repo: 'stabilityai/stable-diffusion-xl-base-1.0' },
  sdturbo: { kind: 'hf', repo: 'stabilityai/sd-turbo' },
  playground: { kind: 'hf', repo: 'playgroundai/playground-v2.5-1024px-aesthetic' }
};

/** The checkpoint a chosen engine names, for the GPU that will load it. */
export function repoFor(engine) {
  const r = ENGINE_ROUTE[String(engine || 'sd35')];
  return (r && r.repo) || 'stabilityai/stable-diffusion-3.5-medium';
}

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
  /* The order's own GPU first, every time. Then the hosted Stable Diffusion
     endpoint on the order's own token, and only then anything the owner has
     paid for. Each entry may itself span several accounts. Kaggle is absent
     here because it cannot answer inside one request: when everything below
     fails, /api/draw turns the picture into a queued kernel job instead. */
  const attempts = initUrl
    /* The one route that can follow a sketch goes twice: once with the
       drawing, once without, before the word-only routes take over. */
    ? [viaColab, viaColab, viaHuggingFace, openaiImage, viaGoogle, viaOpenAI]
    : [viaColab, viaHuggingFace, openaiImage, viaGoogle, viaOpenAI];

  /* A generator the member picked goes to the front. It is a preference and
     not a demand: if it will not answer, the queue behind it still runs. */
  /* Stable Diffusion 3.5 is the house default; anything else is a preference
     the member states, and it is still only a place in the queue rather than
     a demand. Whichever checkpoint was named is also what the order's own
     GPU is asked to load, so choosing SDXL means SDXL wherever it is drawn. */
  const engine = String(opts.engine || 'sd35');
  const chosen = ENGINE_ROUTE[engine];
  const repo = repoFor(engine);
  if (chosen && chosen.kind === 'hf') {
    attempts.unshift((p, o) => viaHuggingFace(p, Object.assign({ repo: chosen.repo }, o)));
  }
  let lastErr = '';

  let sketchTried = 0;
  for (const attempt of attempts) {
    try {
      /* Each sketch-capable route gets one attempt with the sketch and, if
         that fails, one without it. */
      const useSketch = Boolean(initUrl) && sketchTried < 2;
      if (initUrl && attempt === viaColab) sketchTried++;
      const out = await attempt(prompt, Object.assign({ repo }, useSketch ? { initUrl } : {}));
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
