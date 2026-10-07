/**
 * Open-weights chat for the oracle.
 *
 * The order would rather its oracle thought with models anyone can download,
 * inspect and run themselves. This module speaks the OpenAI chat-completions
 * dialect to two routes that serve open-weights models, and runs the tool
 * loop itself so the oracle can still search, read, draw and open uploads.
 *
 *   1. OpenRouter, when the owner has pasted OPENROUTER_API_KEY — the strongest
 *      open models available: DeepSeek V3, Llama 3.3 70B, Qwen 3, Mistral.
 *   2. Pollinations' keyless OpenAI-compatible endpoint, so the oracle still
 *      thinks on a project with no keys configured at all.
 *
 * Hatchable's own `[ai]` gateway stays in `api/ask.js` as the last fallback.
 * Nothing here throws: a dead route returns null and the caller moves on.
 */
import { config } from 'hatchable';
import { colabChat } from './colab.js';

const TIMEOUT = 75000;
const MAX_STEPS = 6;

/* Open-weights models, strongest first. Every one of these has published
   weights — no closed models in this list. */
export const OPENROUTER_MODELS = [
  'deepseek/deepseek-chat-v3.1',
  'meta-llama/llama-3.3-70b-instruct',
  'qwen/qwen3-235b-a22b-instruct-2507',
  'mistralai/mistral-small-3.2-24b-instruct',
  'google/gemma-3-27b-it'
];

/* Pollinations' anonymous tier. Probed from the runner on 5 October 2026: the
   POST endpoint now answers 402 without a key, and the only model offered to
   anonymous callers is GPT-OSS 20B — OpenAI's open-weights release, served by
   OVH. The plain GET route still works and honours a `system` parameter, but
   it is rate-limited hard: two calls in quick succession and the third is a
   402. So it is kept as the last resort, not the mainstay. */
export const KEYLESS_MODELS = ['openai-fast'];

/* What a refusal looks like when it arrives dressed as an answer. The plain
   GET route answers HTTP 200 with the complaint in the body, so without this
   the oracle cheerfully reads out somebody's billing problem. */
const NOT_AN_ANSWER = /(api key|budget|rate.?limit|quota|unauthor|forbidden|try again later|no space left|internal server error)/i;
const refusal = (t) => t.length < 400 && NOT_AN_ANSWER.test(t);
const KEYLESS_GET = 'https://text.pollinations.ai/';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const KEYLESS_URL = 'https://text.pollinations.ai/openai';

/* ----------------------------------------------------------------- utils */

async function post(url, headers, body) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const r = await fetch(url, {
      method: 'POST',
      signal: ctrl.signal,
      headers: Object.assign({ 'content-type': 'application/json' }, headers),
      body: JSON.stringify(body)
    });
    if (!r.ok) {
      console.error('openchat: ' + url + ' returned ' + r.status);
      return null;
    }
    return await r.json();
  } catch (err) {
    console.error('openchat: ' + url + ' failed', err && err.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Turn the SDK-shaped tool map into OpenAI function definitions. */
function toolSchema(tools) {
  return Object.entries(tools || {}).map(([name, t]) => ({
    type: 'function',
    function: {
      name,
      description: t.description || '',
      parameters: t.inputSchema || { type: 'object', properties: {} }
    }
  }));
}

function parseArgs(raw) {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try { return JSON.parse(raw); } catch { return {}; }
}

/**
 * GPT-OSS 20B, keyless, through Pollinations' GET route — the only free
 * open-weights model on the public internet that will still answer this
 * project without an account. No tools, one shot, heavily rate-limited.
 */
/**
 * The 20B model ignores a good deal of the voice brief — it returns LaTeX,
 * markdown bold and, charmingly, "G ink". None of that can be spoken aloud,
 * so it is stripped on the way out rather than argued about on the way in.
 */
function plainify(text) {
  return String(text)
    .replace(/\\\[|\\\]|\\\(|\\\)/g, '')
    .replace(/\$\$?([^$]{1,200}?)\$\$?/g, '$1')
    .replace(/\\(?:tfrac|frac|dfrac)\s*\{([^}]*)\}\s*\{([^}]*)\}/g, '$1 over $2')
    .replace(/\\text\s*\{([^}]*)\}/g, '$1')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(^|\s)\*([^*\n]+)\*/g, '$1$2')
    .replace(/`{1,3}([^`]*)`{1,3}/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[*\-\u2022]\s+/gm, '')
    .replace(/^\s*\d+[.)]\s+/gm, '')
    .replace(/\bG\s+ink\b/g, 'Gink')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function keylessChat({ system, messages, maxTokens = 900 }) {
  const convo = (messages || [])
    .slice(-8)
    .map((m) => (m.role === 'assistant' ? 'Oracle: ' : 'Visitor: ') + String(m.content || ''))
    .join('\n\n');
  const prompt = convo.slice(-5000);
  if (!prompt) return null;

  /* Anonymous on purpose. Pollinations' deprecation notice is explicit that
     anonymous callers are unaffected, and a referrer or token attaches the
     call to somebody's account \u2014 whose budget then runs out and the answer
     comes back as a billing complaint instead of a reply. */
  const url = KEYLESS_GET + encodeURIComponent(prompt) +
    '?model=' + KEYLESS_MODELS[0] +
    '&system=' + encodeURIComponent(String(system || '').slice(0, 2500)) +
    '&seed=' + Math.floor(Math.random() * 1e6);

  for (let attempt = 0; attempt < 3; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
    try {
      const r = await fetch(url, { signal: ctrl.signal, headers: { accept: 'text/plain' } });
      if (r.status === 402 || r.status === 429) {
        await new Promise((res) => setTimeout(res, 1500 * (attempt + 1)));
        continue;
      }
      if (!r.ok) return null;
      const text = (await r.text()).trim();
      if (refusal(text)) {
        console.error('openchat: keyless route refused: ' + text.slice(0, 120));
        await new Promise((res) => setTimeout(res, 1200 * (attempt + 1)));
        continue;
      }
      if (text && text.length > 2 && !text.startsWith('{') && !text.startsWith('<')) {
        return {
          text: plainify(text).slice(0, maxTokens * 4),
          model: 'gpt-oss-20b (OVH, anonymous tier)',
          route: 'pollinations'
        };
      }
      return null;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

/* ------------------------------------------------------------- the loop */

/**
 * One full conversation turn against an open-weights model, tools and all.
 *
 * @param {object} opts
 * @param {string} opts.system        the system brief
 * @param {Array}  opts.messages      [{ role, content }]
 * @param {object} [opts.tools]       SDK-shaped tool map with execute()
 * @param {number} [opts.temperature]
 * @param {number} [opts.maxTokens]
 * @returns {Promise<{text:string, model:string, route:string}|null>}
 */
export async function openChat(opts) {
  const { system, messages, tools, temperature = 0.72, maxTokens = 1200 } = opts || {};
  if (!Array.isArray(messages) || !messages.length) return null;

  let key = null;
  try { key = await config.get('OPENROUTER_API_KEY'); } catch { key = null; }

  const routes = [];
  if (key) {
    routes.push({
      name: 'openrouter',
      url: OPENROUTER_URL,
      models: OPENROUTER_MODELS,
      headers: {
        authorization: 'Bearer ' + key,
        'http-referer': 'https://egregora.hatchable.site',
        'x-title': 'EGregoRA Oracle'
      }
    });
  }
  /* The keyless open-weights route, anonymously. Pollinations' anonymous
     tier serves GPT-OSS 20B \u2014 OpenAI's open-weights release, with reasoning
     and tool calling \u2014 and the deprecation notice on the older API is
     explicit that anonymous callers are unaffected. No key, no referrer, no
     account: nothing that can run out of budget mid-sentence. It sits below
     a configured OpenRouter key and above the plain GET fallback, and it is
     the route that actually answers on a project with no keys at all. */
  routes.push({
    name: 'pollinations',
    url: KEYLESS_URL,
    models: KEYLESS_MODELS,
    headers: { accept: 'application/json' }
  });

  const schema = toolSchema(tools);

  /* The order's own model first when a Colab worker is awake: open weights,
     running on a GPU the order borrowed rather than rented, with the tool
     loop intact. */
  const viaColab = await runColab({ system, messages, tools, schema, temperature, maxTokens });
  if (viaColab) return viaColab;

  for (const route of routes) {
    for (const model of route.models) {
      for (const withTools of schema.length ? [true, false] : [false]) {
        const convo = [{ role: 'system', content: system }].concat(
          messages.map((m) => ({ role: m.role, content: m.content }))
        );

        let steps = 0;
        let ok = true;

        while (steps <= MAX_STEPS) {
          const body = {
            model,
            messages: convo,
            temperature,
            max_tokens: maxTokens
          };
          if (withTools) { body.tools = schema; body.tool_choice = 'auto'; }

          const data = await post(route.url, route.headers, body);
          const choice = data && data.choices && data.choices[0];
          const msg = choice && choice.message;
          if (!msg) { ok = false; break; }

          const calls = msg.tool_calls || [];
          if (withTools && calls.length && steps < MAX_STEPS) {
            convo.push({
              role: 'assistant',
              content: msg.content || '',
              tool_calls: calls
            });
            for (const call of calls) {
              const fname = call && call.function && call.function.name;
              const tool = tools && tools[fname];
              let result;
              try {
                result = tool && typeof tool.execute === 'function'
                  ? await tool.execute(parseArgs(call.function.arguments))
                  : { error: 'No such tool: ' + fname };
              } catch (err) {
                result = { error: 'Tool failed: ' + (err && err.message) };
              }
              convo.push({
                role: 'tool',
                tool_call_id: call.id || fname,
                name: fname,
                content: JSON.stringify(result).slice(0, 12000)
              });
            }
            steps += 1;
            continue;
          }

          const text = String(msg.content || '').trim();
          if (text) return { text, model, route: route.name };
          ok = false;
          break;
        }

        if (!ok) continue;
      }
    }
  }

  /* Nothing with a key answered. One last try on the keyless open model. */
  return await keylessChat({ system, messages, maxTokens });
}

/* ------------------------------------------------- the order's own model */

/**
 * The same tool loop, but pointed at a Colab worker instead of a provider.
 * Kept separate because the worker speaks the dialect but is not a route in
 * the list above: it is found by capability, not by key.
 */
async function runColab({ system, messages, tools, schema, temperature, maxTokens }) {
  const convo = messages.map((m) => ({ role: m.role, content: m.content }));
  let steps = 0;

  while (steps <= MAX_STEPS) {
    const out = await colabChat({
      system,
      messages: convo,
      tools: schema.length ? schema : undefined,
      temperature,
      maxTokens
    });
    if (!out) return null;

    const msg = out.message;
    const calls = msg.tool_calls || [];
    if (calls.length && steps < MAX_STEPS) {
      convo.push({ role: 'assistant', content: msg.content || '', tool_calls: calls });
      for (const call of calls) {
        const fname = call && call.function && call.function.name;
        const tool = tools && tools[fname];
        let result;
        try {
          result = tool && typeof tool.execute === 'function'
            ? await tool.execute(parseArgs(call.function.arguments))
            : { error: 'No such tool: ' + fname };
        } catch (err) {
          result = { error: 'Tool failed: ' + (err && err.message) };
        }
        convo.push({
          role: 'tool',
          tool_call_id: call.id || fname,
          name: fname,
          content: JSON.stringify(result).slice(0, 12000)
        });
      }
      steps += 1;
      continue;
    }

    const text = String(msg.content || '').trim();
    if (text) return { text, model: out.model, route: 'colab' };
    return null;
  }
  return null;
}

/* ------------------------------------------------------- a key of one's own
 *
 * Probed from the live server on 7 October 2026: there is no longer any
 * keyless hosted chat route that answers. Pollinations returns 402 to this
 * machine's address, Hack Club's endpoint has gone, OpenRouter and GitHub
 * Models both refuse without a token. So the oracle is given the same door
 * the picture and the clip already have: a member may lend it a key of
 * their own for the length of one question.
 *
 * Three of these are free to obtain and take about two minutes: Google AI
 * Studio, Groq, and OpenRouter's free tier. The key is used for the one
 * request and is never stored, never logged, and never written to the
 * register.
 */
const MIND_ROUTES = {
  google: {
    label: 'Google AI Studio',
    model: 'gemini-2.0-flash',
    call: async (key, model, system, messages, maxTokens) => {
      const url = 'https://generativelanguage.googleapis.com/v1beta/models/' +
        encodeURIComponent(model) + ':generateContent?key=' + encodeURIComponent(key);
      const body = {
        systemInstruction: { parts: [{ text: String(system || '') }] },
        contents: messages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: String(m.content || '') }]
        })),
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.72 }
      };
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(TIMEOUT)
      });
      const data = await r.json().catch(() => null);
      const parts = data && data.candidates && data.candidates[0] &&
        data.candidates[0].content && data.candidates[0].content.parts;
      const text = Array.isArray(parts) ? parts.map((p) => p.text || '').join('') : '';
      return { ok: r.ok, text, why: (data && data.error && data.error.message) || ('HTTP ' + r.status) };
    }
  },
  groq: { label: 'Groq', model: 'llama-3.3-70b-versatile', url: 'https://api.groq.com/openai/v1/chat/completions' },
  openrouter: { label: 'OpenRouter', model: 'meta-llama/llama-3.3-70b-instruct:free', url: OPENROUTER_URL },
  openai: { label: 'OpenAI', model: 'gpt-4o-mini', url: 'https://api.openai.com/v1/chat/completions' },
  cerebras: { label: 'Cerebras', model: 'llama-3.3-70b', url: 'https://api.cerebras.ai/v1/chat/completions' },
  mistral: { label: 'Mistral', model: 'mistral-small-latest', url: 'https://api.mistral.ai/v1/chat/completions' },
  custom: { label: 'another service', model: '', url: '' }
};

export const MIND_PROVIDERS = Object.entries(MIND_ROUTES)
  .map(([key, r]) => ({ key, label: r.label, model: r.model }));

export async function chatWithOwnKey(own, { system, messages, maxTokens = 1200 }) {
  if (!own || typeof own.key !== 'string' || !own.key.trim()) return null;
  const route = MIND_ROUTES[String(own.provider || '')] || null;
  if (!route) return null;
  const key = own.key.trim();
  const model = (own.model && String(own.model).trim()) || route.model;
  const where = (own.base && String(own.base).trim()) || route.url;

  try {
    if (route.call) {
      const out = await route.call(key, model, system, messages, maxTokens);
      if (!out.ok || !out.text) {
        return { error: 'Your ' + route.label + ' key was refused: ' + String(out.why).slice(0, 200) };
      }
      return { text: plainify(out.text), model: model + ' (your own ' + route.label + ' key)', route: 'byok' };
    }
    if (!/^https:\/\//.test(where)) return { error: 'Give the https address of your provider.' };
    const r = await fetch(where, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: system }].concat(
          messages.map((m) => ({ role: m.role, content: m.content }))),
        temperature: 0.72,
        max_tokens: maxTokens
      }),
      signal: AbortSignal.timeout(TIMEOUT)
    });
    const data = await r.json().catch(() => null);
    const text = data && data.choices && data.choices[0] && data.choices[0].message &&
      data.choices[0].message.content;
    if (!r.ok || !text) {
      const why = (data && data.error && (data.error.message || data.error)) || ('HTTP ' + r.status);
      return { error: 'Your key was refused: ' + String(why).slice(0, 200) };
    }
    return { text: plainify(text), model: model + ' (your own key)', route: 'byok' };
  } catch (err) {
    return { error: 'That provider could not be reached: ' + ((err && err.message) || 'unknown') };
  }
}
