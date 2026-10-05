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
export const KEYLESS_MODELS = ['openai'];
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
export async function keylessChat({ system, messages, maxTokens = 900 }) {
  const convo = (messages || [])
    .slice(-8)
    .map((m) => (m.role === 'assistant' ? 'Oracle: ' : 'Visitor: ') + String(m.content || ''))
    .join('\n\n');
  const prompt = convo.slice(-5000);
  if (!prompt) return null;

  const url = KEYLESS_GET + encodeURIComponent(prompt) +
    '?model=openai&system=' + encodeURIComponent(String(system || '').slice(0, 2500));

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
      if (text && text.length > 2 && !text.startsWith('{')) {
        return { text: text.slice(0, maxTokens * 4), model: 'gpt-oss-20b', route: 'pollinations' };
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
