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
import {
  pushKernel, kernelStatus, kernelOutput, fetchOutput,
  claimGpu, releaseGpu, gpuBusy, kaggleToken
} from './kaggle.js';
import { videoScript, imageScript } from './gpu-scripts.js';

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


/* ----------------------------------------------------------- the models
 *
 * Every one of these has published weights — no closed model is offered.
 * Each carries the endpoint for both paid routes and, where the thing will
 * actually fit on a 16 GB T4, what to load on the order's own GPU.
 */
export const VIDEO_MODELS = {
  hunyuan15: {
    label: 'HunyuanVideo 1.5 · 480p',
    note: 'Tencent, 8.3B. The house default: the best motion of the bunch.',
    fal: 'fal-ai/hunyuan-video-v1.5/text-to-video',
    replicate: 'tencent/hunyuan-video-1.5',
    kaggle: { repo: 'tencent/HunyuanVideo-1.5', cls: 'HunyuanVideo15Pipeline', w: 848, h: 480, frames: 121, steps: 28, fps: 24 }
  },
  wan22: {
    label: 'Wan 2.2 · 480p',
    note: 'Alibaba, Apache-2.0. Strong at people and faces.',
    fal: 'fal-ai/wan/v2.2-a14b/text-to-video',
    replicate: 'wan-video/wan-2.2-t2v-fast',
    /* the 14B will not fit a T4, so the order's own GPU runs the 1.3B */
    kaggle: { repo: 'Wan-AI/Wan2.1-T2V-1.3B-Diffusers', cls: 'WanPipeline', w: 832, h: 480, frames: 81, steps: 30, fps: 16 }
  },
  ltx: {
    label: 'LTX-Video · fast',
    note: 'Lightricks, open weights. The quickest here by a distance.',
    fal: 'fal-ai/ltx-video-13b-distilled',
    replicate: 'lightricks/ltx-video',
    kaggle: { repo: 'Lightricks/LTX-Video-0.9.7-distilled', cls: 'LTXPipeline', w: 768, h: 512, frames: 97, steps: 8, fps: 24 }
  },
  cogvideox: {
    label: 'CogVideoX-5B',
    note: 'Tsinghua / Zhipu. Painterly, slower, good with light.',
    fal: 'fal-ai/cogvideox-5b',
    replicate: 'cuuupid/cogvideox-5b',
    kaggle: { repo: 'THUDM/CogVideoX-5b', cls: 'CogVideoXPipeline', w: 720, h: 480, frames: 49, steps: 50, fps: 8 }
  },
  mochi: {
    label: 'Mochi 1',
    note: 'Genmo, Apache-2.0. Cinematic, needs a paid route.',
    fal: 'fal-ai/mochi-v1',
    replicate: 'genmoai/mochi-1',
    kaggle: null
  }
};

export function pickModel(name) {
  const key = String(name || '').trim();
  return VIDEO_MODELS[key] ? { key, ...VIDEO_MODELS[key] } : { key: 'hunyuan15', ...VIDEO_MODELS.hunyuan15 };
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
  const model = pickModel(opts.model);
  const frames = Math.max(49, Math.min(121, Number(opts.frames) || 121));

  const falKey = await key('FAL_KEY');
  if (falKey) {
    const r = await call(FAL_QUEUE + model.fal, {
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
        model: model.label,
        requestId: id,
        statusUrl: r.json.status_url || (FAL_QUEUE + model.fal + '/requests/' + id + '/status'),
        responseUrl: r.json.response_url || (FAL_QUEUE + model.fal + '/requests/' + id)
      };
    }
    console.error('videogen: fal submit failed', r.status, String(r.text).slice(0, 300));
  }

  /* Kaggle's free GPU. Slow — the model is downloaded on every run, so a
     clip takes the better part of half an hour — but it needs no paid key.
     Tried after the paid routes and before giving up. */
  const tryKaggle = async () => {
    if (!kaggleToken()) return null;
    if (!model.kaggle) {
      return {
        error: model.label + ' is too large for the order\u2019s own GPU. Choose HunyuanVideo, Wan, ' +
          'LTX-Video or CogVideoX, or connect a FAL_KEY for this one.'
      };
    }
    const slug = 'egregora-film-' + Date.now().toString(36);
    const claim = await claimGpu('video', slug);
    if (!claim.ok) {
      return { error: 'The order\u2019s GPU is busy with another clip. Try again in a few minutes.' };
    }
    const out = await pushKernel({
      slug,
      code: videoScript({ prompt: text, aspect, frames, model: model.kaggle })
    });
    if (out.error) {
      await releaseGpu(slug, 'failed');
      console.error('videogen: kaggle push failed', out.error);
      return null;
    }
    return {
      provider: 'kaggle',
      model: model.label + ' \u00b7 Kaggle T4',
      requestId: out.slug,
      statusUrl: out.slug,
      responseUrl: out.url
    };
  };

  const repKey = await key('REPLICATE_API_TOKEN');
  if (repKey) {
    const r = await call('https://api.replicate.com/v1/models/' + model.replicate + '/predictions', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + repKey, 'content-type': 'application/json' },
      body: JSON.stringify({
        input: { prompt: text, resolution: '480p', aspect_ratio: aspect, num_frames: frames }
      })
    });
    if (r.ok && r.json && r.json.id) {
      return {
        provider: 'replicate',
        model: model.label,
        requestId: r.json.id,
        statusUrl: (r.json.urls && r.json.urls.get) || ('https://api.replicate.com/v1/predictions/' + r.json.id),
        responseUrl: (r.json.urls && r.json.urls.get) || ('https://api.replicate.com/v1/predictions/' + r.json.id)
      };
    }
    console.error('videogen: replicate submit failed', r.status, String(r.text).slice(0, 300));
  }

  const viaKaggle = await tryKaggle();
  if (viaKaggle) return viaKaggle;

  return {
    error:
      'No video generator is reachable just now. HunyuanVideo 1.5 is open-weights but it still has to run ' +
      'on somebody\'s GPU: the order\'s Kaggle GPU did not accept the job, and no FAL_KEY or ' +
      'REPLICATE_API_TOKEN is configured.'
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

  /* Kaggle is not an inference API: we ask the notebook how it is getting on,
     and when it finishes we pull the file it left in /kaggle/working. */
  if (row.provider === 'kaggle') {
    const slug = row.request_id;
    const st = await kernelStatus(slug);
    if (st.error) return { status: 'running' };

    if (st.status === 'ERROR' || st.status.startsWith('CANCEL')) {
      await releaseGpu(slug, 'failed');
      const why = String(st.message || '');
      return {
        status: 'failed',
        error: /NO GPU/i.test(why)
          ? 'The order\u2019s Kaggle account was handed a machine with no GPU. Kaggle only gives ' +
            'accelerators to phone-verified accounts with weekly quota left \u2014 verify it at ' +
            'kaggle.com/settings, or connect a FAL_KEY.'
          : (why || 'The notebook stopped with an error.').slice(0, 300)
      };
    }
    if (st.status !== 'COMPLETE') return { status: 'running' };

    const out = await kernelOutput(slug);
    if (out.error) return { status: 'running' };
    const wantImage = row.kind === 'image';
    const pattern = wantImage ? /\.(png|jpe?g|webp)$/i : /\.mp4$/i;
    const file = (out.files || []).find((f) => pattern.test(f.name)) || (out.files || [])[0];
    if (!file) {
      await releaseGpu(slug, 'failed');
      return { status: 'failed', error: 'The notebook finished but left nothing behind.' };
    }

    const got = await fetchOutput(file.url);
    if (got.error) return { status: 'running' };

    await releaseGpu(slug, 'done');
    try {
      const key = (wantImage ? 'oracle-art/' : 'oracle-videos/') +
        Date.now().toString(36) + (wantImage ? '.png' : '.mp4');
      await storage.put(key, got.bytes, wantImage ? 'image/png' : 'video/mp4');
      const signed = await storage.url(key, { ttl: 604800 });
      return { status: 'ready', url: signed, key };
    } catch (err) {
      return { status: 'failed', error: 'The clip could not be stored: ' + (err && err.message) };
    }
  }

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


/**
 * Queue a picture on Kaggle's GPU — used only when every quick image route
 * has failed, and only when no clip is being filmed. Same job shape as a
 * video so the browser can poll it with the same endpoint.
 */
export async function submitKaggleImage(prompt) {
  const text = String(prompt || '').trim().slice(0, 1500);
  if (!kaggleToken()) return { error: 'No Kaggle token configured.' };

  const busy = await gpuBusy();
  if (busy) {
    return {
      error: busy.kind === 'video'
        ? 'The order\u2019s GPU is filming a clip just now, so it cannot draw as well. Try again shortly.'
        : 'The order\u2019s GPU is already drawing something. Try again shortly.'
    };
  }

  const slug = 'egregora-draw-' + Date.now().toString(36);
  const claim = await claimGpu('image', slug);
  if (!claim.ok) return { error: 'The order\u2019s GPU is busy. Try again shortly.' };

  const out = await pushKernel({ slug, code: imageScript({ prompt: text }) });
  if (out.error) {
    await releaseGpu(slug, 'failed');
    return { error: out.error };
  }
  return {
    provider: 'kaggle',
    model: 'FLUX.1-schnell \u00b7 Kaggle T4',
    requestId: out.slug,
    statusUrl: out.slug,
    responseUrl: out.url
  };
}
