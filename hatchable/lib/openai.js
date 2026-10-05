/**
 * Direct OpenAI access for the oracle.
 *
 * The project owner supplied a key for the order's own use. It resolves
 * through `config.get('OPENAI_API_KEY')`, which walks the buyer's pasted
 * value first and falls back to the default declared in hatchable.toml — so
 * pasting a fresh key on the Setup page silently replaces this one, with no
 * redeploy.
 *
 * This is a server-side module. The key never reaches the browser: the only
 * things that cross the wire are the finished answer and the finished image.
 *
 * Order of thinking in api/ask.js is unchanged in spirit — open-weights
 * models are still asked first, because the order would rather reason with a
 * model anyone can download. OpenAI is the strong fallback beneath them.
 */
import { config } from 'hatchable';
import { storedOpenAIKey } from './key-store.js';

const CHAT_URL = 'https://api.openai.com/v1/chat/completions';
const IMAGE_URL = 'https://api.openai.com/v1/images/generations';
const TIMEOUT = 75000;
const MAX_STEPS = 6;

/* Strongest first; each is tried if the one before is unavailable. */
export const CHAT_MODELS = ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1-mini'];

export async function openaiKey() {
  try {
    const k = await config.get('OPENAI_API_KEY');
    if (k) return String(k).trim();
  } catch { /* fall through to the stored key */ }
  const stored = storedOpenAIKey();
  return stored ? stored.trim() : null;
}

async function post(url, key, body) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const r = await fetch(url, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key },
      body: JSON.stringify(body)
    });
    const json = await r.json().catch(() => null);
    if (!r.ok) {
      console.error('openai: ' + url + ' returned ' + r.status,
        json && json.error && json.error.message);
      return null;
    }
    return json;
  } catch (err) {
    console.error('openai: ' + url + ' failed', err && err.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

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
 * One conversation turn against OpenAI, running the tool loop here so the
 * oracle can still search, read, draw, film and open uploads.
 * @returns {Promise<{text:string, model:string, route:string}|null>}
 */
export async function openaiChat({ system, messages, tools, temperature = 0.72, maxTokens = 1200 }) {
  const key = await openaiKey();
  if (!key || !Array.isArray(messages) || !messages.length) return null;

  const schema = toolSchema(tools);

  for (const model of CHAT_MODELS) {
    for (const withTools of schema.length ? [true, false] : [false]) {
      const convo = [{ role: 'system', content: system }].concat(
        messages.map((m) => ({ role: m.role, content: m.content }))
      );

      for (let step = 0; step <= MAX_STEPS; step += 1) {
        const body = { model, messages: convo, temperature, max_tokens: maxTokens };
        if (withTools) { body.tools = schema; body.tool_choice = 'auto'; }

        const data = await post(CHAT_URL, key, body);
        const msg = data && data.choices && data.choices[0] && data.choices[0].message;
        if (!msg) break;

        const calls = msg.tool_calls || [];
        if (withTools && calls.length && step < MAX_STEPS) {
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
          continue;
        }

        const text = String(msg.content || '').trim();
        if (text) return { text, model, route: 'openai' };
        break;
      }
    }
  }

  return null;
}

/**
 * One image, straight from OpenAI, when the open-weights generators are down.
 * @returns {Promise<{bytes:Uint8Array, contentType:string, provider:string}|null>}
 */
export async function openaiImage(prompt) {
  const key = await openaiKey();
  if (!key) return null;
  const data = await post(IMAGE_URL, key, {
    model: 'gpt-image-1',
    prompt: String(prompt).slice(0, 4000),
    size: '1024x1024',
    n: 1
  });
  const b64 = data && data.data && data.data[0] && data.data[0].b64_json;
  if (!b64) return null;
  return {
    bytes: Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)),
    contentType: 'image/png',
    provider: 'gpt-image-1 (OpenAI)'
  };
}
