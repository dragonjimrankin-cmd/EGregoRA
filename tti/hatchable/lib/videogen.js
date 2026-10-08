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
  pushKernel, pushKernelAnyAccount, kaggleAccountList, kernelStatus, kernelOutput, fetchOutput,
  claimGpu, releaseGpu, gpuBusy, kaggleToken
} from './kaggle.js';
import { videoScript, imageScript } from './gpu-scripts.js';
import { submitToColab, colabStatus, colabFile } from './colab.js';
import { falAccounts, replicateAccounts, acrossAccounts } from './pool.js';

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
    falI2V: 'fal-ai/hunyuan-video-v1.5/image-to-video',
    replicate: 'tencent/hunyuan-video-1.5',
    kaggle: { repo: 'tencent/HunyuanVideo-1.5', cls: 'HunyuanVideo15Pipeline', w: 848, h: 480, frames: 121, steps: 28, fps: 24 }
  },
  wan22: {
    label: 'Wan 2.2 · 480p',
    note: 'Alibaba, Apache-2.0. Strong at people and faces.',
    fal: 'fal-ai/wan/v2.2-a14b/text-to-video',
    falI2V: 'fal-ai/wan/v2.2-a14b/image-to-video',
    replicate: 'wan-video/wan-2.2-t2v-fast',
    /* the 14B will not fit a T4, so the order's own GPU runs the 1.3B */
    kaggle: { repo: 'Wan-AI/Wan2.1-T2V-1.3B-Diffusers', cls: 'WanPipeline', w: 832, h: 480, frames: 81, steps: 30, fps: 16 }
  },
  ltx: {
    label: 'LTX-Video · fast',
    note: 'Lightricks, open weights. The quickest here by a distance.',
    fal: 'fal-ai/ltx-video-13b-distilled',
    falI2V: 'fal-ai/ltx-video-13b-distilled/image-to-video',
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

/* ------------------------------------------------------------- lengths
 *
 * What each model will actually make. Frame counts are the ones the
 * published configs are happy with — a diffusion video model is trained at
 * a particular length and a particular frame rate, and asking for a count
 * far outside that gives either a refusal or a clip that falls apart in the
 * second half. The fps below is the model's own, so the seconds are honest:
 * 49 frames of CogVideoX is six seconds, 49 frames of Hunyuan is two.
 */
export const VIDEO_LENGTHS = {
  hunyuan15: { fps: 24, frames: [49, 73, 97, 121, 185, 241], def: 121 },
  wan22:     { fps: 16, frames: [33, 49, 65, 81], def: 81 },
  ltx:       { fps: 24, frames: [49, 97, 145, 193, 257], def: 97 },
  cogvideox: { fps: 8,  frames: [25, 49], def: 49 },
  mochi:     { fps: 30, frames: [61, 91, 163], def: 163 }
};

/** Snap a request to the nearest length the chosen model actually offers. */
export function lengthFor(modelKey, wanted) {
  const spec = VIDEO_LENGTHS[modelKey] || VIDEO_LENGTHS.hunyuan15;
  const n = Number(wanted);
  if (!Number.isFinite(n) || n <= 0) return { frames: spec.def, fps: spec.fps };
  const frames = spec.frames.reduce((best, f) =>
    Math.abs(f - n) < Math.abs(best - n) ? f : best, spec.frames[0]);
  return { frames, fps: spec.fps };
}

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
  /* An unknown field is a 422 on both fal and Replicate, so the length is
     only ever sent as the frame count every route already understands. */
  const { frames } = lengthFor(model.key, opts.frames);

  /* A key of the member's own. It is used for this one submission and then
     forgotten: it is never written to the database and never logged. Where
     a member brings their own fal or Replicate key, the order's own pool is
     left alone entirely and their account does the work. */
  const own = opts.byok && typeof opts.byok.key === 'string' && opts.byok.key.trim()
    ? { provider: String(opts.byok.provider || 'fal'), key: opts.byok.key.trim(),
        model: String(opts.byok.model || '').trim() }
    : null;

  /* Continuation. `initUrl` is the frame this shot grows out of; where a route
     offers image-to-video it becomes the literal first frame, which is the
     strongest continuity lock there is. `seed` is the second lock: the same
     noise means the same world even when the route is text-only. */
  const initUrl = typeof opts.initUrl === 'string' && /^https?:\/\//.test(opts.initUrl)
    ? opts.initUrl : null;
  const seed = Number.isFinite(Number(opts.seed)) && Number(opts.seed) > 0
    ? Math.floor(Number(opts.seed)) : null;

  /* ---------------------------------------------------------------------
     A provider of the member's own that is neither fal nor Replicate. Two
     are understood exactly \u2014 Luma's Dream Machine, and anything that speaks
     the common shape of "post a prompt, get a job id, poll the job" \u2014 and
     for the second the member gives the endpoint themselves. The key is
     used for this request only and is never written down; the page sends it
     again with every check on the job, because the order has not kept it. */
  if (own && own.provider === 'luma') {
    const base = 'https://api.lumalabs.ai/dream-machine/v1/generations';
    const payload = {
      prompt: text,
      model: own.model || 'ray-2',
      resolution: '540p',
      duration: '5s',
      aspect_ratio: aspect
    };
    if (initUrl) payload.keyframes = { frame0: { type: 'image', url: initUrl } };
    const r = await call(base, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + own.key, 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!(r.ok && r.json && r.json.id)) {
      return { error: 'Luma refused that request: ' + String(r.text || r.status).slice(0, 200) };
    }
    return {
      provider: 'byok',
      model: 'Luma ' + (own.model || 'ray-2') + ' \u00b7 your own account',
      hardware: 'Luma Labs, on the member\u2019s own key',
      requestId: r.json.id,
      statusUrl: base + '/' + r.json.id,
      responseUrl: base + '/' + r.json.id
    };
  }

  if (own && own.provider === 'custom') {
    const endpoint = String(own.base || '').trim();
    if (!/^https:\/\//.test(endpoint)) {
      return { error: 'Give the full https address of your provider\u2019s video endpoint.' };
    }
    const payload = {
      prompt: text,
      model: own.model || undefined,
      aspect_ratio: aspect,
      num_frames: frames,
      duration: Math.round(frames / 24)
    };
    if (initUrl) { payload.image_url = initUrl; payload.image = initUrl; }
    const r = await call(endpoint, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + own.key, 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!r.ok || !r.json) {
      return { error: 'That endpoint refused the request: ' + String(r.text || r.status).slice(0, 200) };
    }
    /* Some services answer with the finished clip, some with a job. */
    const straight = findVideoUrl(r.json);
    const jobId = r.json.id || r.json.request_id || r.json.task_id || r.json.job_id || null;
    if (!straight && !jobId) {
      return { error: 'That endpoint answered with neither a video nor a job id.' };
    }
    const statusUrl = String(own.status || '').trim()
      ? own.status.replace('{id}', jobId || '')
      : endpoint.replace(/\/+$/, '') + '/' + (jobId || '');
    return {
      provider: 'byok',
      model: (own.model || 'your provider') + ' \u00b7 your own account',
      hardware: 'a provider of the member\u2019s own',
      requestId: jobId || 'direct',
      statusUrl: straight || statusUrl,
      responseUrl: straight || statusUrl,
      readyUrl: straight || null
    };
  }

  /* fal.ai. Credit is per account and a clip is not cheap, so every key the
     owner has configured is tried in turn — FAL_KEY, FAL_KEY_2 … or several
     at once in FAL_ACCOUNTS — and a key that has just been refused is put on
     a cooldown by the pool rather than retried into the same refusal. */
  const falKeys = own
    ? (own.provider === 'fal' ? [{ id: 'own-' + Math.random().toString(36).slice(2, 8), label: 'your own fal key', secret: own.key }] : [])
    : await falAccounts();
  if (falKeys.length) {
    const route = (own && own.provider === 'fal' && own.model)
      ? own.model
      : (initUrl && model.falI2V ? model.falI2V : model.fal);
    const payload = {
      prompt: text,
      resolution: '480p',
      aspect_ratio: aspect,
      num_frames: frames,
      num_inference_steps: 28,
      enable_prompt_expansion: !initUrl   // leave a carried prompt exactly as written
    };
    if (seed) payload.seed = seed;
    if (initUrl && model.falI2V) payload.image_url = initUrl;
    const won = await acrossAccounts('fal', falKeys, async (account) => {
      const r = await call(FAL_QUEUE + route, {
        method: 'POST',
        headers: { authorization: 'Key ' + account.secret, 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!(r.ok && r.json && (r.json.request_id || r.json.requestId))) {
        throw new Error('submit ' + r.status + ' ' + String(r.text).slice(0, 160));
      }
      const id = r.json.request_id || r.json.requestId;
      return {
        provider: 'fal',
        model: model.label + (initUrl && model.falI2V ? ' \u00b7 from frame' : ''),
        hardware: 'fal.ai hosted accelerator \u2014 the provider does not say which card',
        requestId: id,
        statusUrl: r.json.status_url || (FAL_QUEUE + route + '/requests/' + id + '/status'),
        responseUrl: r.json.response_url || (FAL_QUEUE + route + '/requests/' + id)
      };
    });
    if (won) return won;
  }

  /* The order's own Colab workers: a notebook running on somebody's Google
     account, tunnelled out and registered with /api/colab. Free, usually a
     T4 or an L4, and much quicker than Kaggle because the worker stays warm
     between clips. Tried before the paid fallbacks. */
  {
    const viaColab = await submitToColab({
      prompt: text, aspect, frames, model: model.kaggle || model.label, kind: 'video',
      seed: seed || undefined, init_image: initUrl || undefined
    });
    if (viaColab) {
      return {
        provider: 'colab',
        hardware: (viaColab.worker.gpu || 'an unnamed GPU') + ' \u00b7 Google Colab, lent to the order',
        model: model.label + ' \u00b7 Colab ' + (viaColab.worker.gpu || 'GPU'),
        requestId: viaColab.jobId,
        statusUrl: viaColab.worker.endpoint,
        responseUrl: viaColab.worker.endpoint
      };
    }
  }

  /* Kaggle's free GPU. Slow — the model is downloaded on every run, so a
     clip takes the better part of half an hour — but it needs no paid key.
     Tried after the paid routes and before giving up. */
  const tryKaggle = async () => {
    /* Any configured Kaggle account will do — the push helper walks the
       whole pool, so one account out of free GPU quota is not the end of it. */
    if (!(await kaggleAccountList()).length) return null;
    if (!model.kaggle) {
      return {
        error: model.label + ' is too large for the order\u2019s own GPU. Choose HunyuanVideo, Wan, ' +
          'LTX-Video or CogVideoX, or connect a FAL_KEY for this one.'
      };
    }
    const slug = 'egregora-film-' + Date.now().toString(36);
    const claim = await claimGpu('video', slug);
    if (!claim.ok) {
      /* The Kaggle notebook is already filming. Before telling anyone to
         come back later, look for a GPU that is free on one of the Colab
         accounts — a second Google login with an idle runtime is exactly
         what the pool is for. */
      const spare = await submitToColab({
        prompt: text, aspect, frames, model: model.kaggle || model.label, kind: 'video',
        seed: seed || undefined, init_image: initUrl || undefined
      });
      if (spare) {
        return {
          provider: 'colab',
          hardware: (spare.worker.gpu || 'an unnamed GPU') + ' \u00b7 Google Colab, lent to the order',
          model: model.label + ' \u00b7 Colab ' + (spare.worker.gpu || 'GPU'),
          requestId: spare.jobId,
          statusUrl: spare.worker.endpoint,
          responseUrl: spare.worker.endpoint
        };
      }
      const mins = claim.held && claim.held.started_at
        ? Math.round((Date.now() - new Date(claim.held.started_at).getTime()) / 60000)
        : null;
      return {
        error: 'Every GPU the order can reach is busy \u2014 the Kaggle notebook has been working for ' +
          (mins === null ? 'a while' : mins + ' minutes') + ' and no Colab account has a free ' +
          'runtime. Either wait, or press \u201cUse your own API\u201d under this box and film it ' +
          'through your own fal.ai, Replicate, Luma or other account.'
      };
    }
    const out = await pushKernelAnyAccount({
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
      hardware: 'Nvidia Tesla T4 16GB \u00b7 Kaggle, the order\u2019s own notebook',
      model: model.label + ' \u00b7 Kaggle T4',
      requestId: out.slug,
      statusUrl: out.slug,
      responseUrl: out.url
    };
  };

  const repKeys = own
    ? (own.provider === 'replicate' ? [{ id: 'own-' + Math.random().toString(36).slice(2, 8), label: 'your own Replicate token', secret: own.key }] : [])
    : await replicateAccounts();
  if (repKeys.length) {
    const won = await acrossAccounts('replicate', repKeys, async (account) => {
    const r = await call('https://api.replicate.com/v1/models/' +
      ((own && own.provider === 'replicate' && own.model) ? own.model : model.replicate) +
      '/predictions', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + account.secret, 'content-type': 'application/json' },
      body: JSON.stringify({
        input: Object.assign(
          { prompt: text, resolution: '480p', aspect_ratio: aspect, num_frames: frames },
          seed ? { seed } : {},
          initUrl ? { image: initUrl, first_frame_image: initUrl } : {}
        )
      })
    });
    if (!(r.ok && r.json && r.json.id)) {
      throw new Error('submit ' + r.status + ' ' + String(r.text).slice(0, 160));
    }
    {
      return {
        provider: 'replicate',
        hardware: 'Replicate hosted accelerator \u2014 A100 or H100 class, not named per job',
        model: model.label,
        requestId: r.json.id,
        statusUrl: (r.json.urls && r.json.urls.get) || ('https://api.replicate.com/v1/predictions/' + r.json.id),
        responseUrl: (r.json.urls && r.json.urls.get) || ('https://api.replicate.com/v1/predictions/' + r.json.id)
      };
    }
    });
    if (won) return won;
  }

  const viaKaggle = await tryKaggle();
  if (viaKaggle) return viaKaggle;

  return {
    error:
      'No video generator is reachable just now, and the honest reason is that the order has no ' +
      'GPU of its own awake and no paid key configured: HunyuanVideo 1.5 is open-weights, but the ' +
      'weights still have to run on somebody\'s card. No Colab worker is registered, the Kaggle ' +
      'notebook would not take the job, and there is no FAL_KEY or REPLICATE_API_TOKEN in this ' +
      'project. Two ways forward: press \u201cUse your own API\u201d under this box and film it ' +
      'through your own account at fal.ai, Replicate, Luma or anywhere else that takes a prompt ' +
      'over HTTPS \u2014 or open colab/egregora-gpu.ipynb in any Google account and run it, which ' +
      'lends the order a free GPU and takes about a minute.'
  };
}


/* --------------------------------------------------------------- progress
 *
 * Two kinds of progress exist here and they are not the same thing, so the
 * page is told which it is getting.
 *
 *   MEASURED  — the worker counted its own diffusion steps, or the provider
 *               reported a percentage in its logs. This is the truth.
 *   ESTIMATED — nobody is reporting anything, so we read the clock against
 *               how long this provider usually takes. Honest, but a guess,
 *               and labelled as one on the page.
 *
 * An estimate never passes 94%: a bar that sits at 99% for four minutes is a
 * lie, and a bar that reaches 100% before the file exists is a worse one.
 */
const EXPECTED = {            // seconds, roughly, by provider and kind
  fal:       { video: 190, image: 25 },
  replicate: { video: 240, image: 30 },
  colab:     { video: 330, image: 70 },
  kaggle:    { video: 1500, image: 900 }
};

function elapsedSeconds(row) {
  const t = row && (row.created_at || row.createdAt);
  if (!t) return 0;
  const ms = Date.now() - new Date(t).getTime();
  return Number.isFinite(ms) && ms > 0 ? ms / 1000 : 0;
}

export function estimateProgress(row) {
  const kind = row && row.kind === 'image' ? 'image' : 'video';
  const table = EXPECTED[row && row.provider] || EXPECTED.fal;
  const expect = table[kind] || 200;
  const frac = elapsedSeconds(row) / expect;
  /* ease out: quick to half, slow to the ceiling, never arriving on its own */
  const pct = 94 * (1 - Math.exp(-2.2 * frac));
  return Math.max(2, Math.min(94, Math.round(pct)));
}

/** Pull a percentage out of whatever a provider calls its logs. */
function progressFromLogs(text) {
  const t = String(text || '');
  let best = null;
  const pct = /(\d{1,3})\s?%/g;
  let m;
  while ((m = pct.exec(t))) {
    const n = Number(m[1]);
    if (n >= 0 && n <= 100) best = n;      // last one wins: logs run forwards
  }
  if (best !== null) return best;
  const steps = /(\d{1,4})\s*\/\s*(\d{1,4})/g;
  while ((m = steps.exec(t))) {
    const a = Number(m[1]); const b = Number(m[2]);
    if (b > 1 && a <= b) best = Math.round((a / b) * 100);
  }
  return best;
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
export async function pollVideo(row, byok) {
  if (!row || !row.request_id) return { status: 'failed', error: 'No job to check.' };

  /* A key brought by the member is never stored, so the page sends it again
     with every check. Without it there is nothing to ask the provider with. */
  const own = byok && typeof byok.key === 'string' && byok.key.trim()
    ? { provider: String(byok.provider || 'fal'), key: byok.key.trim() }
    : null;

  if (row.provider === 'byok') {
    if (!own) {
      return { status: 'running', progress: estimateProgress(row), measured: false,
        stage: 'waiting for your key to be handed over again' };
    }
    if (/^https?:\/\/.*\.(mp4|webm|mov)(\?|$)/i.test(String(row.status_url || ''))) {
      return { status: 'ready', url: row.status_url };
    }
    const r = await call(row.status_url, {
      headers: { authorization: 'Bearer ' + own.key, accept: 'application/json' }
    });
    if (!r.ok || !r.json) return { status: 'running', progress: estimateProgress(row), measured: false };
    const state = String(r.json.state || r.json.status || '').toLowerCase();
    if (state === 'failed' || state === 'error' || state === 'cancelled' || state === 'canceled') {
      return { status: 'failed',
        error: String((r.json.failure_reason || r.json.error || 'your provider gave up on that one')).slice(0, 300) };
    }
    const url = findVideoUrl(r.json);
    if (!url) return { status: 'running', progress: estimateProgress(row), measured: false };
    return { status: 'ready', url };
  }

  /* Kaggle is not an inference API: we ask the notebook how it is getting on,
     and when it finishes we pull the file it left in /kaggle/working. */
  if (row.provider === 'kaggle') {
    const slug = row.request_id;
    const pace = { progress: estimateProgress(row), measured: false };
    const st = await kernelStatus(slug);
    if (st.error) return { status: 'running', ...pace };

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
    if (st.status !== 'COMPLETE') return { status: 'running', ...pace };

    const out = await kernelOutput(slug);
    if (out.error) return { status: 'running', progress: 96, measured: false };
    const wantImage = row.kind === 'image';
    const pattern = wantImage ? /\.(png|jpe?g|webp)$/i : /\.mp4$/i;
    const file = (out.files || []).find((f) => pattern.test(f.name)) || (out.files || [])[0];
    if (!file) {
      await releaseGpu(slug, 'failed');
      return { status: 'failed', error: 'The notebook finished but left nothing behind.' };
    }

    const got = await fetchOutput(file.url);
    if (got.error) return { status: 'running', progress: 97, measured: false };

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

  /* A Colab worker keeps its own little job table in memory and hands back
     the finished file on request; we copy it into our storage as usual. */
  if (row.provider === 'colab') {
    const endpoint = row.status_url;
    const st = await colabStatus(endpoint, row.request_id);
    const state = String(st.status || 'running').toLowerCase();
    /* The notebook counts its own diffusion steps and reports them, so this is
       a measured figure rather than a clock-watching guess. */
    const counted = Number(st.progress);
    const measured = Number.isFinite(counted) && counted >= 0 && counted <= 100;
    const pace = {
      progress: measured ? Math.min(96, Math.round(counted)) : estimateProgress(row),
      measured,
      stage: st.stage ? String(st.stage).slice(0, 60) : undefined,
      hardware: st.gpu ? String(st.gpu).slice(0, 80) : undefined
    };
    if (state === 'failed' || state === 'error') {
      return { status: 'failed', error: String(st.error || 'The Colab worker gave up on that one.').slice(0, 300) };
    }
    if (state !== 'ready' && state !== 'done' && state !== 'complete') return { status: 'running', ...pace };

    const got = await colabFile(endpoint, row.request_id);
    if (got.error) return { status: 'running', ...pace, progress: 97 };
    try {
      const wantImage = row.kind === 'image';
      const skey = (wantImage ? 'oracle-art/' : 'oracle-videos/') +
        Date.now().toString(36) + (wantImage ? '.png' : '.mp4');
      await storage.put(skey, got.bytes, wantImage ? 'image/png' : 'video/mp4');
      const signed = await storage.url(skey, { ttl: 604800 });
      return { status: 'ready', url: signed, key: skey };
    } catch (err) {
      return { status: 'failed', error: 'The clip could not be stored: ' + (err && err.message) };
    }
  }

  const headers = {};
  if (own && own.provider === row.provider) {
    headers.authorization = (row.provider === 'fal' ? 'Key ' : 'Bearer ') + own.key;
  } else if (row.provider === 'fal') {
    const k = await key('FAL_KEY');
    if (!k) return { status: 'failed', error: 'The video key has been removed from this project.' };
    headers.authorization = 'Key ' + k;
  } else {
    const k = await key('REPLICATE_API_TOKEN');
    if (!k) return { status: 'failed', error: 'The video key has been removed from this project.' };
    headers.authorization = 'Bearer ' + k;
  }

  const sep = row.status_url.includes('?') ? '&' : '?';
  const s = await call(row.status_url + sep + 'logs=1', { headers });
  if (!s.ok || !s.json) return { status: 'running', progress: estimateProgress(row), measured: false };

  /* fal and Replicate both stream the sampler's own step counter into their
     logs when asked for them. If it is there, use it; the clock is only the
     fallback. */
  const logText = Array.isArray(s.json.logs)
    ? s.json.logs.map((l) => (l && l.message) || l || '').join('\n')
    : String(s.json.logs || '');
  const counted = progressFromLogs(logText);
  const queued = Number(s.json.queue_position);
  const pace = counted !== null && counted !== undefined
    ? { progress: Math.max(2, Math.min(96, counted)), measured: true }
    : { progress: Number.isFinite(queued) && queued > 0
          ? Math.max(2, Math.min(12, 12 - queued))
          : estimateProgress(row),
        measured: false,
        stage: Number.isFinite(queued) && queued > 0 ? ('queued, ' + queued + ' ahead') : undefined };

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

  if (!url) return { status: 'running', ...pace };

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
export async function submitKaggleImage(prompt, { repo = 'stabilityai/stable-diffusion-3.5-medium' } = {}) {
  const text = String(prompt || '').trim().slice(0, 1500);
  if (!(await kaggleAccountList()).length) return { error: 'No Kaggle account is configured.' };

  const busy = await gpuBusy();
  if (busy) {
    /* The Kaggle GPU is taken. Look across the Colab accounts for a
       runtime that is sitting idle before refusing the picture. */
    const spare = await submitToColab({ prompt: text, kind: 'image', model: repo });
    if (spare) {
      return {
        provider: 'colab',
        hardware: (spare.worker.gpu || 'an unnamed GPU') + ' \u00b7 Google Colab, lent to the order',
        model: 'Stable Diffusion \u00b7 Colab ' + (spare.worker.gpu || 'GPU'),
        requestId: spare.jobId,
        statusUrl: spare.worker.endpoint,
        responseUrl: spare.worker.endpoint
      };
    }
    return {
      error: busy.kind === 'video'
        ? 'The order\u2019s GPU is filming a clip just now and no Colab account has a free runtime. Try again shortly.'
        : 'Every GPU the order can reach is already drawing something. Try again shortly.'
    };
  }

  const slug = 'egregora-draw-' + Date.now().toString(36);
  const claim = await claimGpu('image', slug);
  if (!claim.ok) return { error: 'The order\u2019s GPU is busy. Try again shortly.' };

  const out = await pushKernelAnyAccount({
    slug,
    code: imageScript({ prompt: text, model: repo }),
    /* Stills are drawn on the cervixen account by preference, so the weekly
       GPU quota that films the clips is left alone. */
    prefer: 'cervixen'
  });
  if (out.error) {
    await releaseGpu(slug, 'failed');
    return { error: out.error };
  }
  return {
    provider: 'kaggle',
    hardware: 'Nvidia Tesla T4 16GB \u00b7 Kaggle, the order\u2019s own notebook',
    model: 'Stable Diffusion \u00b7 Kaggle T4',
    requestId: out.slug,
    statusUrl: out.slug,
    responseUrl: out.url
  };
}
