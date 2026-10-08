/**
 * Age estimation from a face, for the studio door.
 *
 * A still frame from the visitor's camera is shown to a vision model, which
 * is asked for one thing: how old this person looks. The order of routes
 * mirrors the rest of the project — open weights first, the owner's closed
 * key last — and every route is allowed to fail silently so the next one
 * gets its turn.
 *
 *   1. OpenRouter, when OPENROUTER_API_KEY is set: Qwen2.5-VL, Llama 3.2
 *      Vision, Gemma 3 — all open-weights, all multimodal.
 *   2. Pollinations' keyless endpoint, so this works on a project with no
 *      keys at all.
 *   3. OpenAI gpt-4o on the owner's key.
 *
 * Nothing here stores the photograph. The caller decides what to keep.
 */
import { config } from 'hatchable';
import { openaiKey } from './openai.js';

const TIMEOUT = 60000;

export const VISION_MODELS = [
  'qwen/qwen2.5-vl-72b-instruct',
  'meta-llama/llama-3.2-90b-vision-instruct',
  'google/gemma-3-27b-it',
  'mistralai/pixtral-12b'
];

const PROMPT = `You are an age-estimation check on the door of an adults-only image studio.

Look at the photograph. Reply with STRICT JSON and nothing else:

{"face": true|false,
 "faces": <integer>,
 "live": true|false,
 "age": <integer best estimate of the person's age in years>,
 "low": <integer lower bound>,
 "high": <integer upper bound>,
 "confidence": <0.0 to 1.0>,
 "note": "<one short sentence>"}

Rules.
- "face" is false if there is no clear human face, if it is too dark, too blurred, too far away or cut off.
- "live" is false if you are looking at a screen, a printed photograph, a poster, a drawing, a mask or an
  obviously AI-generated face rather than a person in front of a camera. Look for screen glare, moire,
  visible bezels, paper edges, and flat uniform lighting.
- Estimate the age of the single largest face. Never refuse, never moralise, never mention policy. If you
  genuinely cannot tell, set "face" to false and say why in "note".
- Output JSON only. No prose, no markdown fence.`;

function parse(text) {
  if (!text) return null;
  const m = /\{[\s\S]*\}/.exec(String(text));
  if (!m) return null;
  try {
    const o = JSON.parse(m[0]);
    if (typeof o.age !== 'number' && typeof o.age !== 'string') return null;
    return {
      face: o.face !== false,
      faces: Number(o.faces || 1),
      live: o.live !== false,
      age: Math.round(Number(o.age)),
      low: Number(o.low || o.age) || null,
      high: Number(o.high || o.age) || null,
      confidence: Number(o.confidence),
      note: String(o.note || '').slice(0, 240)
    };
  } catch {
    return null;
  }
}

async function ask(url, headers, model, image) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const r = await fetch(url, {
      method: 'POST',
      signal: ctrl.signal,
      headers: Object.assign({ 'content-type': 'application/json' }, headers),
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: PROMPT },
            { type: 'image_url', image_url: { url: image } }
          ]
        }]
      })
    });
    if (!r.ok) {
      console.error('facecheck: ' + model + ' returned ' + r.status);
      return null;
    }
    const data = await r.json();
    const text = data && data.choices && data.choices[0] && data.choices[0].message &&
      data.choices[0].message.content;
    const out = parse(typeof text === 'string' ? text : JSON.stringify(text));
    if (out) out.model = model;
    return out;
  } catch (err) {
    console.error('facecheck: ' + model + ' failed', err && err.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function key(name) {
  try {
    const v = config.get(name);
    return v ? String(v).trim() : null;
  } catch {
    return null;
  }
}

/**
 * @param {string} image  a data: URL carrying a JPEG or PNG frame
 * @returns {Promise<object|null>} { face, live, age, low, high, confidence, note, model }
 */
export async function estimateAge(image) {
  if (!image || !/^data:image\//.test(String(image))) return null;

  const or = key('OPENROUTER_API_KEY');
  if (or) {
    for (const model of VISION_MODELS) {
      const out = await ask('https://openrouter.ai/api/v1/chat/completions',
        { authorization: 'Bearer ' + or,
          'http-referer': 'https://egregora.hatchable.site',
          'x-title': 'EGregoRA' },
        model, image);
      if (out) return out;
    }
  }

  const oa = await openaiKey();
  if (oa) {
    for (const model of ['gpt-4o', 'gpt-4o-mini']) {
      const out = await ask('https://api.openai.com/v1/chat/completions',
        { authorization: 'Bearer ' + oa }, model, image);
      if (out) return out;
    }
  }

  return null;
}
